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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, page = 1, limit = 25 } = body;
    
    const start = (page - 1) * limit;
    const params = new URLSearchParams({
      query,
      start: start.toString(),
      max_results: limit.toString(),
      sort_by: "relevance",
      sort_order: "descending"
    });

    const response = await fetch(
      `${DATA_ENGINE_URL}/api/arxiv/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from DataEngine");
    }

    const papers = await response.json() as Paper[];
    
    // Store in Supabase with UUID
    const papersToStore = papers.map(paper => ({
      ...paper,
      id: crypto.randomUUID(), // Generate UUID instead of using ArXiv ID
      arxiv_id: paper.id, // Store original ArXiv ID
      source: 'search',
      created_at: new Date().toISOString(),
      metadata: { 
        institution: paper.institution,
        query: query 
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
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search papers" },
      { status: 500 }
    );
  }
} 