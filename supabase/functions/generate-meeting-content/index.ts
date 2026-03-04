import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { meetingId, type, studentId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch meeting data
    const { data: meeting, error: meetingError } = await supabase
      .from("student_meetings")
      .select("*")
      .eq("id", meetingId)
      .single();
    if (meetingError) throw meetingError;

    // Fetch action items
    const { data: actions } = await supabase
      .from("meeting_action_items")
      .select("*")
      .eq("meeting_id", meetingId);

    // Fetch student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, grade, school")
      .eq("id", studentId)
      .single();

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    const apiKey = DEEPSEEK_API_KEY || OPENAI_API_KEY;
    const apiUrl = DEEPSEEK_API_KEY 
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini";

    if (!apiKey) throw new Error("No AI API key configured");

    const meetingContext = `
学生: ${profile?.full_name || "未知"} | 年级: ${profile?.grade || "未知"} | 学校: ${profile?.school || "未知"}
会议日期: ${meeting.meeting_date}
核心目标: ${meeting.core_goal || "未设置"}
上月完成度: ${meeting.last_month_completion || "未记录"}
当前风险: ${meeting.current_risk || "无"}
决策记录: ${meeting.decisions || "无"}
会议备注: ${meeting.meeting_notes || "无"}
行动项: ${actions?.map(a => `- ${a.title} (${a.priority}, 分配: ${a.assigned_to || "未分配"}, 截止: ${a.due_date || "无"})`).join("\n") || "无"}
下次会议: ${meeting.next_meeting_date || "未定"}`;

    let prompt = "";
    if (type === "minutes") {
      prompt = `请根据以下会议信息，生成一份专业的双语（中英文）会议纪要。格式清晰，包含：会议概述、讨论要点、决策事项、行动清单（含负责人和截止日期）、下次会议安排。

${meetingContext}`;
    } else {
      prompt = `请根据以下会议信息，生成一封发给学生和家长的双语（中英文）会议跟进邮件。语气专业友好，包含：会议回顾、关键决策、下一步行动、下次会议提醒。

${meetingContext}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      throw new Error(`AI API error: ${response.status} ${t}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
