import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert resume writer specializing in creating professional resumes for high school and college students. 
Your task is to transform the provided student information into a well-structured, compelling resume.

Guidelines:
1. Use action verbs and quantify achievements when possible
2. Highlight leadership roles and impact
3. Keep descriptions concise but impactful
4. Organize information in a clear, scannable format
5. Tailor the language to be appropriate for academic and professional settings
6. Include all relevant sections: Contact Info, Education, Experience, Activities, Awards, Skills

Output the resume in a clean, professional markdown format that can be easily converted to PDF.`;

    const userPrompt = `Please create a professional resume based on the following information:

**Personal Information:**
- Name: ${resumeData.full_name || 'Not provided'}
- Email: ${resumeData.email || 'Not provided'}
- Phone: ${resumeData.phone || 'Not provided'}
- Address: ${resumeData.address || 'Not provided'}
- LinkedIn: ${resumeData.linkedin_url || 'Not provided'}
- Personal Website: ${resumeData.personal_website || 'Not provided'}

**Education:**
${JSON.stringify(resumeData.education || [], null, 2)}

**Work/Internship Experience:**
${JSON.stringify(resumeData.work_experience || [], null, 2)}

**Extracurricular Activities:**
${JSON.stringify(resumeData.activities || [], null, 2)}

**Awards & Honors:**
${JSON.stringify(resumeData.awards || [], null, 2)}

**Skills:**
${JSON.stringify(resumeData.skills || [], null, 2)}

**Certifications:**
${JSON.stringify(resumeData.certifications || [], null, 2)}

**Projects:**
${JSON.stringify(resumeData.projects || [], null, 2)}

**Languages:**
${JSON.stringify(resumeData.languages || [], null, 2)}

Please generate a professional, well-formatted resume in markdown. Make sure to:
1. Use proper formatting with headers and bullet points
2. Emphasize achievements and leadership
3. Use strong action verbs
4. Keep it concise and impactful`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
        return new Response(JSON.stringify({ error: "AI服务额度不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedResume = data.choices?.[0]?.message?.content;

    if (!generatedResume) {
      throw new Error("Failed to generate resume content");
    }

    return new Response(JSON.stringify({ resume: generatedResume }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating resume:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "生成简历时发生错误" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
