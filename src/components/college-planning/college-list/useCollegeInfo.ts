
import { supabase } from "@/integrations/supabase/client";

export async function getCollegeInfo(collegeName: string): Promise<{
  avg_gpa?: number;
  avg_sat?: number;
  avg_act?: number;
  max_sat?: number;
  max_act?: number;
  institution_type?: 'Public' | 'Private';
  state?: string;
  website_url?: string;
  city?: string;
  test_optional?: boolean;
} | null> {
  try {
    console.log('Fetching college info for:', collegeName);
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

    console.log('Received college info:', data);
    
    // Process and validate each field
    const processedData = {
      avg_gpa: typeof data.avg_gpa === 'number' ? data.avg_gpa : undefined,
      avg_sat: typeof data.avg_sat === 'number' ? data.avg_sat : undefined,
      avg_act: typeof data.avg_act === 'number' ? data.avg_act : undefined,
      max_sat: typeof data.max_sat === 'number' ? data.max_sat : undefined,
      max_act: typeof data.max_act === 'number' ? data.max_act : undefined,
      institution_type: data.institution_type === 'Public' || data.institution_type === 'Private' 
        ? data.institution_type 
        : undefined,
      state: typeof data.state === 'string' ? data.state : undefined,
      website_url: typeof data.website_url === 'string' ? data.website_url : undefined,
      city: typeof data.city === 'string' ? data.city : undefined,
      test_optional: typeof data.test_optional === 'boolean' ? data.test_optional : undefined,
    };

    console.log('Processed college info:', processedData);
    return processedData;
  } catch (error) {
    console.error('Error getting college info:', error);
    return null;
  }
}
