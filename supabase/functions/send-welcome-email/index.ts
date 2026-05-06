import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, phone } = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email e nome são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verificar se email já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some((u: { email?: string }) => u.email === email);
    if (alreadyExists) {
      return new Response(
        JSON.stringify({ error: 'user_already_registered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar usuário via admin API (sem email de confirmação do Supabase)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, phone: phone || '' },
    });

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar magic link para o primeiro acesso
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: 'https://www.penhora.app.br/dashboard',
      },
    });

    if (linkError) {
      console.error('Magic link generation error:', linkError);
      return new Response(
        JSON.stringify({ error: `Falha ao gerar link de acesso: ${linkError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessLink = linkData.properties?.action_link ?? 'https://www.penhora.app.br/login';

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured — welcome email skipped');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Set RESEND_API_KEY secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1e40af;padding:32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;">Penhora.app</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="color:#1e293b;margin:0 0 16px;">Bem-vindo, ${name}!</h2>
                  <p style="color:#475569;margin:0 0 24px;">Sua conta foi criada com sucesso. Clique no botão abaixo para acessar o sistema:</p>
                  <div style="margin:32px 0;text-align:center;">
                    <a href="${accessLink}"
                       style="background:#1e40af;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                      Acessar o Sistema
                    </a>
                  </div>
                  <p style="color:#475569;margin:0 0 8px;"><strong>Email de acesso:</strong> ${email}</p>
                  <p style="color:#94a3b8;font-size:13px;border-top:1px solid #e2e8f0;padding-top:20px;margin:24px 0 0;">
                    Este link é de uso único e expira em 24 horas. Caso expire, acesse
                    <a href="https://www.penhora.app.br/login" style="color:#1e40af;">penhora.app.br/login</a>
                    e solicite um novo link pelo seu email.
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
      </html>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Penhora.app <noreply@penhora.app.br>',
        to: email,
        subject: 'Seu acesso ao Penhora.app',
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const resendErr = await resendRes.text();
      console.error('Resend error:', resendErr);
      return new Response(
        JSON.stringify({ error: `Falha ao enviar email: ${resendErr}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('send-welcome-email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
