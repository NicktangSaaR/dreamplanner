
export async function getCollegeInfo(collegeName: string): Promise<{
  avg_gpa?: number;
  avg_sat?: number;
  avg_act?: number;
  institution_type?: 'Public' | 'Private';
  state?: string;
}> {
  try {
    const response = await fetch(
      `https://api.perplexity.ai/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a helper that returns college information in JSON format. Include only these fields: avg_gpa (number 0-5), avg_sat (number 0-1600), avg_act (number 0-36), institution_type ("Public" or "Private"), state (US state name). Return ONLY valid JSON, no other text.'
            },
            {
              role: 'user',
              content: `What are the average GPA, SAT, ACT scores, institution type (public/private), and state for ${collegeName}?`
            }
          ],
          max_tokens: 200,
        })
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
