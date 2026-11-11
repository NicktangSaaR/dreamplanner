// "Forgot password" for every account: by email or by username.
// POST { identifier, redirect_to? } -> always { ok: true } (never says whether an account exists)
//
// Students created with a username have an internal login address that gets
// no mail, so the reset link goes to the email in their profile instead.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const ok = () => new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
const SITE = "https://dreamplaneredu.com";
const ALLOWED_REDIRECT = /^https:\/\/([a-z0-9-]+--)?(dreamplaneredu\.com|comfy-kitsune-f4be24\.netlify\.app)\/reset-password$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: cors });

  let identifier = "";
  let redirectTo = `${SITE}/reset-password`;
  try {
    const body = await req.json();
    identifier = String(body.identifier ?? "").trim().toLowerCase();
    if (typeof body.redirect_to === "string" && ALLOWED_REDIRECT.test(body.redirect_to)) redirectTo = body.redirect_to;
  } catch {
    return ok();
  }
  if (!identifier || identifier.length > 200) return ok();

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // find the account: a username, or the email in a profile
  const { data: profile } = identifier.includes("@")
    ? await admin.from("profiles").select("id, email, full_name").ilike("email", identifier).limit(1).maybeSingle()
    : await admin.from("profiles").select("id, email, full_name").eq("username", identifier).maybeSingle();
  if (!profile?.email) {
    console.log("request-password-reset: no account or no email for", identifier.includes("@") ? "an email" : "a username");
    return ok();
  }
  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  const loginEmail = authUser?.user?.email;
  if (!loginEmail) return ok();

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email: loginEmail, options: { redirectTo } });
  if (error || !link?.properties?.action_link) {
    console.error("request-password-reset generateLink", error);
    return ok();
  }
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.error("request-password-reset: RESEND_API_KEY missing");
    return ok();
  }
  const href = link.properties.action_link;
  const name = String(profile.full_name || "").replace(/[<>&"']/g, "");
  const { error: sendErr } = await new Resend(key).emails.send({
    from: "DreamPlanner <noreply@dreamplaneredu.com>",
    to: [profile.email],
    subject: "重置 DreamPlanner 密码 · Reset your DreamPlanner password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p>${name ? `${name}，你好：` : "你好："}</p>
        <p>我们收到了重置你 DreamPlanner 密码的请求。点击下面的按钮设置新密码（链接 1 小时内有效）：</p>
        <p><a href="${href}" style="display:inline-block;padding:10px 20px;background:#1f5c4d;color:#fff;text-decoration:none;border-radius:6px;">设置新密码</a></p>
        <p>We received a request to reset your DreamPlanner password. <a href="${href}">Set a new password</a> (the link works for 1 hour).</p>
        <p style="color:#666;font-size:13px;">如果不是你本人操作，可以忽略这封邮件，你的密码不会改变。If this wasn't you, ignore this email; your password won't change.</p>
      </div>`,
  });
  if (sendErr) console.error("request-password-reset send", sendErr);
  return ok();
});
