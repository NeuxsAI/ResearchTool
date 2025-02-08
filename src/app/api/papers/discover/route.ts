import { NextResponse } from "next/server";
import { storeDiscoveredPapers } from "@/lib/supabase/db";
import { Paper } from "@/types/paper";
import crypto from "crypto";

const DATA_ENGINE_URL = process.env.NEXT_PUBLIC_DATA_ENGINE_URL || 'http://localhost:8080';

async function indexPaperInRAG(paperId: string, pdfUrl: string) {
  try {
    const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_RAG_API_URL}/papers/${paperId}/index-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdf_url: pdfUrl
      })
    });

    if (!ragResponse.ok) {
      const error = await ragResponse.text();
      console.error('Failed to index paper in RAG service:', error);
    }
  } catch (ragError) {
    console.error('Error indexing paper in RAG:', ragError);
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

    console.log('Fetching recommended papers from:', `${DATA_ENGINE_URL}/api/papers/recommended?${params.toString()}`);
    const response = await fetch(
      `${DATA_ENGINE_URL}/api/papers/recommended?${params.toString()}`
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
      source: 'recommendations',
      created_at: new Date().toISOString(),
      metadata: { 
        institution: paper.institution,
        discovery_type: 'recommended'
      }
    }));

    const { error: storeError } = await storeDiscoveredPapers(papersToStore);
    if (storeError) {
      console.error('Failed to store papers:', storeError);
    }

    // Index papers in RAG using UUID and proxy URL
    console.log('Starting RAG indexing for papers:', papersToStore.map(p => ({ id: p.id })));
    console.log('RAG API URL:', process.env.NEXT_PUBLIC_RAG_API_URL);

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    await Promise.all(
      papersToStore.map(paper => 
        indexPaperInRAG(paper.id, `${origin}/api/papers/${paper.id}/pdf`)
      )
    );

    return NextResponse.json({ papers: papersToStore, total: papers.length });
  } catch (error) {
    console.error("Failed to fetch recommended papers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch recommended papers" },
      { status: 500 }
    );
  }
} 