// Daily automation for DreamPlanner, called once a day by pg_cron.
//
//   * September: every G9–G11 student moves up one grade, and every
//     student's stage moves forward one step (never behind what the new
//     grade implies). Each lead counselor gets a summary email.
//   * July: lead counselors (and their team) are reminded that their G11
//     students are entering application-season preparation.
//   * Every day: planning milestones due within 7 days are emailed to the
//     student's lead counselor, team and the milestone's own reminder list.
//   * Every day: report-card upload requests — the student is reminded two
//     days before the due date, and the team is told once it is overdue.
//
// Auth: requires the x-cron-secret header to match CRON_SECRET.
// Query params for testing: ?dry=1 (report only, no writes or emails),
// ?today=YYYY-MM-DD (pretend it is that date in Vancouver).
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const PHASES = ["exploration", "positioning", "consolidation", "application"] as const;
const PHASE_ZH: Record<string, string> = {
  exploration: "探索阶段",
  positioning: "定位阶段",
  consolidation: "聚焦阶段",
  application: "申请阶段",
};
const GRADE_PHASE: Record<string, number> = { G9: 0, G10: 1, G11: 2, G12: 3 };
const NEXT_GRADE: Record<string, string> = { G9: "G10", G10: "G11", G11: "G12" };
const SITE = "https://dreamplaneredu.com";
const FROM = "DreamPlanner <noreply@dreamplaneredu.com>";

type Student = { id: string; full_name: string | null; status: string | null; grade: string | null };
type Person = { id: string; full_name: string | null; email: string | null };

function vancouverToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date());
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f7f6;font-family:-apple-system,Segoe UI,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2d2a">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #dfe7e4;border-radius:8px;padding:24px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#173f38">${esc(title)}</h1>
      ${body}
      <p style="margin:24px 0 0"><a href="${SITE}/counselor-dashboard" style="display:inline-block;background:#2C6E63;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">打开 DreamPlanner</a></p>
    </div>
    <p style="font-size:12px;color:#6b7c78;margin:12px 4px">这是 DreamPlanner 自动发送的提醒邮件。</p>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  // Test mode: with dry=1, send every email that would go out to this one
  // address instead (subject prefixed with [测试]); nothing is saved.
  const previewTo = url.searchParams.get("preview_to");
  const previewOk = !!previewTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(previewTo);
  const todayParam = url.searchParams.get("today");
  const today = todayParam && /^\d{4}-\d{2}-\d{2}$/.test(todayParam) ? todayParam : vancouverToday();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  const report: Record<string, unknown> = { today, dry };
  const outbox: { to: string; subject: string; html: string }[] = [];

  // ---------- shared lookups ----------
  const { data: rels } = await db.from("counselor_student_relationships").select("student_id, counselor_id");
  const { data: collabs } = await db.from("counselor_collaborations").select("student_id, collaborator_id, role");
  const { data: staff } = await db.from("profiles").select("id, full_name, email").in("user_type", ["counselor", "admin"]);
  const people = new Map<string, Person>((staff || []).map((p) => [p.id, p as Person]));
  const leadOf = new Map<string, string>((rels || []).map((r) => [r.student_id, r.counselor_id]));
  const teamOf = new Map<string, { id: string; role: string }[]>();
  for (const c of collabs || []) {
    const list = teamOf.get(c.student_id) || [];
    list.push({ id: c.collaborator_id, role: c.role || "other" });
    teamOf.set(c.student_id, list);
  }
  const teamEmails = (studentId: string): string[] => {
    const ids = [leadOf.get(studentId), ...(teamOf.get(studentId) || []).map((m) => m.id)].filter(Boolean) as string[];
    return [...new Set(ids.map((id) => people.get(id)?.email).filter(Boolean) as string[])];
  };

  const alreadyRan = async (key: string) => {
    const { data } = await db.from("automation_runs").select("key").eq("key", key).maybeSingle();
    return !!data;
  };
  const markRan = async (key: string, details: unknown) => {
    if (!dry) await db.from("automation_runs").insert({ key, details });
  };

  // ---------- 1) September: grade + stage advance ----------
  const gradeKey = `grade-advance-${year}`;
  if (month === 9 && !(await alreadyRan(gradeKey))) {
    const { data: students } = await db
      .from("profiles")
      .select("id, full_name, status, grade")
      .eq("user_type", "student")
      .in("status", ["G9", "G10", "G11", "G12"]);
    const { data: phases } = await db.from("student_phases").select("student_id, current_phase, last_auto_advance_year");
    const phaseOf = new Map((phases || []).map((p) => [p.student_id, p]));
    const changes: { student: Student; from: string; to: string; phaseFrom: string | null; phaseTo: string }[] = [];

    for (const s of (students || []) as Student[]) {
      const status = s.status as string;
      const newStatus = NEXT_GRADE[status] || status; // G12 stays G12 until the counselor marks it done
      const existing = phaseOf.get(s.id);
      if (existing?.last_auto_advance_year === year) continue;

      const currentIdx = existing ? PHASES.indexOf(existing.current_phase) : -1;
      const gradeIdx = GRADE_PHASE[newStatus];
      const nextIdx = Math.min(3, Math.max(currentIdx + 1, gradeIdx));
      const phaseTo = PHASES[nextIdx];

      const changed = newStatus !== status || phaseTo !== existing?.current_phase;
      if (changed) changes.push({ student: s, from: status, to: newStatus, phaseFrom: existing?.current_phase || null, phaseTo });
      if (dry) continue;

      if (newStatus !== status) {
        const update: Record<string, string> = { status: newStatus };
        if (s.grade && /^\d+$/.test(s.grade)) update.grade = String(Number(s.grade) + 1);
        await db.from("profiles").update(update).eq("id", s.id);
      }
      if (existing) {
        await db
          .from("student_phases")
          .update({
            current_phase: phaseTo,
            last_auto_advance_year: year,
            ...(phaseTo !== existing.current_phase ? { phase_start_date: today } : {}),
          })
          .eq("student_id", s.id);
      } else {
        await db.from("student_phases").upsert(
          { student_id: s.id, current_phase: phaseTo, phase_start_date: today, last_auto_advance_year: year },
          { onConflict: "student_id" },
        );
      }
    }

    // One summary per lead counselor
    const byLead = new Map<string, typeof changes>();
    for (const c of changes) {
      const lead = leadOf.get(c.student.id);
      if (!lead) continue;
      byLead.set(lead, [...(byLead.get(lead) || []), c]);
    }
    for (const [lead, list] of byLead) {
      const email = people.get(lead)?.email;
      if (!email) continue;
      const rows = list
        .map((c) => `<tr><td style="padding:6px 8px;border-top:1px solid #eef2f0">${esc(c.student.full_name || "学生")}</td>
          <td style="padding:6px 8px;border-top:1px solid #eef2f0">${c.from} → ${c.to}</td>
          <td style="padding:6px 8px;border-top:1px solid #eef2f0">${c.phaseFrom ? PHASE_ZH[c.phaseFrom] + " → " : ""}${PHASE_ZH[c.phaseTo]}</td></tr>`)
        .join("");
      outbox.push({
        to: email,
        subject: `新学年：${list.length} 位学生已自动升级年级和规划阶段`,
        html: layout(
          "新学年年级与阶段已更新",
          `<p>系统已在 ${today} 为你负责的学生自动升级年级，并把规划阶段推进一步。如有学生需要压缩或调整，请在学生页面手动修改，手动设置会被保留。</p>
           <table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="text-align:left;color:#6b7c78"><th style="padding:6px 8px">学生</th><th style="padding:6px 8px">年级</th><th style="padding:6px 8px">阶段</th></tr>${rows}</table>`,
        ),
      });
    }
    report.gradeAdvance = changes.map((c) => ({ id: c.student.id, name: c.student.full_name, from: c.from, to: c.to, phaseFrom: c.phaseFrom, phaseTo: c.phaseTo }));
    await markRan(gradeKey, { count: changes.length });
  }

  // ---------- 2) July: application-season prep for G11 ----------
  const prepKey = `application-prep-${year}`;
  if (month === 7 && !(await alreadyRan(prepKey))) {
    const { data: g11 } = await db.from("profiles").select("id, full_name, status, grade").eq("user_type", "student").eq("status", "G11");
    const byRecipient = new Map<string, Student[]>();
    for (const s of (g11 || []) as Student[]) {
      for (const email of teamEmails(s.id)) byRecipient.set(email, [...(byRecipient.get(email) || []), s]);
    }
    for (const [email, list] of byRecipient) {
      const names = list.map((s) => `<li>${esc(s.full_name || "学生")}</li>`).join("");
      outbox.push({
        to: email,
        subject: `申请季准备：${list.length} 位 11 年级学生即将进入申请季`,
        html: layout(
          "进入申请季准备阶段",
          `<p>以下学生 11 年级已结束，请开始申请季准备：确认选校名单、文书主题、推荐人和标化安排，并在学生页面把阶段设为「申请阶段」。</p><ul>${names}</ul>`,
        ),
      });
    }
    report.applicationPrep = (g11 || []).map((s) => ({ id: s.id, name: s.full_name }));
    await markRan(prepKey, { count: (g11 || []).length });
  }

  // ---------- 3) Daily: milestones due within 7 days ----------
  const until = addDays(today, 7);
  const { data: milestones } = await db
    .from("planning_milestones")
    .select("id, student_id, title, description, due_date, reminder_emails, reminder_sent")
    .eq("reminder_sent", false)
    .gte("due_date", today)
    .lte("due_date", until)
    .order("due_date");
  const { data: msStudents } = milestones?.length
    ? await db.from("profiles").select("id, full_name").in("id", [...new Set(milestones.map((m) => m.student_id))])
    : { data: [] };
  const nameOf = new Map((msStudents || []).map((s) => [s.id, s.full_name || "学生"]));
  const msByRecipient = new Map<string, typeof milestones>();
  for (const m of milestones || []) {
    const extra = Array.isArray(m.reminder_emails) ? (m.reminder_emails as string[]) : [];
    for (const email of new Set([...teamEmails(m.student_id), ...extra.filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))])) {
      msByRecipient.set(email, [...(msByRecipient.get(email) || []), m]);
    }
  }
  for (const [email, list] of msByRecipient) {
    const rows = (list || [])
      .map((m) => `<li style="margin-bottom:8px"><strong>${esc(m.due_date)}</strong> · ${esc(nameOf.get(m.student_id) || "学生")}：${esc(m.title)}${m.description ? `<br><span style="color:#6b7c78">${esc(m.description)}</span>` : ""}</li>`)
      .join("");
    outbox.push({
      to: email,
      subject: `未来 7 天有 ${list!.length} 个规划节点到期`,
      html: layout("规划节点提醒", `<p>以下规划节点将在 7 天内到期：</p><ul style="padding-left:18px">${rows}</ul>`),
    });
  }
  report.milestones = (milestones || []).map((m) => ({ id: m.id, title: m.title, due: m.due_date }));

  // ---------- 4) Report-card upload requests ----------
  // Two days before the due date: remind the student. After it: tell the team once.
  const { data: openRequests } = await db
    .from("academic_report_requests")
    .select("id, student_id, due_date, message, student_reminded, overdue_notified")
    .is("fulfilled_at", null);
  const remindIds: string[] = [];
  const overdueIds: string[] = [];
  if (openRequests?.length) {
    const ids = [...new Set(openRequests.map((r) => r.student_id))];
    const { data: reqStudents } = await db.from("profiles").select("id, full_name, email").in("id", ids);
    const info = new Map((reqStudents || []).map((s) => [s.id, s]));
    const soon = addDays(today, 2);
    for (const r of openRequests) {
      const s = info.get(r.student_id);
      if (!r.student_reminded && r.due_date <= soon && r.due_date >= today && s?.email) {
        remindIds.push(r.id);
        outbox.push({
          to: s.email,
          subject: `提醒：请在 ${r.due_date} 前上传最新成绩单`,
          html: layout(
            "别忘了上传成绩单",
            `<p>${esc(s.full_name || "同学")}，你好：</p><p>请在 <strong>${esc(r.due_date)}</strong> 前登录 DreamPlanner，在「我的信息 → 成绩单」上传最新的成绩单（PDF、照片或截图都可以）。</p>`,
          ).replace(`${SITE}/counselor-dashboard`, `${SITE}/student-dashboard/${r.student_id}`).replace("打开 DreamPlanner", "去上传"),
        });
      }
      if (!r.overdue_notified && r.due_date < today) {
        overdueIds.push(r.id);
        for (const email of teamEmails(r.student_id)) {
          outbox.push({
            to: email,
            subject: `成绩单逾期未上传：${s?.full_name || "学生"}`,
            html: layout(
              "成绩单逾期未上传",
              `<p>${esc(s?.full_name || "学生")} 还没有上传成绩单（截止日期 ${esc(r.due_date)}）。请跟进，或在学生页面代为上传。</p>`,
            ),
          });
        }
      }
    }
  }
  report.reportRequests = { remindStudents: remindIds.length, overdue: overdueIds.length };

  // ---------- send ----------
  const sent: string[] = [];
  const failed: string[] = [];
  if (!dry && resendKey) {
    for (const mail of outbox) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [mail.to], subject: mail.subject, html: mail.html }),
      });
      (res.ok ? sent : failed).push(mail.to);
    }
    if (remindIds.length) await db.from("academic_report_requests").update({ student_reminded: true }).in("id", remindIds);
    if (overdueIds.length) await db.from("academic_report_requests").update({ overdue_notified: true }).in("id", overdueIds);
    if (milestones?.length && failed.length === 0) {
      await db.from("planning_milestones").update({ reminder_sent: true }).in("id", milestones.map((m) => m.id));
    }
  }
  if (dry && previewOk && resendKey) {
    for (const mail of outbox) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [previewTo],
          subject: `[测试] ${mail.subject}`,
          html: mail.html.replace("<body", `<body data-original-to="${esc(mail.to)}"`).replace(
            '<div style="background:#fff',
            `<p style="font-size:12px;color:#b45309;margin:0 0 8px">测试邮件 · 正式发送时收件人：${esc(mail.to)}</p><div style="background:#fff`,
          ),
        }),
      });
      (res.ok ? sent : failed).push(mail.to);
    }
  }
  report.emails = dry
    ? { planned: outbox.map((m) => ({ to: m.to, subject: m.subject })), previewSent: sent.length, previewFailed: failed }
    : { sent: sent.length, failed };

  return new Response(JSON.stringify(report, null, 2), { headers: { "Content-Type": "application/json" } });
});
