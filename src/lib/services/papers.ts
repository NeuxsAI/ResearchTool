import { Paper } from "@/types/paper";

interface SearchResponse {
  papers: Paper[];
  total: number;
}

export async function searchPapers(
  query: string,
  page: number = 1,
  limit: number = 25
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await fetch(`/api/papers/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to search papers");
  }

  return response.json();
}

export async function getTrendingPapers(limit: number = 10): Promise<SearchResponse> {
  const response = await fetch(`/api/papers/trending?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch trending papers");
  }

  return response.json();
}

export async function getRecommendedPapers(limit: number = 10): Promise<SearchResponse> {
  const response = await fetch(`/api/papers/discover?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recommended papers");
  }

  return response.json();
} 