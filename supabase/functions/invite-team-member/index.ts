import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const APP_URL = "https://www.penhora.app.br";

const DEFAULT_PERMISSIONS = {
  processes: { view: true, edit: true, delete: false },
  people: { view: true, edit: false, delete: false },
  calendar: { view: true, edit: true, delete: false },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }

    // Verify caller identity
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }

    // Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { member_email, role = "member", permissions, resend = false } = body;

    if (!member_email) {
      return new Response(JSON.stringify({ error: "E-mail obrigatório." }), { status: 400, headers: CORS });
    }

    const email = member_email.toLowerCase().trim();

    // --- Resend mode: just re-send the invite email for a pending member ---
    if (resend) {
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${APP_URL}/dashboard`,
        data: { invited_by: user.id },
      });
      return new Response(
        JSON.stringify({ success: !inviteError, error: inviteError?.message }),
        { status: inviteError ? 400 : 200, headers: CORS }
      );
    }

    // 1. Check if email belongs to another team
    const { data: otherTeam } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("member_email", email)
      .neq("owner_id", user.id)
      .maybeSingle();

    if (otherTeam) {
      return new Response(
        JSON.stringify({ error: "Este e-mail já pertence à equipe de outra conta. Um usuário só pode pertencer a uma equipe por vez." }),
        { status: 400, headers: CORS }
      );
    }

    // 2. Check if already in this team
    const { data: existing } = await supabaseAdmin
      .from("team_members")
      .select("id, status")
      .eq("owner_id", user.id)
      .eq("member_email", email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: `Este e-mail já está na equipe (status: ${existing.status}).` }),
        { status: 400, headers: CORS }
      );
    }

    // 3. Check if user already has an account in public.users
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    const finalPermissions = permissions || DEFAULT_PERMISSIONS;
    const memberId = existingUser?.id ?? null;
    const status = existingUser ? "active" : "pending";

    // 4. Insert team_members record
    const { data: teamMember, error: insertError } = await supabaseAdmin
      .from("team_members")
      .insert({
        owner_id: user.id,
        member_email: email,
        member_id: memberId,
        role,
        permissions: finalPermissions,
        status,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Send invitation email for new users
    let emailSent = false;
    if (!existingUser) {
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${APP_URL}/dashboard`,
        data: { invited_by: user.id },
      });
      emailSent = !inviteError;
      if (inviteError) console.error("Invite email error:", inviteError.message);
    } else {
      emailSent = true; // Already has account — activated on their next login
    }

    return new Response(
      JSON.stringify({ success: true, member: teamMember, emailSent, existingUser: !!existingUser }),
      { status: 200, headers: CORS }
    );

  } catch (err) {
    console.error("invite-team-member error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: CORS }
    );
  }
});
