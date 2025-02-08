import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { paper_id, pdf_url } = await request.json();

    if (!paper_id || !pdf_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Forward to RAG service
    const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_RAG_API_URL}/papers/${paper_id}/index-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdf_url
      })
    });

    if (!ragResponse.ok) {
      const error = await ragResponse.text();
      console.error('RAG service error:', error);
      throw new Error('Failed to index paper in RAG service');
    }

    const indexingResult = await ragResponse.json();
    return NextResponse.json(indexingResult);
  } catch (error) {
    console.error('Error indexing paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to index paper' },
      { status: 500 }
    );
  }
} 