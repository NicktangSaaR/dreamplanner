
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { collegeName } = await req.json();
    console.log("Fetching info for college:", collegeName);

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a JSON-only response system that provides college information. You must ONLY return a valid JSON object with no additional text or explanations. For US colleges, use GPA on 4.0 scale; for non-US colleges, use 100-point scale.

Required fields (all must be included):
{
  "avg_gpa": number,
  "avg_sat": number,
  "avg_act": number,
  "gpa_75th": number,
  "sat_75th": number,
  "act_75th": number,
  "institution_type": "Public" or "Private",
  "state": string or null,
  "website_url": string,
  "city": string,
  "test_optional": boolean
}

If ANY value is unknown, use null instead of omitting the field. Numbers must be numeric values, not strings.`
            },
            {
              role: 'user',
              content: `Return ONLY a JSON object with the average and 75th percentile GPA, SAT, and ACT scores, institution type, state, website URL, city, and test-optional status for ${collegeName}.`
            }
          ],
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw OpenAI response:", data);
    
    // Extract the content and ensure it's valid JSON
    const content = data.choices[0].message.content.trim();
    console.log("Content to parse:", content);
    
    try {
      const collegeInfo = JSON.parse(content);
      return new Response(
        JSON.stringify(collegeInfo),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.error('Raw content that failed to parse:', content);
      return new Response(
        JSON.stringify({ error: 'Invalid response format from OpenAI' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }
  } catch (error) {
    console.error('Error in get-college-info function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
