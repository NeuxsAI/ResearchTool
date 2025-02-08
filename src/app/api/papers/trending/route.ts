import { NextResponse } from "next/server";
import { storeDiscoveredPapers } from "@/lib/supabase/db";
import { Paper } from "@/types/paper";
import crypto from "crypto";

const DATA_ENGINE_URL = process.env.NEXT_PUBLIC_DATA_ENGINE_URL || 'http://localhost:8080';

async function indexPaperInRAG(paperId: string, pdfUrl: string) {
  try {
    const response = await fetch(`/api/rag/index-paper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paper_id: paperId,
        pdf_url: pdfUrl
      })
    });

    if (!response.ok) {
      throw new Error('Failed to index paper in RAG');
    }

    return await response.json();
  } catch (error) {
    console.error('Error indexing paper:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const refresh = searchParams.get("refresh") === "true";

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
    
    // Store in Supabase with UUID
    const papersToStore = papers.map(paper => ({
      ...paper,
      id: crypto.randomUUID(), // Generate UUID instead of using ArXiv ID
      arxiv_id: paper.id, // Store original ArXiv ID
      source: 'trending',
      created_at: new Date().toISOString(),
      metadata: { 
        institution: paper.institution,
        discovery_type: 'trending'
      }
    }));

    const { error: storeError } = await storeDiscoveredPapers(papersToStore);
    if (storeError) {
      console.error('Failed to store papers:', storeError);
    }

    // Index papers in RAG
    await Promise.all(
      papersToStore.map(paper => 
        indexPaperInRAG(paper.id, paper.url)
      )
    );

    return NextResponse.json({ papers: papersToStore, total: papers.length });
  } catch (error) {
    console.error("Failed to fetch trending papers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trending papers" },
      { status: 500 }
    );
  }
} 