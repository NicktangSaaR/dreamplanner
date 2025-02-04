
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
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helper that returns college information in JSON format. First determine if the college is in the US. If it is in the US, provide the GPA on a 4.0 scale (e.g. 3.8). If it's not in the US, provide the GPA on a 100-point scale (e.g. 93.5).
              
              For academic metrics, provide ONLY the average/mean values, not ranges or minimum/maximum scores. Include these fields:
              - avg_gpa (average GPA as number - use 4.0 scale for US colleges, 100-point scale for non-US)
              - avg_sat (average SAT score as number 0-1600)
              - avg_act (average ACT score as number 0-36)
              - institution_type ("Public" or "Private")
              - state (US state name or null if not in US)
              - website_url (string)
              - city (string)
              
              Return ONLY valid JSON, no other text.`
            },
            {
              role: 'user',
              content: `What are the average (mean) GPA, SAT, and ACT scores, institution type (public/private), state, official website URL, and city for ${collegeName}? Please provide only average/mean values for GPA, SAT, and ACT scores.`
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
    console.log("OpenAI response:", data);
    
    return new Response(
      JSON.stringify(data),
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

