import { getRecommendedPapers } from "@/lib/perplexity/sonar";
import { storeDiscoveredPapers } from "@/lib/supabase/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const results = await getRecommendedPapers();
    if (!results.papers?.length) {
      throw new Error('No papers returned from search');
    }

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
      source: 'recommendations',
      created_at: new Date().toISOString(),
      metadata: { institution: paper.institution }
    }));

    const { error: storeError } = await storeDiscoveredPapers(papers);
    if (storeError) {
      console.error('Failed to store papers:', storeError);
    }

    return NextResponse.json({ papers });
  } catch (error) {
    console.error('Error in discover papers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 