interface Paper {
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

interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sortBy?: "relevance" | "lastUpdatedDate" | "submittedDate";
  sortOrder?: "ascending" | "descending";
}

interface SearchResponse {
  papers: Paper[];
  total: number;
}

const DATA_ENGINE_URL = process.env.NEXT_PUBLIC_DATA_ENGINE_URL || 'http://localhost:8080';

export async function searchPapers({
  query,
  page = 1,
  limit = 25,
  sortBy = "relevance",
  sortOrder = "descending"
}: SearchParams): Promise<SearchResponse> {
  const start = (page - 1) * limit;
  const params = new URLSearchParams({
    query,
    start: start.toString(),
    max_results: limit.toString(),
    sort_by: sortBy,
    sort_order: sortOrder
  });

  const response = await fetch(
    `${DATA_ENGINE_URL}/api/arxiv/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to search papers: ${response.statusText}`);
  }

  const papers = await response.json();
  return {
    papers,
    total: papers.length
  };
}

export async function getRecommendedPapers(limit: number = 10): Promise<SearchResponse> {
  const params = new URLSearchParams({
    max_results: limit.toString()
  });

  const response = await fetch(
    `${DATA_ENGINE_URL}/api/papers/recommended?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to get recommended papers: ${response.statusText}`);
  }

  const papers = await response.json();
  return {
    papers,
    total: papers.length
  };
}

export async function getTrendingPapers(limit: number = 10): Promise<SearchResponse> {
  const params = new URLSearchParams({
    max_results: limit.toString()
  });

  const response = await fetch(
    `${DATA_ENGINE_URL}/api/papers/trending?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to get trending papers: ${response.statusText}`);
  }

  const papers = await response.json();
  return {
    papers,
    total: papers.length
  };
} 