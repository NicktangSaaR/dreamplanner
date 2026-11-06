// Grade briefs.
//
// POST { action: "analyze", report_id }  — read an uploaded report card
//   (PDF or image) with AI, write a brief for the counselor team, mark open
//   upload requests as done, and email the team.
// POST { action: "manual", student_id, brief, period_label? } — the team
//   pastes a finished brief written outside the system; it is saved as is
//   (no AI) and emailed to the team.
// POST { action: "request", student_id, due_date, message? } — the team asks
//   a student to upload their latest report card; the student is emailed.
//
// Caller must be signed in. "analyze": the student themself or their team.
// "request": the student's team or an admin.
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
  if (!key || to.length === 0) return;
  for (const addr of to) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [addr], subject, html }),
    }).catch(() => undefined);
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type Course = { name: string; grade?: string | null; percent?: number | null; comment?: string | null };
type BriefData = {
  period?: string | null;
  school?: string | null;
  courses?: Course[];
  overall?: string;
  changes?: string[];
  risks?: string[];
  suggestions?: string[];
};

function renderBrief(d: BriefData): string {
  const lines: string[] = [];
  if (d.period || d.school) lines.push(`**${[d.school, d.period].filter(Boolean).join(" · ")}**`, "");
  if (d.overall) lines.push(d.overall, "");
  if (d.courses?.length) {
    lines.push("| 课程 | 成绩 | 百分比 | 老师评语 |", "|---|---|---|---|");
    for (const c of d.courses) {
      lines.push(`| ${c.name ?? ""} | ${c.grade ?? ""} | ${c.percent ?? ""} | ${(c.comment ?? "").replace(/\|/g, "/").replace(/\n/g, " ")} |`);
    }
    lines.push("");
  }
  const section = (title: string, items?: string[]) => {
    if (items?.length) lines.push(`**${title}**`, ...items.map((i) => `- ${i}`), "");
  };
  section("与上次相比", d.changes);
  section("需要关注", d.risks);
  section("建议", d.suggestions);
  return lines.join("\n").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
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

  const isTeam = async (studentId: string) => {
    const [{ data: access }, { data: isAdmin }] = await Promise.all([
      admin.rpc("can_access_student_data", { viewer_id: caller, student_id: studentId }),
      admin.rpc("is_admin", { user_id: caller }),
    ]);
    return access === true || isAdmin === true;
  };

  const teamEmails = async (studentId: string): Promise<string[]> => {
    const [{ data: rel }, { data: collabs }] = await Promise.all([
      admin.from("counselor_student_relationships").select("counselor_id").eq("student_id", studentId).maybeSingle(),
      admin.from("counselor_collaborations").select("collaborator_id").eq("student_id", studentId),
    ]);
    const ids = [rel?.counselor_id, ...(collabs || []).map((c) => c.collaborator_id)].filter(Boolean) as string[];
    if (!ids.length) return [];
    const { data: people } = await admin.from("profiles").select("email").in("id", ids);
    return [...new Set((people || []).map((p) => p.email).filter(Boolean) as string[])];
  };

  // ---------------- request an upload ----------------
  if (body.action === "request") {
    const studentId = String(body.student_id || "");
    const due = String(body.due_date || "");
    const message = typeof body.message === "string" ? body.message.slice(0, 500) : null;
    if (!/^[0-9a-f-]{36}$/.test(studentId) || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return json({ error: "invalid input" }, 400);
    if (!(await isTeam(studentId))) return json({ error: "forbidden" }, 403);

    const { data: request, error } = await admin
      .from("academic_report_requests")
      .insert({ student_id: studentId, requested_by: caller, due_date: due, message })
      .select("id")
      .single();
    if (error) return json({ error: error.message }, 500);

    const { data: student } = await admin.from("profiles").select("email, full_name").eq("id", studentId).maybeSingle();
    if (student?.email) {
      await sendEmail(
        [student.email],
        `请在 ${due} 前上传最新成绩单`,
        layout(
          "请上传最新成绩单",
          `<p>${esc(student.full_name || "同学")}，你好：</p>
           <p>你的升学顾问请你在 <strong>${esc(due)}</strong> 前，在 DreamPlanner「我的信息 → 成绩单」上传最新的成绩单（PDF、照片或截图都可以）。</p>
           ${message ? `<p style="border-left:3px solid #2C6E63;padding-left:10px;color:#3b4a47">${esc(message)}</p>` : ""}`,
          `${SITE}/student-dashboard/${studentId}`,
          "去上传",
        ),
      );
    }
    return json({ ok: true, id: request.id });
  }

  // ---------------- paste a finished brief ----------------
  if (body.action === "manual") {
    const studentId = String(body.student_id || "");
    const brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 20000) : "";
    const period = typeof body.period_label === "string" ? body.period_label.trim().slice(0, 60) || null : null;
    if (!/^[0-9a-f-]{36}$/.test(studentId) || !brief) return json({ error: "invalid input" }, 400);
    if (!(await isTeam(studentId))) return json({ error: "forbidden" }, 403);

    const { data: row, error } = await admin
      .from("academic_reports")
      .insert({ student_id: studentId, uploaded_by: caller, source: "manual", status: "ready", period_label: period, file_name: period || "简报" })
      .select("id")
      .single();
    if (error) return json({ error: error.message }, 500);
    await admin.from("academic_report_briefs").insert({ report_id: row.id, student_id: studentId, brief });
    await admin
      .from("academic_report_requests")
      .update({ fulfilled_at: new Date().toISOString() })
      .eq("student_id", studentId)
      .is("fulfilled_at", null);

    const { data: student } = await admin.from("profiles").select("full_name").eq("id", studentId).maybeSingle();
    const name = student?.full_name || "学生";
    const excerpt = brief.length > 1200 ? `${brief.slice(0, 1200)}…` : brief;
    await sendEmail(
      await teamEmails(studentId),
      `成绩简报：${name}${period ? ` · ${period}` : ""}`,
      layout(
        `${name} 的成绩简报`,
        `<div style="white-space:pre-wrap;line-height:1.6;font-size:14px">${esc(excerpt)}</div>`,
        `${SITE}/counselor-dashboard/student/${studentId}`,
        "查看完整简报",
      ),
    );
    return json({ ok: true, id: row.id });
  }

  // ---------------- analyze an upload ----------------
  if (body.action === "analyze") {
    const reportId = String(body.report_id || "");
    const { data: report } = await admin.from("academic_reports").select("*").eq("id", reportId).maybeSingle();
    if (!report) return json({ error: "not found" }, 404);
    if (report.student_id !== caller && !(await isTeam(report.student_id))) return json({ error: "forbidden" }, 403);

    // Any upload fulfils open requests.
    await admin
      .from("academic_report_requests")
      .update({ fulfilled_at: new Date().toISOString() })
      .eq("student_id", report.student_id)
      .is("fulfilled_at", null);

    const fail = async (msg: string) => {
      await admin.from("academic_reports").update({ status: "failed" }).eq("id", reportId);
      await admin.from("academic_report_briefs").upsert({ report_id: reportId, student_id: report.student_id, error: msg });
      return json({ ok: false, error: msg });
    };

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return await fail("AI 服务未配置");

    const { data: file, error: dlError } = await admin.storage.from("academic-reports").download(report.file_path);
    if (dlError || !file) return await fail("无法读取上传的文件");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const dataUrl = `data:${report.mime_type};base64,${toBase64(bytes)}`;

    const { data: previous } = await admin
      .from("academic_report_briefs")
      .select("data, created_at")
      .eq("student_id", report.student_id)
      .neq("report_id", reportId)
      .not("data", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const filePart = report.mime_type === "application/pdf"
      ? { type: "file", file: { filename: report.file_name, file_data: dataUrl } }
      : { type: "image_url", image_url: { url: dataUrl } };

    const instructions = `你是一位资深升学顾问的助理。请阅读这份学生成绩单（可能是 PDF、照片或截图），只依据文件中能看到的信息，输出 JSON：
{
  "period": "成绩所属学期或时间，如 2026-27 Term 1；看不出则为 null",
  "school": "学校名称；看不出则为 null",
  "courses": [{"name": "课程名", "grade": "等级/字母成绩，如 A、B+、4 分；没有则 null", "percent": 数字或 null, "comment": "老师评语要点，没有则 null"}],
  "overall": "两三句话的整体评价（中文）",
  "changes": ["与上一次成绩相比的变化（中文），没有上一次数据则为空数组"],
  "risks": ["需要关注的问题，例如成绩下滑、低于 80%、缺交作业等（中文）"],
  "suggestions": ["给顾问的具体跟进建议（中文）"]
}
不要编造文件里没有的课程或分数；看不清的写 null。`;
    const prevNote = previous?.data
      ? `上一次成绩单的提取结果（用于比较）：${JSON.stringify(previous.data).slice(0, 6000)}`
      : "这是该学生第一次上传成绩单。";

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: [{ type: "text", text: prevNote }, filePart] },
        ],
      }),
    });
    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error("OpenAI error", aiRes.status, detail.slice(0, 500));
      return await fail(`AI 读取失败（${aiRes.status}）`);
    }
    const ai = await aiRes.json();
    let parsed: BriefData;
    try {
      parsed = JSON.parse(ai.choices?.[0]?.message?.content || "{}");
    } catch {
      return await fail("AI 返回格式错误");
    }
    const brief = renderBrief(parsed);

    await admin.from("academic_report_briefs").upsert({
      report_id: reportId,
      student_id: report.student_id,
      brief,
      data: parsed,
      error: null,
    });
    await admin
      .from("academic_reports")
      .update({ status: "ready", period_label: report.period_label || parsed.period || null })
      .eq("id", reportId);

    const { data: student } = await admin.from("profiles").select("full_name").eq("id", report.student_id).maybeSingle();
    const name = student?.full_name || "学生";
    const list = (items?: string[]) => (items?.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
    await sendEmail(
      await teamEmails(report.student_id),
      `成绩简报：${name}${parsed.period ? ` · ${parsed.period}` : ""}`,
      layout(
        `${name} 的成绩简报`,
        `${parsed.overall ? `<p>${esc(parsed.overall)}</p>` : ""}
         ${parsed.risks?.length ? `<p><strong>需要关注</strong></p>${list(parsed.risks)}` : ""}
         ${parsed.suggestions?.length ? `<p><strong>建议</strong></p>${list(parsed.suggestions)}` : ""}`,
        `${SITE}/counselor-dashboard/student/${report.student_id}`,
        "查看完整简报",
      ),
    );

    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
});
