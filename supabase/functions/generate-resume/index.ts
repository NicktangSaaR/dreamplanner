// Turn resume form data into a polished resume (Markdown).
//
// POST { resumeData, applicantType?: "undergrad" | "graduate", gradDegree?: "masters" | "mba", language?: "en" | "zh" }
//   Returns { resume }. Graduate resumes have no extracurricular-activities
//   section; MBA resumes follow the one-page professional format.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeData, applicantType, gradDegree, language } = await req.json();
    const grad = applicantType === "graduate";
    const mba = grad && gradDegree === "mba";
    const zh = language === "zh";

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Prefer our own providers; Lovable gateway is a last-resort fallback only.
    let apiUrl: string;
    let apiKey: string;
    let model: string;
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

    const audience = mba
      ? "MBA applicants. Follow the standard one-page MBA resume: Professional Experience first (most recent first), each role with 3–5 results-focused bullets that show leadership, scope and quantified impact; then Education (with GMAT/GRE if given); then Additional Information (skills, languages, certifications, community leadership, interests). No objective statement."
      : grad
        ? "master's program applicants. Order: Education (degree, GPA, relevant coursework), Research & Project Experience, Professional / Internship Experience, Awards, Skills & Languages. Emphasize methods, tools and outcomes that show readiness for graduate study. No objective statement."
        : "high school and college students applying to university. Sections: Education, Experience, Activities & Leadership, Awards, Skills.";

    const sections = grad
      ? "Contact Info, Education, Experience, Research/Projects, Awards, Skills, Languages, Certifications"
      : "Contact Info, Education, Experience, Activities, Awards, Skills";

    const systemPrompt = `You are an expert resume writer for ${audience}

Guidelines:
1. Use strong action verbs and quantify results when the input supports it — never invent numbers, employers, titles or dates.
2. Tighten wording, fix grammar, and turn long descriptions into concise bullets.
3. Keep it scannable and consistent (date format "Mon YYYY – Mon YYYY").
4. Include only these sections when there is content for them: ${sections}.${grad ? "\n5. Do not add an extracurricular activities section." : ""}
${zh ? "Write the resume in Chinese, keeping proper nouns (schools, companies) in their original form." : "Write the resume in English; translate any Chinese input into natural professional English."}

Output only the resume, in clean Markdown (a # heading with the name, a contact line, ## section headings, - bullets).`;

    const block = (label: string, value: unknown) =>
      Array.isArray(value) && value.length === 0 ? "" : `\n**${label}:**\n${JSON.stringify(value ?? [], null, 2)}\n`;

    const userPrompt = `Create the resume from this information:

**Personal Information:**
- Name: ${resumeData.full_name || "Not provided"}
- Email: ${resumeData.email || "Not provided"}
- Phone: ${resumeData.phone || "Not provided"}
- Address: ${resumeData.address || "Not provided"}
- LinkedIn: ${resumeData.linkedin_url || "Not provided"}
- Personal Website: ${resumeData.personal_website || "Not provided"}
${block("Education", resumeData.education)}${block("Work / Internship Experience", resumeData.work_experience)}${grad ? "" : block("Extracurricular Activities", resumeData.activities)}${block(grad ? "Research / Projects / Leadership" : "Projects", resumeData.projects)}${block("Awards & Honors", resumeData.awards)}${block("Skills", resumeData.skills)}${block("Certifications", resumeData.certifications)}${block("Languages", resumeData.languages)}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "请求过于频繁，请稍后再试" }, 429);
      if (response.status === 402) return json({ error: "AI服务额度不足" }, 402);
      console.error("AI gateway error:", response.status, await response.text());
      return json({ error: "AI服务暂时不可用" }, 500);
    }

    const data = await response.json();
    const generatedResume = data.choices?.[0]?.message?.content;
    if (!generatedResume) throw new Error("Failed to generate resume content");
    return json({ resume: generatedResume.replace(/^```(?:markdown)?\s*/i, "").replace(/```\s*$/, "").trim() });
  } catch (error) {
    console.error("Error generating resume:", error);
    return json({ error: error instanceof Error ? error.message : "生成简历时发生错误" }, 500);
  }
});
