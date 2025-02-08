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

Ensure the URL is valid PDF link. Only return ArXiv papers.

Your response must be ONLY the JSON array, nothing else. At the minimum, return 5 papers, validate and ensure the paper is real.`;

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
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to search papers");
    }

    const data = await response.json();
    console.log("API Response content:", data.choices[0].message.content);
    
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?|\n?```/g, '');
    if (content.includes('[')) {
      content = content.substring(content.indexOf('['));
    }
    if (content.includes(']')) {
      content = content.substring(0, content.lastIndexOf(']') + 1);
    }
    
    const papers = JSON.parse(content);
    
    if (!Array.isArray(papers)) {
      throw new Error("Response is not an array");
    }
    
    // Replace IDs with UUIDs and format for Supabase storage
    const validPapers = papers
      .filter(paper => paper.title && paper.impact !== null)
      .map(paper => ({
        ...paper,
        id: crypto.randomUUID(),
        abstract: paper.abstract || "",
        citations: paper.citations || 0,
        topics: paper.topics || []
      }));
    
    return {
      papers: validPapers,
      total: validPapers.length
    };
  } catch (error) {
    console.error("Perplexity API error:", error);
    throw error;
  }
}

export async function getRecommendedPapers(): Promise<SonarSearchResponse> {
  return searchPapers({
    query: "Return foundational papers in computer science and machine learning",
    impact: "high",
    dateRange: "all-time"
  });
}

export async function searchTrendingPapers(): Promise<SonarSearchResponse> {
  return searchPapers({
    query: "Return trending papers from the last year in computer science and machine learning",
    dateRange: "last-year",
    impact: "high"
  });
} 