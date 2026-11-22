// A counselor sends a student a message from the site; the student gets it by email.
//
// POST { student_id, subject?, body, cc_parent? }  (the counselor's session)
//   -> { ok: true, emailed: boolean, reason?: "no_email" | "send_failed", id }
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

  let body: { student_id?: string; subject?: string; body?: string; cc_parent?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  const studentId = String(body.student_id ?? "");
  const subject = String(body.subject ?? "").trim().slice(0, 150) || null;
  const text = String(body.body ?? "").trim().slice(0, 5000);
  if (!studentId || !text) return json({ error: "student_id and body required" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const [{ data: allowed }, { data: isAdmin }] = await Promise.all([
    admin.rpc("can_access_student_data", { viewer_id: user.id, student_id: studentId }),
    admin.rpc("is_admin", { user_id: user.id }),
  ]);
  if (!allowed && !isAdmin) return json({ error: "只有这位学生的顾问可以发送" }, 403);

  const [{ data: student }, { data: me }] = await Promise.all([
    admin.from("profiles").select("full_name, email, parent_email, user_type, email_language").eq("id", studentId).maybeSingle(),
    admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
  ]);
  if (student?.user_type !== "student") return json({ error: "not a student" }, 400);

  const to = student.email && EMAIL.test(student.email) && !INTERNAL.test(student.email) ? [student.email] : [];
  const parent = body.cc_parent && student.parent_email && EMAIL.test(student.parent_email) ? student.parent_email : null;
  const senderEmail = me?.email || user.email || "";
  const canReply = EMAIL.test(senderEmail) && !INTERNAL.test(senderEmail);

  let emailed = false;
  let reason: "no_email" | "send_failed" | undefined;
  const key = Deno.env.get("RESEND_API_KEY");
  if (!to.length) reason = "no_email";
  else if (!key) reason = "send_failed";
  else {
    const mail = messageEmail({
      studentName: student.full_name || "", senderName: me?.full_name || "", subject, body: text,
      lang: emailLang(student.email_language), canReply,
    });
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
  }

  const { data: row, error } = await admin.from("student_messages")
    .insert({ student_id: studentId, sender_id: user.id, subject, body: text, cc_parent: !!parent, emailed })
    .select("id").single();
  if (error) console.error("send-student-message save", error.message);

  return json({ ok: true, emailed, reason, id: row?.id ?? null });
});
