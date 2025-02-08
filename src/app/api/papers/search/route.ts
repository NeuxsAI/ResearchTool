import { NextResponse } from "next/server";
import { searchPapers } from "@/lib/perplexity/sonar";

interface SearchParams {
  query: string;
  dateRange?: string;
  impact?: string;
  topics?: string[];
  page?: number;
  limit?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      query,
      dateRange = "all-time",
      impact = "any-impact",
      topics = [],
      page = 1,
      limit = 10
    }: SearchParams = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const results = await searchPapers({
      query,
      dateRange,
      impact,
      topics,
      page,
      limit
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 