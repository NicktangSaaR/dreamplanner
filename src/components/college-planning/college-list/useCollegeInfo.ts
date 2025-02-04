
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
} | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-college-info', {
      body: { collegeName }
    });

    if (error) {
      console.error('Error invoking get-college-info function:', error);
      return null;
    }

    if (!data) {
      console.log('No data returned from get-college-info function');
      return null;
    }

    console.log('Parsed college info:', data);
    
    return {
      avg_gpa: typeof data.avg_gpa === 'number' ? data.avg_gpa : undefined,
      avg_sat: typeof data.avg_sat === 'number' ? data.avg_sat : undefined,
      avg_act: typeof data.avg_act === 'number' ? data.avg_act : undefined,
      sat_75th: typeof data.sat_75th === 'number' ? data.sat_75th : undefined,
      act_75th: typeof data.act_75th === 'number' ? data.act_75th : undefined,
      institution_type: data.institution_type === 'Public' || data.institution_type === 'Private' 
        ? data.institution_type 
        : undefined,
      state: typeof data.state === 'string' ? data.state : undefined,
      website_url: typeof data.website_url === 'string' ? data.website_url : undefined,
      city: typeof data.city === 'string' ? data.city : undefined,
      test_optional: typeof data.test_optional === 'boolean' ? data.test_optional : undefined,
    };
  } catch (error) {
    console.error('Error getting college info:', error);
    return null;
  }
}
