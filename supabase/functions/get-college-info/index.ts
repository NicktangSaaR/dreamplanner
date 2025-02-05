
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

    const openAIRequestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only response system that provides college information. Return ONLY a valid JSON object with these exact fields - no other text or explanations:\n\n{\n  "avg_gpa": number or null,\n  "avg_sat": number or null,\n  "avg_act": number or null,\n  "max_sat": number or null,\n  "max_act": number or null,\n  "institution_type": "Public" or "Private" or null,\n  "state": string or null,\n  "website_url": string or null,\n  "city": string or null,\n  "test_optional": boolean or null,\n  "country": string,\n  "gpa_scale_type": "US_4.0" or "100_POINT"\n}\n\nRules:\n- For US colleges, use 4.0 scale (gpa_scale_type: "US_4.0")\n- For non-US colleges:\n  - Use 100 point scale (gpa_scale_type: "100_POINT")\n  - For UK universities, avg_gpa represents the typical entry requirement on a 100-point scale\n  - For Canadian universities, avg_gpa represents the minimum admission average percentage\n  - For Australian universities, avg_gpa represents the minimum ATAR score (out of 100)\n  - For other countries, convert the local grading scale to a 100-point scale\n- SAT/ACT scores must be included if the university accepts them from international students\n- Return null for unknown values\n- All numbers must be numeric values, not strings\n- Country must always be provided\n- For US colleges, state must be a US state name\n- For non-US colleges, state can represent a province, region, or state'
        },
        {
          role: 'user',
          content: `Return college information for ${collegeName} as a JSON object. No other text.`
        }
      ],
      temperature: 0.3,
    };

    console.log("OpenAI request body:", JSON.stringify(openAIRequestBody, null, 2));

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIRequestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status}`, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI raw response:", JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response structure from OpenAI:', data);
      throw new Error('Invalid response structure from OpenAI');
    }
    
    const content = data.choices[0].message.content.trim();
    console.log("Content to parse:", content);
    
    let parsedContent;
    try {
      // First try to remove any potential markdown code block markers
      const cleanContent = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw content that failed to parse:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
      
    // Validate the response format
    const requiredFields = ['avg_gpa', 'avg_sat', 'avg_act', 'max_sat', 'max_act', 
                          'institution_type', 'state', 'website_url', 'city', 'test_optional',
                          'country', 'gpa_scale_type'];
    
    for (const field of requiredFields) {
      if (!(field in parsedContent)) {
        console.error(`Missing required field: ${field}`);
        parsedContent[field] = null;
      }
    }

    // Set defaults for required fields
    if (!parsedContent.country) {
      parsedContent.country = 'United States';
    }
    if (!parsedContent.gpa_scale_type) {
      parsedContent.gpa_scale_type = parsedContent.country === 'United States' ? 'US_4.0' : '100_POINT';
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

    parsedContent.avg_gpa = validateGPA(parsedContent.avg_gpa, parsedContent.gpa_scale_type);
    parsedContent.avg_sat = validateRange(parsedContent.avg_sat, 400, 1600, 'SAT');
    parsedContent.max_sat = validateRange(parsedContent.max_sat, 400, 1600, 'Max SAT');
    parsedContent.avg_act = validateRange(parsedContent.avg_act, 1, 36, 'ACT');
    parsedContent.max_act = validateRange(parsedContent.max_act, 1, 36, 'Max ACT');

    // Ensure institution_type is valid
    if (parsedContent.institution_type && !['Public', 'Private'].includes(parsedContent.institution_type)) {
      parsedContent.institution_type = null;
    }

    // Ensure test_optional is boolean
    if (typeof parsedContent.test_optional !== 'boolean') {
      parsedContent.test_optional = null;
    }

    return new Response(
      JSON.stringify(parsedContent),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
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
