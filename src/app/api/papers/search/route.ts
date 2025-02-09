import { NextResponse } from "next/server";
import { storeDiscoveredPapers } from "@/lib/supabase/db";
import { downloadAndUploadPDF } from "@/lib/supabase/storage";
import { Paper } from "@/types/paper";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

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
    
    // Store in Supabase with UUID and download PDFs
    const papersToStore = await Promise.all(papers.map(async paper => {
      const newId = crypto.randomUUID();
      
      // Download and store PDF in Supabase
      let supabaseUrl;
      try {
        supabaseUrl = await downloadAndUploadPDF(paper.url, user.id, newId);
      } catch (error) {
        console.error('Failed to download/upload PDF:', error);
        supabaseUrl = paper.url; // Fallback to original URL if download fails
      }

      return {
        ...paper,
        id: newId,
        arxiv_id: paper.id,
        url: supabaseUrl,
        source: 'search',
        created_at: new Date().toISOString(),
        metadata: { 
          institution: paper.institution,
          query: query,
          original_url: paper.url // Store original URL in metadata
        }
      };
    }));

    const { error: storeError } = await storeDiscoveredPapers(papersToStore);
    if (storeError) {
      console.error('Failed to store papers:', storeError);
    }

    // Index papers in RAG using UUID and proxy URL
    console.log('Starting RAG indexing for papers:', papersToStore.map(p => ({ id: p.id })));
    
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
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