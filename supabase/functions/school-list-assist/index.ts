// AI help for the school list. Nothing is saved here; the counselor reviews
// every suggestion first.
//
// POST { action: "extract", student_id }
//   Reads the student's planning documents, planning reports and meeting
//   notes and returns the schools they mention: { schools: [...], sources }.
// POST { action: "todos", student_id }
//   Reads the confirmed school list and returns to-dos counted back from each
//   deadline, for the student or the counselor: { todos: [...] }.
// The student's counselors and team teachers (and admins) only.
// DeepSeek first, OpenAI if it fails.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { cleanSchools, cleanTodos, EXTRACT_PROMPT, TODOS_PROMPT } from "./logic.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SOURCE_LIMIT = 24_000; // characters of source text sent to the model

type Provider = { name: string; url: string; key: string; model: string };
function providers(): Provider[] {
  const out: Provider[] = [];
  const ds = Deno.env.get("DEEPSEEK_API_KEY");
  const oa = Deno.env.get("OPENAI_API_KEY");
  if (ds) out.push({ name: "deepseek", url: "https://api.deepseek.com/v1/chat/completions", key: ds, model: "deepseek-chat" });
  if (oa) out.push({ name: "openai", url: "https://api.openai.com/v1/chat/completions", key: oa, model: "gpt-4o-mini" });
  return out;
}
async function ask(system: string, user: string): Promise<Record<string, unknown>> {
  for (const p of providers()) {
    try {
      const res = await fetch(p.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: p.model, temperature: 0.2, response_format: { type: "json_object" },
          messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) throw new Error(`${p.name} ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const out = await res.json();
      return JSON.parse(out.choices?.[0]?.message?.content || "{}");
    } catch (e) {
      console.error("school-list-assist", p.name, e);
    }
  }
  throw new Error("no provider");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: "请先登录" }, 401);

  let body: { action?: string; student_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  const studentId = String(body.student_id ?? "");
  if (!studentId) return json({ error: "student_id required" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const [{ data: allowed }, { data: isAdmin }] = await Promise.all([
    admin.rpc("can_access_student_data", { viewer_id: user.id, student_id: studentId }),
    admin.rpc("is_admin", { user_id: user.id }),
  ]);
  if (!allowed && !isAdmin) return json({ error: "只有这位学生的顾问可以使用" }, 403);
  if (!providers().length) return json({ error: "AI 服务没有配置" }, 500);
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (body.action === "extract") {
      // newest material first, so the latest list survives the length limit
      const [docs, reports, meetings, prof] = await Promise.all([
        admin.from("planning_documents").select("title, content, created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(5),
        admin.from("planning_reports").select("title, final_content, ai_draft, created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(5),
        admin.from("student_meetings").select("title, meeting_date, decisions, meeting_notes, ai_generated_minutes, summary").eq("student_id", studentId).order("meeting_date", { ascending: false }).limit(8),
        admin.from("profiles").select("interested_majors, applicant_type, status").eq("id", studentId).maybeSingle(),
      ]);
      const parts: string[] = [];
      for (const m of meetings.data ?? []) {
        const t = [m.decisions, m.summary, m.ai_generated_minutes || m.meeting_notes].filter(Boolean).join("\n");
        if (t) parts.push(`### Meeting ${m.meeting_date ?? ""} ${m.title ?? ""}\n${t}`);
      }
      for (const r of reports.data ?? []) {
        const t = r.final_content || r.ai_draft;
        if (t) parts.push(`### Planning report ${r.created_at?.slice(0, 10) ?? ""} ${r.title ?? ""}\n${t}`);
      }
      for (const d of docs.data ?? []) if (d.content) parts.push(`### Planning document ${d.created_at?.slice(0, 10) ?? ""} ${d.title ?? ""}\n${d.content}`);
      const sources = { meetings: meetings.data?.length ?? 0, reports: reports.data?.length ?? 0, documents: docs.data?.length ?? 0 };
      if (!parts.length) return json({ schools: [], sources, empty: true });
      let text = parts.join("\n\n");
      if (text.length > SOURCE_LIMIT) text = text.slice(0, SOURCE_LIMIT);
      const student = `Student: ${prof.data?.applicant_type === "graduate" ? "master's applicant" : prof.data?.status === "Transfer Student" ? "transfer applicant" : "first-year undergraduate applicant"}; interested majors: ${prof.data?.interested_majors ?? "unknown"}`;
      const raw = await ask(EXTRACT_PROMPT(today), `${student}\n\n${text}`);
      return json({ schools: cleanSchools(raw), sources });
    }

    if (body.action === "todos") {
      const { data: list } = await admin.from("college_applications")
        .select("college_name, major, round, application_system, deadline, status, category")
        .eq("student_id", studentId).order("deadline", { ascending: true, nullsFirst: false });
      const open = (list ?? []).filter((s) => s.status === "preparing" || s.status === "considering");
      if (!open.length) return json({ todos: [], empty: true });
      const raw = await ask(TODOS_PROMPT(today), JSON.stringify(open));
      return json({ todos: cleanTodos(raw, today) });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("school-list-assist", e);
    return json({ error: "AI 暂时不可用，请稍后再试" }, 502);
  }
});
