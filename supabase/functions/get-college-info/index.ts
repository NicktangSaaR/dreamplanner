
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

IMPORTANT: Return ONLY these exact fields in a JSON object - no other text or fields allowed:
{
  "avg_gpa": number (e.g., 3.8) or null,
  "avg_sat": number (e.g., 1400) or null,
  "avg_act": number (e.g., 32) or null,
  "sat_75th": number (e.g., 1500) or null,
  "act_75th": number (e.g., 35) or null,
  "institution_type": "Public" or "Private",
  "state": string or null,
  "website_url": string,
  "city": string,
  "test_optional": boolean
}

For SAT and ACT scores:
- Use actual admission data for 75th percentile scores
- avg_sat and sat_75th must be between 400 and 1600
- avg_act and act_75th must be between 1 and 36
- avg_gpa must be between 0 and 4.0 for US schools
- Do not omit any fields - use null for unknown values
- Numbers must be numeric values, not strings
- Do not include any explanations or additional text`
            },
            {
              role: 'user',
              content: `Return ONLY a JSON object with the college information for ${collegeName}. No other text.`
            }
          ],
          temperature: 0.3
        })
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw OpenAI response:", data);
    
    const content = data.choices[0].message.content.trim();
    console.log("Content to parse:", content);
    
    try {
      const collegeInfo = JSON.parse(content);
      
      // Validate the response format
      const requiredFields = ['avg_gpa', 'avg_sat', 'avg_act', 'sat_75th', 'act_75th', 
                            'institution_type', 'state', 'website_url', 'city', 'test_optional'];
      const missingFields = requiredFields.filter(field => !(field in collegeInfo));
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error('Invalid response format: missing required fields');
      }

      // Validate numeric ranges
      if (collegeInfo.avg_sat !== null && (collegeInfo.avg_sat < 400 || collegeInfo.avg_sat > 1600)) {
        throw new Error('Invalid SAT score range');
      }
      if (collegeInfo.sat_75th !== null && (collegeInfo.sat_75th < 400 || collegeInfo.sat_75th > 1600)) {
        throw new Error('Invalid SAT 75th percentile score range');
      }
      if (collegeInfo.avg_act !== null && (collegeInfo.avg_act < 1 || collegeInfo.avg_act > 36)) {
        throw new Error('Invalid ACT score range');
      }
      if (collegeInfo.act_75th !== null && (collegeInfo.act_75th < 1 || collegeInfo.act_75th > 36)) {
        throw new Error('Invalid ACT 75th percentile score range');
      }
      if (collegeInfo.avg_gpa !== null && (collegeInfo.avg_gpa < 0 || collegeInfo.avg_gpa > 4.0)) {
        throw new Error('Invalid GPA range');
      }

      return new Response(
        JSON.stringify(collegeInfo),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    } catch (parseError) {
      console.error('Error parsing or validating OpenAI response:', parseError);
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
