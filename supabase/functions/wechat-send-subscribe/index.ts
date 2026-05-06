// 调用微信订阅消息接口，给指定用户推送 To-do 提醒
// 调用方：cron job 或 内部 Edge Function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(appid: string, secret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`,
  );
  const data = await res.json();
  if (!data.access_token) throw new Error(`Failed to get access_token: ${JSON.stringify(data)}`);
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, template_id, data, page, todo_id } = await req.json();
    const appid = Deno.env.get("WECHAT_MINIAPP_APPID");
    const secret = Deno.env.get("WECHAT_MINIAPP_SECRET");
    if (!appid || !secret) throw new Error("WeChat credentials not configured");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: binding } = await admin
      .from("wechat_bindings")
      .select("openid")
      .eq("user_id", user_id)
      .maybeSingle();
    if (!binding) throw new Error("User has no WeChat binding");

    // 检查授权配额
    const { data: auth } = await admin
      .from("wechat_subscribe_authorizations")
      .select("remaining_quota")
      .eq("user_id", user_id)
      .eq("template_id", template_id)
      .maybeSingle();

    if (!auth || auth.remaining_quota <= 0) {
      await admin.from("wechat_message_logs").insert({
        user_id,
        openid: binding.openid,
        template_id,
        related_todo_id: todo_id ?? null,
        payload: data,
        status: "skipped_no_quota",
      });
      return new Response(JSON.stringify({ status: "skipped_no_quota" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getAccessToken(appid, secret);
    const wxRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touser: binding.openid,
          template_id,
          page: page ?? "pages/todo/index",
          data,
          miniprogram_state: "formal",
          lang: "zh_CN",
        }),
      },
    );
    const wxData = await wxRes.json();
    const success = wxData.errcode === 0;

    await admin.from("wechat_message_logs").insert({
      user_id,
      openid: binding.openid,
      template_id,
      related_todo_id: todo_id ?? null,
      payload: data,
      status: success ? "sent" : "failed",
      error_message: success ? null : JSON.stringify(wxData),
    });

    if (success) {
      await admin
        .from("wechat_subscribe_authorizations")
        .update({ remaining_quota: auth.remaining_quota - 1 })
        .eq("user_id", user_id)
        .eq("template_id", template_id);
    }

    return new Response(JSON.stringify({ status: success ? "sent" : "failed", wx: wxData }), {
      status: success ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
