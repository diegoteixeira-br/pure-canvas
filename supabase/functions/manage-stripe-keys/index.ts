import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user auth and super_admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check super_admin role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "get") {
      // Return masked keys (only show first/last few chars)
      const { data: settings, error } = await serviceClient
        .from("saas_settings")
        .select("stripe_test_publishable_key, stripe_test_secret_key, stripe_live_publishable_key, stripe_live_secret_key, stripe_webhook_secret, meta_access_token")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const mask = (val: string | null): string => {
        if (!val) return "";
        if (val.length <= 12) return "••••••••";
        return val.substring(0, 7) + "••••••••" + val.substring(val.length - 4);
      };

      return new Response(JSON.stringify({
        stripe_test_publishable_key: settings?.stripe_test_publishable_key || "",
        stripe_test_secret_key_masked: mask(settings?.stripe_test_secret_key),
        stripe_live_publishable_key: settings?.stripe_live_publishable_key || "",
        stripe_live_secret_key_masked: mask(settings?.stripe_live_secret_key),
        stripe_webhook_secret_masked: mask(settings?.stripe_webhook_secret),
        meta_access_token_masked: mask(settings?.meta_access_token),
        has_test_secret: !!settings?.stripe_test_secret_key,
        has_live_secret: !!settings?.stripe_live_secret_key,
        has_webhook_secret: !!settings?.stripe_webhook_secret,
        has_meta_token: !!settings?.meta_access_token,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      const { 
        stripe_test_publishable_key, stripe_test_secret_key,
        stripe_live_publishable_key, stripe_live_secret_key,
        stripe_webhook_secret, meta_access_token
      } = body;

      // Build update object - only include fields that were actually provided
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      if (stripe_test_publishable_key !== undefined) updates.stripe_test_publishable_key = stripe_test_publishable_key;
      if (stripe_test_secret_key !== undefined) updates.stripe_test_secret_key = stripe_test_secret_key;
      if (stripe_live_publishable_key !== undefined) updates.stripe_live_publishable_key = stripe_live_publishable_key;
      if (stripe_live_secret_key !== undefined) updates.stripe_live_secret_key = stripe_live_secret_key;
      if (stripe_webhook_secret !== undefined) updates.stripe_webhook_secret = stripe_webhook_secret;
      if (meta_access_token !== undefined) updates.meta_access_token = meta_access_token;

      // Get settings id
      const { data: existing } = await serviceClient
        .from("saas_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) {
        return new Response(JSON.stringify({ error: "Configurações não encontradas" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await serviceClient
        .from("saas_settings")
        .update(updates)
        .eq("id", existing.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("manage-stripe-keys error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
