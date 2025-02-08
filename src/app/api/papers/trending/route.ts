import { searchTrendingPapers } from "@/lib/perplexity/sonar";
import { storeDiscoveredPapers } from "@/lib/supabase/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get new trending papers
    const results = await searchTrendingPapers();

    if (!results.papers?.length) {
      throw new Error('No papers returned from search');
    }

    // Store papers with UUIDs and format for UI
    const papers = results.papers.map(paper => ({
      id: crypto.randomUUID(),
      title: paper.title,
      abstract: paper.abstract || "",
      authors: paper.authors,
      year: paper.year,
      citations: paper.citations || 0,
      impact: paper.impact || "low",
      url: paper.url,
      topics: paper.topics || [],
      source: 'trending_search',
      created_at: new Date().toISOString(),
      metadata: { institution: paper.institution }
    }));

    // Store in Supabase
    const { error: storeError } = await storeDiscoveredPapers(papers);
    if (storeError) {
      console.error('Failed to store papers:', storeError);
    }
    
    return NextResponse.json({ papers });
  } catch (error) {
    console.error('Error in trending papers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 