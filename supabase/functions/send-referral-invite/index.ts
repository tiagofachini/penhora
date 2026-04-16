import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://go.penhora.app.br';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // Verify caller JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return respond({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    const { invitee_email, resend = false, referral_id } = body;
    if (!invitee_email) return respond({ error: 'Email é obrigatório' }, 400);

    const email = invitee_email.trim().toLowerCase();
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- RESEND: reset expired referral and re-invite ---
    if (resend && referral_id) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error: updateError } = await supabaseAdmin.from('referrals').update({
        status: 'invited',
        invited_at: new Date().toISOString(),
        expires_at: expiresAt,
        registered_at: null,
      }).eq('id', referral_id).eq('referrer_id', user.id);
      if (updateError) {
        console.error('Resend update error:', updateError.message);
        throw updateError;
      }

      const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${APP_URL}/dashboard`,
      });
      if (inviteErr) {
        console.error('inviteUserByEmail resend error:', inviteErr.message, JSON.stringify(inviteErr));
        // Rollback status to expired
        await supabaseAdmin.from('referrals').update({ status: 'expired' }).eq('id', referral_id);
        throw new Error(`Falha ao enviar email: ${inviteErr.message}`);
      }
      return respond({ success: true });
    }

    // --- CHECK: already a registered user in public.users ---
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (userCheckError) console.error('User check error:', userCheckError.message);
    if (existingUser) return respond({ error: 'Este email já possui uma conta no Penhora.app.br.' }, 400);

    // --- CHECK: active duplicate referral from this user ---
    const { data: existingReferral, error: refCheckError } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referrer_id', user.id)
      .ilike('invitee_email', email)
      .neq('status', 'expired')
      .maybeSingle();
    if (refCheckError) console.error('Referral check error:', refCheckError.message);
    if (existingReferral) return respond({ error: 'Você já convidou este email. Aguarde o prazo expirar para reconvidar.' }, 400);

    // --- INSERT referral record ---
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: referral, error: insertError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: user.id,
        invitee_email: email,
        status: 'invited',
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (insertError) {
      console.error('Insert referral error:', insertError.message);
      throw insertError;
    }

    // --- SEND invite email ---
    // redirectTo must be in the Supabase allowed redirect URLs list.
    // /dashboard is already allowed (used by invite-team-member).
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/dashboard`,
    });
    if (inviteError) {
      console.error('inviteUserByEmail error:', inviteError.message, JSON.stringify(inviteError));
      // Rollback: remove the referral we just inserted
      await supabaseAdmin.from('referrals').delete().eq('id', referral.id);
      throw new Error(`Falha ao enviar email de convite: ${inviteError.message}`);
    }

    console.log(`Referral invite sent successfully to ${email} by ${user.id}`);
    return respond({ success: true });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('send-referral-invite fatal error:', msg);
    return respond({ error: msg }, 500);
  }
});
