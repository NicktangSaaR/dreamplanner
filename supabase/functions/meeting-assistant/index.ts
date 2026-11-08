// Meeting records for the counselor planning tab.
//
// POST { action: "organize", student_id, notes, quarter, academic_year, goals, today }
//   AI turns rough meeting notes into a summary, decisions, tasks (owner +
//   due date), suggested changes to the quarter's goals and a team-only note.
//   Nothing is saved.
// POST { action: "save", student_id, meeting: {...}, goal_updates, email: { student, parent } }
//   Saves the meeting (team-only notes separately), turns student tasks into
//   the student's to-dos, applies the chosen goal changes and emails the
//   summary to the student and/or parent.
//
// Caller must be on the student's counselor team (or an admin).
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const SITE = "https://dreamplaneredu.com";
const FROM = "DreamPlanner <noreply@dreamplaneredu.com>";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

type Owner = "student" | "counselor" | "parent";
type Goal = { id: string; text: string; completed: boolean };
type Task = { text: string; owner: Owner; due: string | null };
type GoalUpdate = { kind: "done"; goal_id: string } | { kind: "add"; text: string };

const OWNER_ZH: Record<Owner, string> = { student: "学生", counselor: "顾问", parent: "家长" };
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function chat(prompt: string): Promise<string> {
  const deepseek = Deno.env.get("DEEPSEEK_API_KEY");
  const openai = Deno.env.get("OPENAI_API_KEY");
  const [url, key, model] = deepseek
    ? ["https://api.deepseek.com/v1/chat/completions", deepseek, "deepseek-chat"]
    : openai
      ? ["https://api.openai.com/v1/chat/completions", openai, "gpt-4o-mini"]
      : ["", "", ""];
  if (!key) throw new Error("No AI API key configured");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

function layout(title: string, body: string, link: string, linkText: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f7f6;font-family:-apple-system,Segoe UI,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2d2a">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #dfe7e4;border-radius:8px;padding:24px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#173f38">${esc(title)}</h1>
      ${body}
      <p style="margin:24px 0 0"><a href="${link}" style="display:inline-block;background:#2C6E63;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">${esc(linkText)}</a></p>
    </div>
    <p style="font-size:12px;color:#6b7c78;margin:12px 4px">这是 DreamPlanner 自动发送的邮件。</p>
  </div></body></html>`;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return 0;
  let sent = 0;
  for (const addr of to) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [addr], subject, html }),
    }).catch(() => null);
    if (res?.ok) sent++;
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: userData } = await admin.auth.getUser(token);
  const caller = userData?.user?.id;
  if (!caller) return json({ error: "not signed in" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  const studentId = str(body.student_id, 64);
  if (!studentId) return json({ error: "student_id required" }, 400);
  const [{ data: access }, { data: isAdmin }] = await Promise.all([
    admin.rpc("can_access_student_data", { viewer_id: caller, student_id: studentId }),
    admin.rpc("is_admin", { user_id: caller }),
  ]);
  if (access !== true && isAdmin !== true) return json({ error: "forbidden" }, 403);

  // ---------------- organize ----------------
  if (body.action === "organize") {
    const notes = str(body.notes, 12000);
    if (!notes) return json({ error: "notes required" }, 400);
    const goals = (Array.isArray(body.goals) ? body.goals : []) as Goal[];
    const today = isDate(body.today) ? body.today : new Date().toISOString().slice(0, 10);
    const goalList = goals.map((g) => `- [${g.completed ? "x" : " "}] (id=${g.id}) ${g.text}`).join("\n") || "（暂无）";

    const prompt = `你是升学规划顾问的助理。下面是顾问和学生开会后随手写的会议记录，请整理成结构化结果。
今天日期：${today}

本季度目标：
${goalList}

会议记录：
"""
${notes}
"""

只返回 JSON，格式：
{
  "title": "会议主题，10 个字左右",
  "summary": "给学生看的会议摘要，2-4 句话，具体，不写空话",
  "decisions": ["会上做出的决定，每条一句"],
  "tasks": [{"text": "具体任务，动词开头", "owner": "student|counselor|parent", "due": "YYYY-MM-DD 或 null"}],
  "goal_updates": [{"kind": "done", "goal_id": "上面列出的目标 id"} 或 {"kind": "add", "text": "新的季度目标"}],
  "team_note": "只给服务团队看的内容：学生状态、家长关注点、需要留意的风险；没有就写空字符串"
}
要求：
- 任务要可执行，负责人按记录判断；截止日期按记录推断，记录没提就根据任务大小给一个合理日期（今天之后），实在无法判断用 null。
- 只有记录里明确说完成了的目标才建议 "done"；新的长期事项才建议 "add"，最多 2 条。
- 学生的情绪、健康、家庭沟通等敏感内容只写进 team_note，不要写进 summary。
- 用记录的语言（中文为主）。`;

    try {
      const raw = JSON.parse(await chat(prompt));
      const ids = new Set(goals.map((g) => g.id));
      const owners: Owner[] = ["student", "counselor", "parent"];
      return json({
        title: str(raw.title, 80),
        summary: str(raw.summary, 1200),
        decisions: (Array.isArray(raw.decisions) ? raw.decisions : []).map((d: unknown) => str(d, 300)).filter(Boolean).slice(0, 10),
        tasks: (Array.isArray(raw.tasks) ? raw.tasks : [])
          .map((t: Record<string, unknown>) => ({
            text: str(t?.text, 300),
            owner: owners.includes(t?.owner as Owner) ? t.owner : "student",
            due: isDate(t?.due) ? t.due : null,
          }))
          .filter((t: Task) => t.text)
          .slice(0, 15),
        goal_updates: (Array.isArray(raw.goal_updates) ? raw.goal_updates : [])
          .filter((u: Record<string, unknown>) => (u?.kind === "done" && ids.has(String(u.goal_id))) || (u?.kind === "add" && str(u.text)))
          .map((u: Record<string, unknown>) => (u.kind === "done" ? { kind: "done", goal_id: String(u.goal_id) } : { kind: "add", text: str(u.text, 200) }))
          .slice(0, 6),
        team_note: str(raw.team_note, 1500),
      });
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "AI failed" }, 502);
    }
  }

  // ---------------- save ----------------
  if (body.action === "save") {
    const m = (body.meeting || {}) as Record<string, unknown>;
    const quarter = str(m.quarter, 20);
    const academicYear = str(m.academic_year, 20);
    const date = isDate(m.date) ? m.date : new Date().toISOString().slice(0, 10);
    const title = str(m.title, 120) || "会议";
    const summary = str(m.summary, 3000);
    const decisions = (Array.isArray(m.decisions) ? m.decisions : []).map((d) => str(d, 300)).filter(Boolean);
    const tasks = (Array.isArray(m.tasks) ? m.tasks : [])
      .map((t: Record<string, unknown>) => ({
        text: str(t?.text, 300),
        owner: (["student", "counselor", "parent"].includes(t?.owner as string) ? t.owner : "student") as Owner,
        due: isDate(t?.due) ? (t.due as string) : null,
      }))
      .filter((t) => t.text);
    if (!quarter || !academicYear) return json({ error: "quarter required" }, 400);

    const { data: meeting, error: mErr } = await admin
      .from("student_meetings")
      .insert({
        student_id: studentId,
        meeting_date: `${date}T12:00:00Z`,
        title,
        quarter,
        academic_year: academicYear,
        summary,
        decision_list: decisions,
        created_by: caller,
      })
      .select("id")
      .single();
    if (mErr || !meeting) return json({ error: mErr?.message || "save failed" }, 500);

    await admin.from("meeting_private").insert({
      meeting_id: meeting.id,
      raw_notes: str(m.raw_notes, 20000) || null,
      team_note: str(m.team_note, 3000) || null,
    });

    // Student tasks become the student's to-dos (with the usual reminders).
    let todoCount = 0;
    for (const t of tasks) {
      let todoId: string | null = null;
      if (t.owner === "student") {
        const { data: todo } = await admin
          .from("todos")
          .insert({ title: t.text, author_id: studentId, due_date: t.due ? `${t.due}T23:59:00` : null, completed: false })
          .select("id")
          .single();
        todoId = todo?.id ?? null;
        if (todoId) todoCount++;
      }
      await admin.from("meeting_action_items").insert({
        meeting_id: meeting.id,
        title: t.text,
        owner: t.owner,
        assigned_to: OWNER_ZH[t.owner],
        due_date: t.due,
        todo_id: todoId,
      });
    }

    // Goal changes the counselor ticked.
    const updates = (Array.isArray(body.goal_updates) ? body.goal_updates : []) as GoalUpdate[];
    let goalsChanged = false;
    if (updates.length) {
      const { data: q } = await admin
        .from("student_quarters")
        .select("id, quarter_kpi")
        .eq("student_id", studentId)
        .eq("quarter", quarter)
        .eq("academic_year", academicYear)
        .maybeSingle();
      let goals: Goal[] = [];
      try {
        const parsed = JSON.parse(q?.quarter_kpi || "[]");
        if (Array.isArray(parsed)) goals = parsed;
      } catch {
        goals = [];
      }
      for (const u of updates) {
        if (u.kind === "done") goals = goals.map((g) => (g.id === u.goal_id ? { ...g, completed: true } : g));
        else if (u.kind === "add" && str(u.text)) goals.push({ id: `kpi-meeting-${crypto.randomUUID()}`, text: str(u.text, 200), completed: false });
      }
      const kpi = JSON.stringify(goals);
      if (q) await admin.from("student_quarters").update({ quarter_kpi: kpi }).eq("id", q.id);
      else await admin.from("student_quarters").insert({ student_id: studentId, quarter, academic_year: academicYear, quarter_kpi: kpi });
      goalsChanged = true;
    }

    // Email the summary.
    const email = (body.email || {}) as { student?: boolean; parent?: boolean };
    const { data: student } = await admin.from("profiles").select("full_name, email, parent_email").eq("id", studentId).maybeSingle();
    const recipients: string[] = [];
    const sentTo: string[] = [];
    if (email.student && student?.email) {
      recipients.push(student.email);
      sentTo.push("学生");
    }
    if (email.parent && student?.parent_email) {
      recipients.push(student.parent_email);
      sentTo.push("家长");
    }
    let sent = 0;
    if (recipients.length) {
      const taskRows = tasks
        .map((t) => `<li style="margin:4px 0">${esc(t.text)} <span style="color:#6b7c78">（${OWNER_ZH[t.owner]}${t.due ? ` · ${t.due} 前` : ""}）</span></li>`)
        .join("");
      const html = layout(
        `会议纪要：${title}`,
        `<p style="margin:0 0 4px;color:#6b7c78;font-size:13px">${esc(student?.full_name || "")} · ${date}</p>
         ${summary ? `<p style="line-height:1.7">${esc(summary)}</p>` : ""}
         ${decisions.length ? `<p style="margin:16px 0 4px;font-weight:600">决定事项</p><ul style="margin:0;padding-left:20px">${decisions.map((d) => `<li style="margin:4px 0">${esc(d)}</li>`).join("")}</ul>` : ""}
         ${tasks.length ? `<p style="margin:16px 0 4px;font-weight:600">接下来的任务</p><ul style="margin:0;padding-left:20px">${taskRows}</ul>` : ""}`,
        `${SITE}/student-dashboard/${studentId}`,
        "打开 DreamPlanner",
      );
      sent = await sendEmail(recipients, `会议纪要：${title}（${date}）`, html);
      await admin.from("student_meetings").update({ emailed_to: sentTo }).eq("id", meeting.id);
    }

    return json({ ok: true, meeting_id: meeting.id, todos: todoCount, goals_changed: goalsChanged, emailed: sent > 0 ? sentTo : [] });
  }

  return json({ error: "unknown action" }, 400);
});
