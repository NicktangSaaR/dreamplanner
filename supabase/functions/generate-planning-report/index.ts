
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reportType, studentName, phase, quarter, academicYear, kpiData, courseSummary, activitySummary, planningDocContent, language, applicantType, applicantProfile, gradDegree } = await req.json();
    const isGrad = applicantType === "graduate";
    const isMba = gradDegree === "mba";
    const english = language === "en";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    let apiUrl: string;
    let apiKey: string;
    let model: string;

    // Prefer our own providers; Lovable gateway is a last-resort fallback only.
    if (DEEPSEEK_API_KEY) {
      apiUrl = "https://api.deepseek.com/v1/chat/completions";
      apiKey = DEEPSEEK_API_KEY;
      model = "deepseek-chat";
    } else if (OPENAI_API_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = OPENAI_API_KEY;
      model = "gpt-4o-mini";
    } else if (LOVABLE_API_KEY) {
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      model = "google/gemini-3-flash-preview";
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
      grad_positioning: "定位阶段",
      grad_background: "背景提升阶段",
      grad_materials: "材料准备阶段",
      grad_application: "申请阶段",
      grad_admission: "录取阶段",
      exploration: "探索阶段",
      positioning: "定位阶段",
      consolidation: "聚焦阶段",
      application: "申请阶段",
    };

    const docContext = planningDocContent
      ? `\n\n规划方案文档内容（摘要）：\n${planningDocContent.substring(0, 3000)}`
      : "";

    const zhRole = isGrad
      ? `你是一位资深${isMba ? "MBA" : "硕士研究生"}申请规划顾问（学生情况：${applicantProfile || "研究生申请者"}）。评估时关注${isMba ? "工作经历、领导力、GMAT/GRE、Essay、推荐人和面试" : "GPA、标化考试、实习与科研/项目、选校匹配、文书和推荐人"}；规划只到录取为止，不涉及签证。`
      : "你是一位资深美国大学申请规划顾问。";
    const zhExpLabel = isGrad ? "工作/实习与科研/项目经历（来自简历）" : "课外活动";
    const zhSection3 = isGrad
      ? `### 3. 背景经历评估\n评估${isMba ? "工作经历的成长轨迹、领导力和量化成果" : "实习、科研/项目经历与目标专业的匹配度和深度"}，以及申请故事线的构建（研究生申请不评估课外活动）。`
      : "### 3. 课外活动发展评估\n评估活动深度、广度和个人叙事线的构建。";
    const zhPrompt = isQuarterly
      ? `${zhRole}请为学生「${studentName || "学生"}」生成${quarterNames[quarter] || quarter} (${academicYear}) 的季度规划工作完成情况评估报告。

当前阶段: ${phaseNames[phase] || phase}

季度KPI完成情况:
${kpiData || "暂无KPI数据"}

学术情况:
${courseSummary || "暂无课程数据"}

${zhExpLabel}:
${activitySummary || "暂无"}${docContext}

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

      : `${zhRole}请为学生「${studentName || "学生"}」生成${phaseNames[phase] || phase}的阶段总结报告。

学年: ${academicYear}

学术情况:
${courseSummary || "暂无课程数据"}

${zhExpLabel}:
${activitySummary || "暂无"}

KPI完成概况:
${kpiData || "暂无KPI数据"}${docContext}

请生成以下内容（使用Markdown格式）：
## 阶段规划总结报告

### 1. 阶段核心成果回顾
回顾该阶段的重要里程碑和成果。

### 2. 学术发展评估
分析GPA趋势、课程选择合理性、学术竞争力。

${zhSection3}

### 4. 下一阶段战略建议
给出3-5条具体的、可执行的下一阶段核心行动建议。

### 5. 整体竞争力评价
对学生当前的整体申请竞争力进行简要评估。

请确保内容具体、有针对性，体现专业水准。`;


    const quarterNamesEn: Record<string, string> = {
      Q1_fall: "Fall term (Sep–Nov)",
      Q2_winter: "Winter term (Dec–Feb)",
      Q3_spring: "Spring term (Mar–May)",
      Q4_summer: "Summer (Jun–Aug)",
    };
    const phaseNamesEn: Record<string, string> = {
      grad_positioning: "Positioning stage",
      grad_background: "Profile-building stage",
      grad_materials: "Materials stage",
      grad_application: "Applications stage",
      grad_admission: "Admissions stage",
      exploration: "Exploration stage",
      positioning: "Positioning stage",
      consolidation: "Consolidation stage",
      application: "Application stage",
    };
    const docContextEn = planningDocContent
      ? `\n\nPlanning document (excerpt, may be in Chinese):\n${planningDocContent.substring(0, 3000)}`
      : "";
    const name = studentName || "the student";

    const enRole = isGrad
      ? `You are a senior ${isMba ? "MBA" : "master's"} admissions planning counselor (student: ${applicantProfile || "graduate applicant"}). Focus on ${isMba ? "work experience, leadership, GMAT/GRE, essays, recommenders and interviews" : "GPA, test scores, internships and research/projects, program fit, statement of purpose and recommenders"}; the plan ends at admission and does not cover visas.`
      : "You are a senior US college admissions planning counselor.";
    const enExpLabel = isGrad ? "Work, internship, research and project experience (from resume)" : "Activities";
    const enSection3 = isGrad
      ? `### 3. Professional and academic experience\n${isMba ? "Career progression, leadership and quantified impact" : "How internships, research and projects fit the target program, and their depth"}, and how the application story is taking shape (no extracurricular-activities assessment for graduate applicants).`
      : "### 3. Activities and personal narrative\nDepth, breadth and how the student's story is taking shape.";
    const enPrompt = isQuarterly
      ? `${enRole} Write a quarterly progress review for ${name} covering ${quarterNamesEn[quarter] || quarter} (${academicYear}).

Current stage: ${phaseNamesEn[phase] || phase}

Quarterly goals and completion (may be in Chinese):
${kpiData || "No goal data"}

Academics:
${courseSummary || "No course data"}

${enExpLabel}:
${activitySummary || "None"}${docContextEn}

Write the report in clear, professional English, in Markdown, with these sections:
## Quarterly Review

### 1. Key achievements this quarter
### 2. Progress on quarterly goals
Assess each goal and give an overall completion rate.
### 3. Priorities for next quarter
3–5 specific, actionable recommendations.
### 4. Risks to watch

Be specific to this student and avoid generic advice. Translate any Chinese input into English.`
      : `${enRole} Write a stage summary report for ${name} for the ${phaseNamesEn[phase] || phase}.

Academic year: ${academicYear}

Academics:
${courseSummary || "No course data"}

${enExpLabel}:
${activitySummary || "None"}

Goal completion overview (may be in Chinese):
${kpiData || "No goal data"}${docContextEn}

Write the report in clear, professional English, in Markdown, with these sections:
## Stage Summary Report

### 1. Key milestones this stage
### 2. Academic development
GPA trend, course choices and academic competitiveness.
${enSection3}
### 4. Strategy for the next stage
3–5 specific, actionable recommendations.
### 5. Overall competitiveness

Be specific to this student and professional in tone. Translate any Chinese input into English.`;

    const prompt = english ? enPrompt : zhPrompt;

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
