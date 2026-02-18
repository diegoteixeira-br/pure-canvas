import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const { influencer_id, action } = body;

    // Action: update term template content (requires super_admin auth)
    if (action === "update_term_content") {
      // Validate authentication
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userSupabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claimsData.claims.sub;
      // Verify super_admin role
      const { data: isSuperAdmin } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "super_admin")
        .maybeSingle();

      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { term_id, content, version } = body;
      const { error } = await supabase
        .from("influencer_term_templates")
        .update({ content, version, updated_at: new Date().toISOString() })
        .eq("id", term_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default action: send email
    if (!influencer_id) {
      return new Response(JSON.stringify({ error: "influencer_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inf, error: infErr } = await supabase
      .from("influencer_partnerships")
      .select("*")
      .eq("id", influencer_id)
      .single();

    if (infErr || !inf) {
      return new Response(JSON.stringify({ error: "Influenciador não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!inf.email) {
      return new Response(JSON.stringify({ error: "Influenciador não possui email cadastrado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const termLink = `https://barbersoft.com.br/termo-influenciador/${inf.term_token}`;
    const referralLink = `https://barbersoft.com.br/auth?tab=signup&ref=${inf.referral_code}`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "BarberSoft <noreply@barbersoft.com.br>",
        to: [inf.email],
        subject: "Termo de Parceria - BarberSoft",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF6B00; text-align: center;">BarberSoft</h1>
            <h2 style="text-align: center;">Termo de Parceria com Influenciador</h2>
            <p>Olá, <strong>${inf.name}</strong>!</p>
            <p>Você foi convidado(a) para se tornar um influenciador parceiro da BarberSoft.</p>
            <p>Sua comissão será de <strong>${inf.commission_percent}%</strong> sobre o valor pago por cada lead vinculado ao seu link, válida por <strong>12 meses</strong> a partir do cadastro de cada lead.</p>
            <p>Para visualizar e aceitar o termo de parceria, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${termLink}" style="background-color: #FF6B00; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Visualizar e Aceitar Termo
              </a>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">
              Se o botão não funcionar, copie e cole este link no navegador:<br/>
              <a href="${termLink}">${termLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <div style="background-color: #f8f8f8; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="font-weight: bold; margin: 0 0 8px 0;">🔗 Seu link de indicação:</p>
              <p style="background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 10px; word-break: break-all; font-size: 13px; margin: 0;">
                <a href="${referralLink}">${referralLink}</a>
              </p>
              <p style="color: #666; font-size: 11px; margin: 8px 0 0 0;">
                Compartilhe este link para que seus leads se cadastrem e você receba sua comissão.
              </p>
            </div>
            <p style="color: #999; font-size: 11px; text-align: center;">
              BarberSoft - Sistema de Gestão para Barbearias
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Erro ao enviar email", details: errBody }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Email enviado com sucesso" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
