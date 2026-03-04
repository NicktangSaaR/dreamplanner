import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reportType, studentName, phase, quarter, academicYear, kpiData, courseSummary, activitySummary, planningDocContent } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    let apiUrl: string;
    let apiKey: string;
    let model: string;

    if (LOVABLE_API_KEY) {
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      model = "google/gemini-3-flash-preview";
    } else if (DEEPSEEK_API_KEY) {
      apiUrl = "https://api.deepseek.com/v1/chat/completions";
      apiKey = DEEPSEEK_API_KEY;
      model = "deepseek-chat";
    } else if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = OPENAI_API_KEY;
      model = "gpt-4o-mini";
    } else {
      throw new Error("No AI API key configured");
    }

    const isQuarterly = reportType === "quarterly";

    const quarterNames: Record<string, string> = {
      Q1_fall: "秋季学期 (9-11月)",
      Q2_winter: "冬季学期 (12-2月)",
      Q3_spring: "春季学期 (3-5月)",
      Q4_summer: "暑期 (6-8月)",
    };

    const phaseNames: Record<string, string> = {
      exploration: "探索阶段",
      positioning: "定位阶段",
      consolidation: "聚焦阶段",
      application: "申请阶段",
    };

    const docContext = planningDocContent
      ? `\n\n规划方案文档内容（摘要）：\n${planningDocContent.substring(0, 3000)}`
      : "";

    const prompt = isQuarterly
      ? `你是一位资深美国大学申请规划顾问。请为学生「${studentName || "学生"}」生成${quarterNames[quarter] || quarter} (${academicYear}) 的季度规划工作完成情况评估报告。

当前阶段: ${phaseNames[phase] || phase}

季度KPI完成情况:
${kpiData || "暂无KPI数据"}

学术情况:
${courseSummary || "暂无课程数据"}

课外活动:
${activitySummary || "暂无活动数据"}${docContext}

请生成以下内容（使用Markdown格式）：
## 季度评估报告

### 1. 本季度核心成果
总结该季度的主要完成事项和亮点。

### 2. KPI完成情况分析
分析各KPI的完成进度，给出完成率评估。

### 3. 下阶段重点建议
基于当前进展，提出具体的下一季度3-5个关键行动建议。

### 4. 风险提示
指出当前存在的潜在问题或需要关注的事项。

请确保内容具体、有针对性，避免泛泛而谈。`

      : `你是一位资深美国大学申请规划顾问。请为学生「${studentName || "学生"}」生成${phaseNames[phase] || phase}的阶段总结报告。

学年: ${academicYear}

学术情况:
${courseSummary || "暂无课程数据"}

课外活动:
${activitySummary || "暂无活动数据"}

KPI完成概况:
${kpiData || "暂无KPI数据"}${docContext}

请生成以下内容（使用Markdown格式）：
## 阶段规划总结报告

### 1. 阶段核心成果回顾
回顾该阶段的重要里程碑和成果。

### 2. 学术发展评估
分析GPA趋势、课程选择合理性、学术竞争力。

### 3. 课外活动发展评估
评估活动深度、广度和个人叙事线的构建。

### 4. 下一阶段战略建议
给出3-5条具体的、可执行的下一阶段核心行动建议。

### 5. 整体竞争力评价
对学生当前的整体申请竞争力进行简要评估。

请确保内容具体、有针对性，体现专业水准。`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足，请充值后再试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      throw new Error(`AI API error: ${response.status} ${t}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ report: content }), {
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
