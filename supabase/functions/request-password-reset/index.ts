// "Forgot password" for every account: by email or by username.
// POST { identifier, redirect_to? } -> { ok, found, sent }
//
// Students created with a username have an internal login address that gets
// no mail, so the reset link goes to the email in their profile instead.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";
import { type EmailLang, emailLang, inOrder, subjectFor } from "../_shared/emailLang.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reply = (body: Record<string, unknown>) => new Response(JSON.stringify(body), { headers: { ...cors, "Content-Type": "application/json" } });
const ok = () => reply({ ok: true });
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

  // Find the account. An email can match the profile email or the login email
  // (they differ on some accounts); a username matches the profile.
  const INTERNAL = /@student\.dreamplaneredu\.com$/i;
  type Hit = { userId: string; loginEmail: string; sendTo: string; name: string; lang: EmailLang };
  let hit: Hit | null = null;
  const byProfile = identifier.includes("@")
    ? await admin.from("profiles").select("id, email, full_name, email_language").ilike("email", identifier.replace(/[%_\\]/g, "\\$&")).limit(1).maybeSingle()
    : await admin.from("profiles").select("id, email, full_name, email_language").eq("username", identifier).maybeSingle();
  if (byProfile.data) {
    const { data: u } = await admin.auth.admin.getUserById(byProfile.data.id);
    const loginEmail = u?.user?.email ?? "";
    // send to the profile email; fall back to a real login email
    const sendTo = byProfile.data.email || (INTERNAL.test(loginEmail) ? "" : loginEmail);
    if (loginEmail && sendTo) hit = { userId: byProfile.data.id, loginEmail, sendTo, name: byProfile.data.full_name ?? "", lang: emailLang(byProfile.data.email_language) };
  }

  let link: { properties?: { action_link?: string } | null } | null = null;
  if (hit) {
    const r = await admin.auth.admin.generateLink({ type: "recovery", email: hit.loginEmail, options: { redirectTo } });
    if (r.error) console.error("request-password-reset generateLink", r.error.message);
    link = r.data;
  } else if (identifier.includes("@") && !INTERNAL.test(identifier)) {
    // not a profile email: try it as the login email (errors if no such user)
    const r = await admin.auth.admin.generateLink({ type: "recovery", email: identifier, options: { redirectTo } });
    if (!r.error && r.data?.user) {
      const { data: prof } = await admin.from("profiles").select("full_name, email_language").eq("id", r.data.user.id).maybeSingle();
      hit = { userId: r.data.user.id, loginEmail: identifier, sendTo: identifier, name: prof?.full_name ?? "", lang: emailLang(prof?.email_language) };
      link = r.data;
    }
  }
  if (!hit) {
    console.log("request-password-reset: no account for", identifier.includes("@") ? "an email" : "a username");
    return reply({ ok: true, found: false });
  }
  if (!link?.properties?.action_link) return reply({ ok: true, found: true, sent: false });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    console.error("request-password-reset: RESEND_API_KEY missing");
    return reply({ ok: true, found: true, sent: false });
  }
  const href = link.properties.action_link;
  const name = String(hit.name || "").replace(/[<>&"']/g, "");
  const { error: sendErr } = await new Resend(key).emails.send({
    from: "DreamPlanner <noreply@dreamplaneredu.com>",
    to: [hit.sendTo],
    subject: subjectFor(hit.lang, "重置 DreamPlanner 密码", "Reset your DreamPlanner password"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${inOrder(hit.lang,
          `<div lang="zh-CN"><p>${name ? `${name}，你好：` : "你好："}</p>
          <p>我们收到了重置你 DreamPlanner 密码的请求。点击下面的按钮设置新密码（链接 1 小时内有效）：</p>
          <p><a href="${href}" style="display:inline-block;padding:10px 20px;background:#1f5c4d;color:#fff;text-decoration:none;border-radius:6px;">设置新密码</a></p>
          <p style="color:#666;font-size:13px;">如果不是你本人操作，可以忽略这封邮件，你的密码不会改变。</p></div>`,
          `<div lang="en"><p>${name ? `Hi ${name},` : "Hi,"}</p>
          <p>We received a request to reset your DreamPlanner password. Click below to set a new one (the link works for 1 hour):</p>
          <p><a href="${href}" style="display:inline-block;padding:10px 20px;background:#1f5c4d;color:#fff;text-decoration:none;border-radius:6px;">Set a new password</a></p>
          <p style="color:#666;font-size:13px;">If this wasn't you, ignore this email; your password won't change.</p></div>`,
        ).join('<hr style="border:none;border-top:1px dashed #ddd;margin:20px 0;">')}
      </div>`,
  });
  if (sendErr) {
    console.error("request-password-reset send", sendErr);
    return reply({ ok: true, found: true, sent: false });
  }
  console.log("request-password-reset: sent");
  return reply({ ok: true, found: true, sent: true });
});
