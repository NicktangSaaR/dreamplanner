// A counselor sends a student a message from the site; the student gets it by email.
//
// POST { student_id | student_ids[], subject?, body, cc_parent? }  (the counselor's session)
//   -> { ok, sent, no_email, failed, skipped, results[], emailed, reason }
// {name} in the subject or body becomes each student's name. Up to 100 students.
// The student's counselors, team teachers and admins only. Replies go to the
// sender's email. Every message is saved in student_messages.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { emailLang } from "../_shared/emailLang.ts";
import { messageEmail } from "./email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTERNAL = /@student\.dreamplaneredu\.com$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: "请先登录" }, 401);

  let body: { student_id?: string; student_ids?: string[]; subject?: string; body?: string; cc_parent?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  // one student, or many at once (群发); {name} becomes each student's name
  const ids = [...new Set([...(Array.isArray(body.student_ids) ? body.student_ids : []), body.student_id].filter((x): x is string => typeof x === "string" && !!x))];
  const subjectTpl = String(body.subject ?? "").trim().slice(0, 150);
  const textTpl = String(body.body ?? "").trim().slice(0, 5000);
  if (!ids.length || !textTpl) return json({ error: "student and body required" }, 400);
  if (ids.length > 100) return json({ error: "最多一次发给 100 位学生" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: isAdmin } = await admin.rpc("is_admin", { user_id: user.id });
  const allowedIds: string[] = [];
  for (const id of ids) {
    const { data: ok } = isAdmin ? { data: true } : await admin.rpc("can_access_student_data", { viewer_id: user.id, student_id: id });
    if (ok) allowedIds.push(id);
  }
  if (!allowedIds.length) return json({ error: "只有这位学生的顾问可以发送" }, 403);

  const [{ data: students }, { data: me }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, parent_email, user_type, email_language").in("id", allowedIds),
    admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
  ]);
  const senderEmail = me?.email || user.email || "";
  const canReply = EMAIL.test(senderEmail) && !INTERNAL.test(senderEmail);
  const key = Deno.env.get("RESEND_API_KEY");
  const fill = (tpl: string, name: string) => tpl.replace(/\{name\}/g, name);

  const results: { student_id: string; emailed: boolean; reason?: "no_email" | "send_failed" }[] = [];
  for (const student of (students ?? []).filter((x) => x.user_type === "student")) {
    const name = student.full_name || "";
    const subject = fill(subjectTpl, name) || null;
    const text = fill(textTpl, name);
    const to = student.email && EMAIL.test(student.email) && !INTERNAL.test(student.email) ? [student.email] : [];
    const parent = body.cc_parent && student.parent_email && EMAIL.test(student.parent_email) ? student.parent_email : null;

    let emailed = false;
    let reason: "no_email" | "send_failed" | undefined;
    if (!to.length) reason = "no_email";
    else if (!key) reason = "send_failed";
    else {
      const mail = messageEmail({ studentName: name, senderName: me?.full_name || "", subject, body: text, lang: emailLang(student.email_language), canReply });
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `${(me?.full_name || "DreamPlanner").replace(/[<>"]/g, "")} via DreamPlanner <noreply@dreamplaneredu.com>`,
            to, cc: parent ? [parent] : undefined, reply_to: canReply ? senderEmail : undefined,
            subject: mail.subject, html: mail.html,
          }),
        });
        emailed = res.ok;
        if (!res.ok) {
          reason = "send_failed";
          console.error("send-student-message", res.status, await res.text());
        }
      } catch (e) {
        reason = "send_failed";
        console.error("send-student-message", e);
      }
      // stay under the email provider's rate limit when sending to many
      if (allowedIds.length > 1) await new Promise((r) => setTimeout(r, 550));
    }
    const { error } = await admin.from("student_messages")
      .insert({ student_id: student.id, sender_id: user.id, subject, body: text, cc_parent: !!parent && emailed, emailed });
    if (error) console.error("send-student-message save", error.message);
    results.push({ student_id: student.id, emailed, reason });
  }

  const first = results[0];
  return json({
    ok: true, results,
    sent: results.filter((r) => r.emailed).length,
    no_email: results.filter((r) => r.reason === "no_email").length,
    failed: results.filter((r) => r.reason === "send_failed").length,
    skipped: ids.length - results.length,
    // single-student callers
    emailed: first?.emailed ?? false, reason: first?.reason,
  });
});
