// 定时任务：扫描即将到期的 to-do（明天到期、今天到期），逐个调用 wechat-send-subscribe
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const templateId = Deno.env.get("WECHAT_TEMPLATE_TODO_DUE") ?? "";
    if (!templateId) {
      return new Response(JSON.stringify({ error: "WECHAT_TEMPLATE_TODO_DUE not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 3600 * 1000);

    // 当天 + 明天到期、未完成
    const { data: todos } = await admin
      .from("todos")
      .select("id, title, due_date, author_id, completed")
      .eq("completed", false)
      .gte("due_date", now.toISOString())
      .lt("due_date", dayAfter.toISOString());

    if (!todos || todos.length === 0) {
      return new Response(JSON.stringify({ status: "no_todos" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 只对已绑定微信的用户推送
    const userIds = [...new Set(todos.map((t) => t.author_id))];
    const { data: bindings } = await admin
      .from("wechat_bindings")
      .select("user_id")
      .in("user_id", userIds);
    const boundSet = new Set((bindings ?? []).map((b) => b.user_id));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const results: any[] = [];
    for (const t of todos) {
      if (!boundSet.has(t.author_id)) continue;
      const due = new Date(t.due_date as string);
      const data = {
        thing1: { value: (t.title as string).slice(0, 20) },
        time2: { value: due.toISOString().slice(0, 16).replace("T", " ") },
        thing3: { value: due < tomorrow ? "今日到期，请尽快完成" : "明日到期，请提前安排" },
      };
      const res = await fetch(`${supabaseUrl}/functions/v1/wechat-send-subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          user_id: t.author_id,
          template_id: templateId,
          todo_id: t.id,
          page: `pages/todo/detail?id=${t.id}`,
          data,
        }),
      });
      results.push({ todo_id: t.id, status: res.status });
    }

    return new Response(JSON.stringify({ status: "ok", count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
