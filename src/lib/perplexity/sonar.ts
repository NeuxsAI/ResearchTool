interface SonarSearchParams {
  query: string;
  dateRange?: string;
  impact?: string;
  topics?: string[];
  page?: number;
  limit?: number;
}

interface SonarPaper {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  year: number;
  citations: number;
  institution?: string;
  impact: "high" | "low";
  url: string;
  topics: string[];
}

interface SonarSearchResponse {
  papers: SonarPaper[];
  total: number;
}

export async function searchPapers({
  query,
  dateRange = "all-time",
  impact = "any-impact",
  topics = [],
  page = 1,
  limit = 25
}: SonarSearchParams): Promise<SonarSearchResponse> {
  const SONAR_API_KEY = process.env.PERPLEXITY_SONAR_API_KEY;
  
  if (!SONAR_API_KEY) {
    throw new Error("Perplexity Sonar API key is not configured");
  }

  const systemPrompt = `You are a research paper search API. Return ONLY a JSON array of papers matching the query. Each paper should be a JSON object with these fields:
- id (string): a unique identifier
- title (string): the paper's title
- abstract (string, optional): a brief summary
- authors (string[]): list of authors
- year (number): publication year
- citations (number): citation count
- institution (string, optional): primary institution
- impact ("high" | "low"): paper's impact level
- url (string): link to the paper
- topics (string[]): relevant topics

Apply these filters:
- Date range: ${dateRange}
- Impact level: ${impact}
- Topics: ${topics.join(", ")}

Your response must be ONLY the JSON array, nothing else. Try to fetch at least 3 papers, you can fetch more if you can (that's preferable) however no more than 25 and please rank by relevance to the query.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SONAR_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent output
        top_p: 0.9,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to search papers");
    }

    const data = await response.json();
    
    try {
      // Log the response for debugging
      console.log("API Response content:", data.choices[0].message.content);
      
      // Clean up the response content - remove markdown code block syntax
      let content = data.choices[0].message.content;
      content = content.replace(/```json\n/, '').replace(/```\n?$/, '');
      
      // Parse the content as JSON - it should be an array of papers
      const papers = JSON.parse(content);
      
      if (!Array.isArray(papers)) {
        throw new Error("Response is not an array");
      }
      
      // Filter out any "No additional papers found" entries
      const validPapers = papers.filter(paper => 
        paper.title && paper.title !== "No additional papers found" && paper.impact !== null
      );
      
      return {
        papers: validPapers,
        total: validPapers.length
      };
    } catch (parseError) {
      console.error("Failed to parse papers from response:", parseError);
      throw new Error("Invalid response format from search API");
    }
  } catch (error) {
    console.error("Perplexity Sonar API error:", error);
    throw error;
  }
} 