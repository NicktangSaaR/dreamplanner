import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, type = 'generate' } = await req.json();
    
    if (!keywords?.trim()) {
      return new Response(
        JSON.stringify({ error: '请输入关键词' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI服务未配置" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'generate') {
      systemPrompt = `你是一位资深留学顾问，擅长撰写学生录取案例。请根据用户提供的关键词，生成一个完整的学生录取案例。
要求：
1. 学生画像(profile_style)：80-120字，生动描述学生的整体形象、性格特点和核心竞争力
2. 学术背景(academic_background)：150-200字，专业描述学生的学术成就、研究经历和学业表现
3. 课外活动(activities)：4-6个活动，每个活动简洁描述角色和成就
4. 相关课程/项目(courses)：3-5个课程或项目

请用中文回复，确保内容真实可信、专业有深度。`;

      userPrompt = `请根据以下关键词生成一个学生录取案例：${keywords}

请严格按照以下JSON格式返回：
{
  "profile_style": "学生画像描述",
  "academic_background": "学术背景描述",
  "activities": ["活动1", "活动2", "活动3", "活动4"],
  "courses": ["课程1", "课程2", "课程3"]
}`;
    } else if (type === 'polish') {
      systemPrompt = `你是一位专业的留学文案编辑，擅长润色和优化学生申请材料。请优化用户提供的文本，使其更加专业、生动、有说服力。保持中文，不要改变原意。`;
      userPrompt = `请润色以下文本，使其更加专业和有吸引力：\n\n${keywords}`;
    }

    console.log(`Processing ${type} request with keywords: ${keywords.substring(0, 50)}...`);

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI服务额度不足" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI未返回有效内容" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'generate') {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Failed to parse JSON from response:", content);
        return new Response(
          JSON.stringify({ error: "AI返回格式错误，请重试" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("Successfully generated case data");
        return new Response(
          JSON.stringify({ success: true, data: parsed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return new Response(
          JSON.stringify({ error: "AI返回格式错误，请重试" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ success: true, data: { text: content } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error("Error in generate-admission-case:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "服务器错误" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
