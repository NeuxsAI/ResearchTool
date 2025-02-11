import { NextResponse } from "next/server";
import { Paper } from "@/types/paper";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { cache, CACHE_KEYS } from '@/lib/cache';

const DATA_ENGINE_URL = process.env.NEXT_PUBLIC_DATA_ENGINE_URL || 'http://localhost:8080';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const refresh = searchParams.get("refresh") === "true";

    // Check cache first if not refreshing
    if (!refresh) {
      const { data: cachedPapers } = await supabase
        .from('discovered_papers')
        .select('*')
        .eq('user_id', user.id)
        .eq('source', 'trending')
        .order('discovered_at', { ascending: false })
        .limit(limit);

      if (cachedPapers && cachedPapers.length > 0) {
        return NextResponse.json({ papers: cachedPapers, total: cachedPapers.length });
      }
    }

    const params = new URLSearchParams({
      max_results: limit.toString(),
      refresh: refresh.toString()
    });

    console.log('Fetching trending papers from:', `${DATA_ENGINE_URL}/api/papers/trending?${params.toString()}`);
    const response = await fetch(
      `${DATA_ENGINE_URL}/api/papers/trending?${params.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DataEngine error:', errorText);
      throw new Error(`Failed to fetch from DataEngine: ${response.status} ${response.statusText}`);
    }

    const papers = await response.json() as Paper[];

    // Store papers in discovered_papers table
    const discoveredPapers = papers.map(paper => ({
      id: crypto.randomUUID(),
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      abstract: paper.abstract || '',
      url: paper.url,
      citations: paper.citations || 0,
      impact: paper.impact || 'low',
      topics: paper.topics || [],
      arxiv_id: paper.id,
      user_id: user.id,
      source: 'trending',
      discovered_at: new Date().toISOString(),
      metadata: {
        institution: paper.institution,
        discovery_type: 'trending'
      }
    }));

    const { error: storeError } = await supabase
      .from('discovered_papers')
      .upsert(discoveredPapers, {
        onConflict: 'arxiv_id,user_id',
        ignoreDuplicates: false
      });

    if (storeError) {
      console.error('Failed to store discovered papers:', storeError);
    }

    return NextResponse.json({ papers: discoveredPapers, total: papers.length });
  } catch (error) {
    console.error("Failed to fetch trending papers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trending papers" },
      { status: 500 }
    );
  }
} 