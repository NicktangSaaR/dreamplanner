
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a JSON-only response system that provides college information. Return ONLY a valid JSON object with these exact fields - no other text or explanations:

{
  "avg_gpa": number or null,
  "avg_sat": number or null,
  "avg_act": number or null,
  "max_sat": number or null,
  "max_act": number or null,
  "institution_type": "Public" or "Private" or null,
  "state": string or null,
  "website_url": string or null,
  "city": string or null,
  "test_optional": boolean or null,
  "country": string,
  "gpa_scale_type": "US_4.0" or "100_POINT"
}

Rules:
- Use 4.0 scale for US colleges (gpa_scale_type: "US_4.0")
- Use 100 point scale for non-US colleges (gpa_scale_type: "100_POINT")
- SAT scores must be between 400-1600
- ACT scores must be between 1-36
- Return null for unknown values
- All numbers must be numeric values, not strings
- Country must always be provided
- For US colleges, state must be a US state name
- For non-US colleges, state can represent a province, region, or state`
            },
            {
              role: 'user',
              content: `Return college information for ${collegeName} as a JSON object. No other text.`
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
    console.log("OpenAI raw response:", data);
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }
    
    const content = data.choices[0].message.content.trim();
    console.log("Content to parse:", content);
    
    try {
      const collegeInfo = JSON.parse(content);
      
      // Validate the response format
      const requiredFields = ['avg_gpa', 'avg_sat', 'avg_act', 'max_sat', 'max_act', 
                            'institution_type', 'state', 'website_url', 'city', 'test_optional',
                            'country', 'gpa_scale_type'];
      
      for (const field of requiredFields) {
        if (!(field in collegeInfo)) {
          console.error(`Missing required field: ${field}`);
          collegeInfo[field] = null;
        }
      }

      // Set defaults for required fields
      if (!collegeInfo.country) {
        collegeInfo.country = 'United States';
      }
      if (!collegeInfo.gpa_scale_type) {
        collegeInfo.gpa_scale_type = collegeInfo.country === 'United States' ? 'US_4.0' : '100_POINT';
      }

      // Validate numeric ranges based on GPA scale type
      const validateGPA = (value: number | null, scaleType: string) => {
        if (value === null) return null;
        if (scaleType === 'US_4.0' && (value < 0 || value > 4.0)) {
          console.warn(`Invalid US GPA value ${value}, setting to null`);
          return null;
        }
        if (scaleType === '100_POINT' && (value < 0 || value > 100)) {
          console.warn(`Invalid 100-point GPA value ${value}, setting to null`);
          return null;
        }
        return value;
      };

      const validateRange = (value: number | null, min: number, max: number, fieldName: string) => {
        if (value !== null && (value < min || value > max)) {
          console.warn(`Invalid ${fieldName} value ${value}, setting to null`);
          return null;
        }
        return value;
      };

      collegeInfo.avg_gpa = validateGPA(collegeInfo.avg_gpa, collegeInfo.gpa_scale_type);
      collegeInfo.avg_sat = validateRange(collegeInfo.avg_sat, 400, 1600, 'SAT');
      collegeInfo.max_sat = validateRange(collegeInfo.max_sat, 400, 1600, 'Max SAT');
      collegeInfo.avg_act = validateRange(collegeInfo.avg_act, 1, 36, 'ACT');
      collegeInfo.max_act = validateRange(collegeInfo.max_act, 1, 36, 'Max ACT');

      // Ensure institution_type is valid
      if (collegeInfo.institution_type && !['Public', 'Private'].includes(collegeInfo.institution_type)) {
        collegeInfo.institution_type = null;
      }

      // Ensure test_optional is boolean
      if (typeof collegeInfo.test_optional !== 'boolean') {
        collegeInfo.test_optional = null;
      }

      return new Response(
        JSON.stringify(collegeInfo),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw content that failed to parse:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
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
