// 微信小程序登录 Edge Function
// 流程：小程序 wx.login 拿到 code → 调用本函数 → 用 code 换 openid/unionid
// → 查 wechat_bindings：已绑定则签发 magiclink，未绑定则返回 openid 让前端走绑定流程
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, action, email } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appid = Deno.env.get("WECHAT_MINIAPP_APPID");
    const secret = Deno.env.get("WECHAT_MINIAPP_SECRET");
    if (!appid || !secret) {
      return new Response(
        JSON.stringify({ error: "WeChat credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. code2Session
    const wxRes = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`,
    );
    const wxData = await wxRes.json();
    if (wxData.errcode) {
      return new Response(JSON.stringify({ error: "WeChat auth failed", detail: wxData }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { openid, unionid } = wxData;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2. 查找绑定
    const { data: binding } = await admin
      .from("wechat_bindings")
      .select("user_id")
      .eq("openid", openid)
      .maybeSingle();

    // 3a. 已绑定 → 生成 magic link
    if (binding) {
      const { data: userInfo } = await admin.auth.admin.getUserById(binding.user_id);
      const userEmail = userInfo?.user?.email;
      if (!userEmail) {
        return new Response(JSON.stringify({ error: "Bound user has no email" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: link, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
      });
      if (error) throw error;
      return new Response(
        JSON.stringify({
          status: "logged_in",
          user_id: binding.user_id,
          email: userEmail,
          // 小程序端用 hashed_token 调 verifyOtp 拿 session
          hashed_token: link.properties?.hashed_token,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3b. 未绑定 + bind action → 绑定到指定邮箱账号
    if (action === "bind" && email) {
      const { data: list } = await admin.auth.admin.listUsers();
      const user = list?.users?.find((u) => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "Email not registered" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await admin.from("wechat_bindings").insert({
        user_id: user.id,
        openid,
        unionid: unionid ?? null,
      });
      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      return new Response(
        JSON.stringify({
          status: "bound",
          user_id: user.id,
          email,
          hashed_token: link?.properties?.hashed_token,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3c. 未绑定 → 让前端引导绑定
    return new Response(
      JSON.stringify({ status: "needs_binding", openid, unionid: unionid ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
