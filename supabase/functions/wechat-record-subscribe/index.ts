// 小程序端用户点击订阅授权后调用，记录配额 +1
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { template_ids } = await req.json();
    if (!Array.isArray(template_ids)) {
      return new Response(JSON.stringify({ error: "template_ids must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    for (const tid of template_ids) {
      const { data: existing } = await admin
        .from("wechat_subscribe_authorizations")
        .select("remaining_quota")
        .eq("user_id", user.id)
        .eq("template_id", tid)
        .maybeSingle();

      if (existing) {
        await admin
          .from("wechat_subscribe_authorizations")
          .update({
            remaining_quota: existing.remaining_quota + 1,
            last_authorized_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("template_id", tid);
      } else {
        await admin.from("wechat_subscribe_authorizations").insert({
          user_id: user.id,
          template_id: tid,
          remaining_quota: 1,
        });
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
