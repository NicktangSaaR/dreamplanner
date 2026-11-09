const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentId, quarter, academicYear, currentPhase, scheme, schemeDescription, documentContent, documentTitle, previousReport, unfinishedGoals, applicantType, applicantProfile, gradDegree } = await req.json();
    const isGrad = applicantType === "graduate";
    
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

    const prevContext = previousReport
      ? `\n\n上一季度的评估报告（摘要）：\n---\n${String(previousReport).substring(0, 2500)}\n---\n请延续上季度的结论和建议。`
      : "";
    const unfinishedContext = Array.isArray(unfinishedGoals) && unfinishedGoals.length
      ? `\n\n上一季度未完成的目标：\n${unfinishedGoals.map((g: string) => `- ${g}`).join("\n")}\n如果仍然重要，请纳入本季度目标。`
      : "";

    const gradPhaseNames: Record<string, string> = {
      grad_positioning: "定位（选方向、选校、差距分析）",
      grad_background: "背景提升（考试、实习/工作、科研/项目、GPA）",
      grad_materials: "材料准备（简历、文书/Essay、推荐人、作品集）",
      grad_application: "申请（网申提交、面试准备）",
      grad_admission: "录取（等待结果、补材料、选校决定、押金）",
    };
    const role = isGrad
      ? `你是一位资深的${gradDegree === "mba" ? "MBA" : "硕士研究生"}申请规划顾问。学生情况：${applicantProfile || "研究生申请者"}。${
          gradDegree === "mba"
            ? "MBA 申请重点：工作经历与职业目标、领导力、GMAT/GRE、Essay、推荐人、面试、分轮次（R1/R2/R3）申请。"
            : "硕士申请重点：GPA 与相关课程、GRE/雅思/托福、实习与科研/项目经历、选校与项目匹配、文书（SOP/PS）、推荐人（教授/主管）。"
        }目标只写到录取为止，不涉及签证。`
      : "你是一位资深的美国大学申请规划顾问。";
    const prompt = `${role}请根据以下信息，为学生生成${quarterNames[quarter] || quarter}的规划建议。

当前阶段: ${isGrad ? gradPhaseNames[currentPhase] || currentPhase : currentPhase || "exploration"}
学年: ${academicYear}${schemeContext}${documentContext}${prevContext}${unfinishedContext}

请用JSON格式返回：
{
  "focus": "本季度核心重点（1-2句话）",
  "kpi": ["量化目标1", "量化目标2", "量化目标3"],
  "risk": "潜在风险和应对策略",
  "items": ["具体行动项1", "具体行动项2", "具体行动项3", "具体行动项4", "具体行动项5"]
}

kpi 必须是数组，每个元素是一条独立、可量化的目标（3-5 条），不要把多条目标合并成一段，也不要加编号。
请确保建议具体、可执行、符合${isGrad ? "研究生（硕士/MBA）" : "本科"}申请节奏。只返回JSON，不要其他内容。`;

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
