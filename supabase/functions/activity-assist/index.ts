// Draft the application-ready English for one activity: English name,
// position, organization, a fuller description, the Common App (150) and UC
// (350) versions and the two category labels. The counselor reviews the draft
// before it is saved; nothing is written here.
//
// POST { student_id, activity: {...} }  (Authorization: the counselor's session)
//   -> { suggestion, provider }
// Staff of that student (or admins) only. DeepSeek first, OpenAI if it fails.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { type ActivityInput, normalize, SYSTEM, userMessage } from "./logic.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Provider = { name: string; url: string; key: string; model: string };

async function ask(p: Provider, messages: { role: string; content: string }[]) {
  const res = await fetch(p.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: p.model, temperature: 0.3, response_format: { type: "json_object" }, messages }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`${p.name} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = await res.json();
  return JSON.parse(out.choices?.[0]?.message?.content || "{}") as Record<string, unknown>;
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

  let body: { student_id?: string; activity?: ActivityInput };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  const studentId = String(body.student_id ?? "");
  const activity = body.activity ?? {};
  if (!studentId || !(activity.name || activity.description)) return json({ error: "请先填写活动名称或描述" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const [{ data: allowed }, { data: isAdmin }] = await Promise.all([
    admin.rpc("can_access_student_data", { viewer_id: user.id, student_id: studentId }),
    admin.rpc("is_admin", { user_id: user.id }),
  ]);
  if (!allowed && !isAdmin) return json({ error: "只有这位学生的顾问可以使用 AI 补全" }, 403);

  const providers: Provider[] = [];
  const ds = Deno.env.get("DEEPSEEK_API_KEY");
  const oa = Deno.env.get("OPENAI_API_KEY");
  if (ds) providers.push({ name: "deepseek", url: "https://api.deepseek.com/v1/chat/completions", key: ds, model: "deepseek-chat" });
  if (oa) providers.push({ name: "openai", url: "https://api.openai.com/v1/chat/completions", key: oa, model: "gpt-4o-mini" });
  if (!providers.length) return json({ error: "AI 服务没有配置" }, 500);

  const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: userMessage(activity) }];
  for (const p of providers) {
    try {
      let { s, over } = normalize(await ask(p, messages));
      if (over.length) {
        // one more try for the fields that ran long, rather than cutting words off
        const again = await ask(p, [...messages, { role: "assistant", content: JSON.stringify(s) },
          { role: "user", content: `These fields were over their character limits and were cut: ${over.join(", ")}. Rewrite them to fit, keeping the meaning. Return the full JSON again.` }]);
        s = normalize(again).s;
      }
      return json({ suggestion: s, provider: p.name });
    } catch (e) {
      console.error("activity-assist", p.name, e);
    }
  }
  return json({ error: "AI 暂时不可用，请稍后再试" }, 502);
});
