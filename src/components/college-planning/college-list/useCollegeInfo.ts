
import { supabase } from "@/integrations/supabase/client";

export async function getCollegeInfo(collegeName: string): Promise<{
  avg_gpa?: number;
  avg_sat?: number;
  avg_act?: number;
  institution_type?: 'Public' | 'Private';
  state?: string;
  website_url?: string;
  city?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('get-college-info', {
      body: { collegeName }
    });

    if (error) {
      console.error('Error invoking get-college-info function:', error);
      return {};
    }

    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid response format from OpenAI:', data);
      return {};
    }

    const collegeInfo = JSON.parse(data.choices[0].message.content);
    console.log('Parsed college info:', collegeInfo);
    
    return {
      avg_gpa: typeof collegeInfo.avg_gpa === 'number' ? collegeInfo.avg_gpa : undefined,
      avg_sat: typeof collegeInfo.avg_sat === 'number' ? collegeInfo.avg_sat : undefined,
      avg_act: typeof collegeInfo.avg_act === 'number' ? collegeInfo.avg_act : undefined,
      institution_type: collegeInfo.institution_type === 'Public' || collegeInfo.institution_type === 'Private' 
        ? collegeInfo.institution_type 
        : undefined,
      state: typeof collegeInfo.state === 'string' ? collegeInfo.state : undefined,
      website_url: typeof collegeInfo.website_url === 'string' ? collegeInfo.website_url : undefined,
      city: typeof collegeInfo.city === 'string' ? collegeInfo.city : undefined,
    };
  } catch (error) {
    console.error('Error getting college info:', error);
    return {};
  }
}
