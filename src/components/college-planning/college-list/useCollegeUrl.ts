export async function getCollegeUrl(collegeName: string): Promise<string> {
  try {
    const searchQuery = `${collegeName} official website`;
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
              content: 'You are a helper that only returns the official website URL of universities. Return only the URL, nothing else.'
            },
            {
              role: 'user',
              content: searchQuery
            }
          ],
          max_tokens: 100,
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch college URL:', await response.text());
      return `https://www.${collegeName.toLowerCase().replace(/ /g, '')}.edu`;
    }

    const data = await response.json();
    const url = data.choices[0].message.content.trim();
    
    try {
      new URL(url);
      return url;
    } catch {
      return `https://www.${collegeName.toLowerCase().replace(/ /g, '')}.edu`;
    }
  } catch (error) {
    console.error('Error getting college URL:', error);
    return `https://www.${collegeName.toLowerCase().replace(/ /g, '')}.edu`;
  }
}