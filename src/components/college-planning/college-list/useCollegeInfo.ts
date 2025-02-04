
import { supabase } from "@/integrations/supabase/client";

export async function getCollegeInfo(collegeName: string): Promise<{
  avg_gpa?: number;
  avg_sat?: number;
  avg_act?: number;
  sat_75th?: number;
  act_75th?: number;
  institution_type?: 'Public' | 'Private';
  state?: string;
  website_url?: string;
  city?: string;
  test_optional?: boolean;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('get-college-info', {
      body: { collegeName }
    });

    if (error) {
      console.error('Error invoking get-college-info function:', error);
      return {};
    }

    const collegeInfo = data;
    console.log('Parsed college info:', collegeInfo);
    
    return {
      avg_gpa: typeof collegeInfo.avg_gpa === 'number' ? collegeInfo.avg_gpa : undefined,
      avg_sat: typeof collegeInfo.avg_sat === 'number' ? collegeInfo.avg_sat : undefined,
      avg_act: typeof collegeInfo.avg_act === 'number' ? collegeInfo.avg_act : undefined,
      sat_75th: typeof collegeInfo.sat_75th === 'number' ? collegeInfo.sat_75th : undefined,
      act_75th: typeof collegeInfo.act_75th === 'number' ? collegeInfo.act_75th : undefined,
      institution_type: collegeInfo.institution_type === 'Public' || collegeInfo.institution_type === 'Private' 
        ? collegeInfo.institution_type 
        : undefined,
      state: typeof collegeInfo.state === 'string' ? collegeInfo.state : undefined,
      website_url: typeof collegeInfo.website_url === 'string' ? collegeInfo.website_url : undefined,
      city: typeof collegeInfo.city === 'string' ? collegeInfo.city : undefined,
      test_optional: typeof collegeInfo.test_optional === 'boolean' ? collegeInfo.test_optional : undefined,
    };
  } catch (error) {
    console.error('Error getting college info:', error);
    return {};
  }
}
