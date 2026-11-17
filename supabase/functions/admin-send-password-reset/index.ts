// Admin sends a user an email inviting them to set a new password.
// POST { user_id }  (an admin's session) -> { ok: true, sent_to } | { error }
// The current password keeps working until the user sets a new one.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";
import { resetEmail } from "./email.ts";
import { emailLang } from "../_shared/emailLang.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const SITE = "https://dreamplaneredu.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: "请先登录" }, 401);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: isAdmin } = await admin.rpc("is_admin", { user_id: user.id });
  if (!isAdmin) return json({ error: "只有管理员可以发送重置密码邮件" }, 403);

  let userId = "";
  try {
    userId = String((await req.json()).user_id ?? "");
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  if (!userId) return json({ error: "user_id required" }, 400);

  const [{ data: profile }, { data: authUser }] = await Promise.all([
    admin.from("profiles").select("full_name, email, email_language").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);
  const loginEmail = authUser?.user?.email;
  if (!loginEmail) return json({ error: "找不到这个账号" }, 404);
  // accounts made with a username log in with an internal address; mail goes to the email in their profile
  const internal = (e?: string | null) => !e || e.toLowerCase().endsWith("@student.dreamplaneredu.com");
  const to = !internal(profile?.email) ? profile!.email! : !internal(loginEmail) ? loginEmail : null;
  if (!to) return json({ error: "这个账号还没有绑定可以收信的邮箱，没法发送" }, 400);

  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email: loginEmail, options: { redirectTo: `${SITE}/reset-password` } });
  if (error || !link?.properties?.action_link) {
    console.error("admin-send-password-reset generateLink", error);
    return json({ error: "没能生成重置链接，请稍后再试" }, 500);
  }
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return json({ error: "邮件服务没有配置" }, 500);
  const { subject, html } = resetEmail(profile?.full_name || "", link.properties.action_link, emailLang(profile?.email_language));
  const { error: sendErr } = await new Resend(key).emails.send({ from: "DreamPlanner <noreply@dreamplaneredu.com>", to: [to], subject, html });
  if (sendErr) {
    console.error("admin-send-password-reset send", sendErr);
    return json({ error: "邮件没能发出，请稍后再试" }, 502);
  }
  console.log("admin-send-password-reset: sent", { userId, by: user.id });
  return json({ ok: true, sent_to: to });
});
