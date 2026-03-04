import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentId, quarter, academicYear, currentPhase, scheme, schemeDescription, documentContent, documentTitle } = await req.json();
    
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    const apiKey = DEEPSEEK_API_KEY || OPENAI_API_KEY;
    const apiUrl = DEEPSEEK_API_KEY 
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini";

    if (!apiKey) throw new Error("No AI API key configured");

    const quarterNames: Record<string, string> = {
      Q1_fall: "秋季学期 (9-11月)",
      Q2_winter: "冬季学期 (12-2月)",
      Q3_spring: "春季学期 (3-5月)",
      Q4_summer: "暑期 (6-8月)",
    };

    const schemeContext = scheme && schemeDescription
      ? `\n规划风格: ${scheme} - ${schemeDescription}\n请严格按照该风格的侧重方向生成建议。`
      : "";

    // Truncate document content to avoid token limits
    const docContent = documentContent ? documentContent.substring(0, 4000) : "";
    const documentContext = docContent
      ? `\n\n以下是该学生的规划方案文档「${documentTitle || "规划方案"}」的内容，请基于此方案内容生成具体的季度执行建议：\n---\n${docContent}\n---\n请务必结合上述规划方案的具体内容来生成建议，而非泛泛而谈。`
      : "";

    const prompt = `你是一位资深的美国大学申请规划顾问。请根据以下信息，为学生生成${quarterNames[quarter] || quarter}的规划建议。

当前阶段: ${currentPhase || "exploration"}
学年: ${academicYear}${schemeContext}${documentContext}

请用JSON格式返回：
{
  "focus": "本季度核心重点（1-2句话）",
  "kpi": "具体的KPI指标（3-5个量化目标）",
  "risk": "潜在风险和应对策略",
  "items": ["具体行动项1", "具体行动项2", "具体行动项3", "具体行动项4", "具体行动项5"]
}

请确保建议具体、可执行、符合美本申请节奏。只返回JSON，不要其他内容。`;

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
    const content = result.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON from response (handle markdown code blocks)
    let suggestions;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(jsonStr);
    } catch {
      suggestions = { focus: content, kpi: "", risk: "", items: [] };
    }

    return new Response(JSON.stringify({ suggestions }), {
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
