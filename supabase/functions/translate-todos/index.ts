// Fill in the Chinese and English versions of to-do titles.
// Called by the todos trigger (new or renamed to-dos) and for backfills.
//
// POST { ids?: string[], backfill?: boolean }   header x-cron-secret: CRON_SECRET
//   ids: translate these to-dos; backfill: the next batch still missing a translation.
//   -> { translated, remaining? }
//
// A title already in one language is kept as that language's version; only
// the other one is translated. Names of schools, exams, competitions and
// programs, numbers, dates and leading emoji are kept as they are.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const CJK = /[㐀-鿿]/;

const SYSTEM = `你是留学规划平台的翻译助手。把每条待办事项翻译成简体中文和英文两个版本。
规则：
- 意思准确、简洁，像待办清单的写法（英文用祈使句开头，如 "Finish…", "Submit…"）。
- 大学、考试、竞赛、项目、课程、机构等专有名词保留常用英文原名（如 Common App、SAT、AP Calculus BC、UBC），中文版里也保留英文原名。
- 保留数字、日期、分数和开头的表情符号（如 📌）。
- 不要添加原文没有的信息。
只返回 JSON：{"items":[{"id":"…","zh":"…","en":"…"}]}，每个输入的 id 都要有。`;

async function translate(items: { id: string; title: string }[], key: string) {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify({ items: items.map((i) => ({ id: i.id, text: i.title })) }) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = await res.json();
  const parsed = JSON.parse(out.choices?.[0]?.message?.content || "{}");
  const map = new Map<string, { zh: string; en: string }>();
  for (const r of Array.isArray(parsed.items) ? parsed.items : []) {
    if (r && typeof r.id === "string") map.set(r.id, { zh: String(r.zh ?? "").trim(), en: String(r.en ?? "").trim() });
  }
  return map;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ error: "unauthorized" }, 401);
  const key = Deno.env.get("DEEPSEEK_API_KEY");
  if (!key) return json({ error: "AI not configured" }, 500);

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 200) : [];
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  // rows whose translation is missing or out of date
  let q = db.from("todos").select("id, title, title_source").not("title", "is", null);
  q = ids.length ? q.in("id", ids) : q.or("title_source.is.null,title_zh.is.null,title_en.is.null").order("created_at", { ascending: false }).limit(120);
  const { data, error } = await q;
  if (error) return json({ error: error.message }, 500);
  const todo = (data ?? []).filter((r) => r.title?.trim() && r.title_source !== r.title) as { id: string; title: string }[];

  let translated = 0;
  for (let i = 0; i < todo.length; i += 30) {
    const batch = todo.slice(i, i + 30);
    let map: Map<string, { zh: string; en: string }>;
    try {
      map = await translate(batch, key);
    } catch (e) {
      console.error("translate-todos", e);
      continue;
    }
    for (const r of batch) {
      const t = map.get(r.id);
      if (!t) continue;
      // a title with Chinese in it ("完成 Common App 主文书") is the Chinese version; otherwise the English one
      const isZh = CJK.test(r.title);
      const zh = isZh ? r.title : t.zh;
      const en = isZh ? t.en : r.title;
      if (!zh || !en) continue;
      // only if nobody renamed it meanwhile
      const { error: upErr } = await db.from("todos").update({ title_zh: zh, title_en: en, title_source: r.title }).eq("id", r.id).eq("title", r.title);
      if (upErr) console.error("translate-todos update", upErr);
      else translated++;
    }
  }

  if (body.backfill) {
    const { count } = await db.from("todos").select("id", { count: "exact", head: true }).or("title_source.is.null,title_zh.is.null,title_en.is.null");
    return json({ translated, remaining: count ?? null });
  }
  return json({ translated });
});
