// A counselor asks a student to update their activity portfolio: adds an
// assigned to-do and emails the student (Chinese, then English).
//
// POST { student_id, due?: "YYYY-MM-DD", note?: string }  (the counselor's session)
//   -> { ok: true, emailed: boolean, reason?: string }
// The student's counselors, team teachers and admins only.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SITE = "https://dreamplaneredu.com";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', Arial, sans-serif";
const C = { ink: "#1f2d2a", muted: "#5f6f6b", line: "#e3ebe8", brand: "#1f5c4d", soft: "#f3f7f5" };
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function requestTitle(note?: string) {
  return `📋 更新活动档案：把参加过的活动、比赛和奖项加进来，每条大约 1 分钟${note?.trim() ? `（${note.trim()}）` : ""}`;
}

export function requestEmail(studentName: string, counselorName: string, due: string | null, note: string) {
  const s = esc(studentName), c = esc(counselorName), n = esc(note);
  const zhDue = due ? `${Number(due.slice(0, 4))}年${Number(due.slice(5, 7))}月${Number(due.slice(8, 10))}日` : "";
  const enDue = due ? `${MONTHS[Number(due.slice(5, 7)) - 1]} ${Number(due.slice(8, 10))}, ${due.slice(0, 4)}` : "";
  const block = (lang: "zh" | "en") => {
    const zh = lang === "zh";
    return `
  <div lang="${zh ? "zh-CN" : "en"}" style="padding:24px;">
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${C.brand};font-weight:600;">${zh ? "请更新你的活动档案" : "Please update your activity portfolio"}</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${C.ink};">${zh
      ? `${s}，你好！${c}请你在 DreamPlanner 里更新活动档案：把参加过的活动、比赛、奖项、科研、实习、志愿服务和夏校加进来，计划要做的也可以先加上。${zhDue ? `请在 <strong>${zhDue}</strong> 前完成。` : ""}`
      : `Hi ${s}, ${c} has asked you to update your activity portfolio in DreamPlanner: add your activities, competitions, awards, research, work, volunteering and summer programmes, including ones you plan to do.${enDue ? ` Please finish by <strong>${enDue}</strong>.` : ""}`}</p>
    ${n ? `<p style="margin:0 0 12px;padding:10px 12px;background:${C.soft};border-radius:6px;font-size:14px;line-height:1.6;color:${C.ink};">${zh ? "顾问留言：" : "Note from your counselor: "}${n}</p>` : ""}
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.ink};">${zh
      ? "每条只需填几项（做了什么、类型、时间、每周几小时），大约 1 分钟，中文也可以。登录后在待办里点「去填写」，或者从右上角菜单打开「活动档案」。"
      : "Each entry takes about a minute (what, type, when, hours a week). After signing in, click “Open” next to the to-do, or choose “Activities” from the menu."}</p>
    <p style="margin:0;"><a href="${SITE}/login" style="display:inline-block;background:${C.brand};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:15px;">${zh ? "打开 DreamPlanner" : "Open DreamPlanner"}</a></p>
  </div>`;
  };
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.soft};font-family:${FONT};">
  <div style="max-width:600px;margin:0 auto;padding:16px;">
    <div style="background:#ffffff;border:1px solid ${C.line};border-radius:8px;font-family:${FONT};">
      ${block("zh")}
      <div style="border-top:1px dashed ${C.line};margin:0 24px;"></div>
      ${block("en")}
    </div>
    <p style="margin:12px 4px 0;font-size:12px;line-height:1.6;color:${C.muted};font-family:${FONT};">
      此邮件由 DreamPlanner 自动发送，请勿直接回复。<br>This email was sent automatically by DreamPlanner. Please don't reply to it.
    </p>
  </div>
</body></html>`;
  return { subject: `请更新活动档案 · Please update your activity portfolio`, html };
}

if (import.meta.main) Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: "请先登录" }, 401);

  let body: { student_id?: string; due?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  const studentId = String(body.student_id ?? "");
  const due = /^\d{4}-\d{2}-\d{2}$/.test(body.due ?? "") ? body.due! : null;
  const note = String(body.note ?? "").trim().slice(0, 100);
  if (!studentId) return json({ error: "student_id required" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const [{ data: allowed }, { data: isAdmin }] = await Promise.all([
    admin.rpc("can_access_student_data", { viewer_id: user.id, student_id: studentId }),
    admin.rpc("is_admin", { user_id: user.id }),
  ]);
  if (!allowed && !isAdmin) return json({ error: "只有这位学生的顾问可以发送" }, 403);

  const [{ data: student }, { data: me }] = await Promise.all([
    admin.from("profiles").select("full_name, email, user_type").eq("id", studentId).maybeSingle(),
    admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  if (student?.user_type !== "student") return json({ error: "not a student" }, 400);

  const { error: todoError } = await admin.from("todos").insert({
    author_id: studentId, title: requestTitle(note), due_date: due, completed: false, assigned_by: user.id,
  });
  if (todoError) {
    console.error("activity-request todo", todoError);
    return json({ error: "没能创建待办" }, 500);
  }

  // Accounts made with a username have a placeholder address until the student adds a real one.
  const to = student.email && !student.email.toLowerCase().endsWith("@student.dreamplaneredu.com") ? student.email : null;
  if (!to) return json({ ok: true, emailed: false, reason: "no_email" });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return json({ ok: true, emailed: false, reason: "email_not_configured" });

  const { subject, html } = requestEmail(student.full_name || "同学", me?.full_name || "你的顾问", due, note);
  const from = Deno.env.get("RESEND_FROM")?.trim() || "DreamPlanner <reminder@dreamplaneredu.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("activity-request email", res.status, await res.text());
      return json({ ok: true, emailed: false, reason: "send_failed" });
    }
  } catch (e) {
    console.error("activity-request email", e);
    return json({ ok: true, emailed: false, reason: "send_failed" });
  }
  return json({ ok: true, emailed: true });
});
