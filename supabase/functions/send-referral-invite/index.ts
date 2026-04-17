import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://www.penhora.app.br';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return respond({ error: 'Serviço de email não configurado.' }, 500);
    }

    // Verify caller JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return respond({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { invitee_email, resend = false, referral_id } = body;
    if (!invitee_email) return respond({ error: 'Email é obrigatório' }, 400);

    const email = invitee_email.trim().toLowerCase();
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get referrer name for the email
    const { data: referrerProfile } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();
    const referrerName = referrerProfile?.name || 'Um usuário';

    // --- RESEND MODE: update existing referral and resend ---
    if (resend && referral_id) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from('referrals').update({
        status: 'invited',
        invited_at: new Date().toISOString(),
        expires_at: expiresAt,
        registered_at: null,
      }).eq('id', referral_id).eq('referrer_id', user.id);

      await sendInviteEmail(email, referrerName);
      return respond({ success: true });
    }

    // --- CHECK: already registered ---
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (existingUser) {
      return respond({ error: 'Este email já possui uma conta no Penhora.app.br.' }, 400);
    }

    // --- CHECK: already has active (non-expired) invite → update and resend ---
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', user.id)
      .ilike('invitee_email', email)
      .neq('status', 'expired')
      .maybeSingle();

    if (existingReferral) {
      if (existingReferral.status === 'registered') {
        return respond({ error: 'Este contato já se cadastrou através do seu convite.' }, 400);
      }
      // Status is 'invited' — just resend
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from('referrals').update({
        invited_at: new Date().toISOString(),
        expires_at: expiresAt,
      }).eq('id', existingReferral.id);

      await sendInviteEmail(email, referrerName);
      return respond({ success: true });
    }

    // --- INSERT new referral record ---
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: user.id,
        invitee_email: email,
        status: 'invited',
        expires_at: expiresAt,
      });
    if (insertError) {
      console.error('Insert referral error:', insertError.message);
      throw insertError;
    }

    // --- SEND invite email via Resend ---
    await sendInviteEmail(email, referrerName);

    console.log(`Referral invite sent via Resend to ${email} by ${user.id}`);
    return respond({ success: true });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('send-referral-invite fatal error:', msg);
    return respond({ error: msg }, 500);
  }
});

async function sendInviteEmail(to: string, referrerName: string) {
  const signupUrl = `${APP_URL}/signup`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#7c3aed;padding:32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">Penhora.app</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <h2 style="color:#1e293b;margin:0 0 16px;">Você foi convidado!</h2>
            <p style="color:#475569;margin:0 0 24px;">
              <strong>${referrerName}</strong> te convidou para conhecer o <strong>Penhora.app.br</strong>,
              a plataforma de gestão de penhoras e diligências judiciais.
            </p>
            <p style="color:#475569;margin:0 0 32px;">
              Crie sua conta gratuita e comece a usar agora mesmo.
            </p>
            <div style="text-align:center;margin:0 0 32px;">
              <a href="${signupUrl}"
                 style="background:#7c3aed;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
                Criar minha conta
              </a>
            </div>
            <p style="color:#94a3b8;font-size:13px;border-top:1px solid #e2e8f0;padding-top:20px;margin:0;">
              Se você não esperava este convite, pode ignorar este email com segurança.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;padding:20px 32px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">Penhora.app &mdash; Gestão de Penhoras</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Penhora.app <noreply@penhora.app.br>',
      to,
      subject: `${referrerName} te convidou para o Penhora.app`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    throw new Error(`Falha ao enviar email: ${err}`);
  }
}
