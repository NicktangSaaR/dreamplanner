
import { supabase } from "@/integrations/supabase/client";

export async function getCollegeInfo(collegeName: string): Promise<{
  avg_gpa?: number;
  avg_sat?: number;
  avg_act?: number;
  institution_type?: 'Public' | 'Private';
  state?: string;
}> {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/get-college-info`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collegeName })
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch college info:', await response.text());
      return {};
    }

    const data = await response.json();
    const collegeInfo = JSON.parse(data.choices[0].message.content);
    
    return {
      avg_gpa: typeof collegeInfo.avg_gpa === 'number' ? collegeInfo.avg_gpa : undefined,
      avg_sat: typeof collegeInfo.avg_sat === 'number' ? collegeInfo.avg_sat : undefined,
      avg_act: typeof collegeInfo.avg_act === 'number' ? collegeInfo.avg_act : undefined,
      institution_type: collegeInfo.institution_type === 'Public' || collegeInfo.institution_type === 'Private' 
        ? collegeInfo.institution_type 
        : undefined,
      state: typeof collegeInfo.state === 'string' ? collegeInfo.state : undefined,
    };
  } catch (error) {
    console.error('Error getting college info:', error);
    return {};
  }
}
