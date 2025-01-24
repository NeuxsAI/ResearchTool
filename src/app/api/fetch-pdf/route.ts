import { NextRequest, NextResponse } from "next/server";

// These exports configure the route handler
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  // Validate that URL points to a PDF
  // {TODO: Figure out if this is even needed tbh}
    //   const validDomains = [
    //     'arxiv.org',
    //     'researchgate.net',
    //     'semanticscholar.org',
    //     'acm.org',
    //     'ieee.org',
    //     'springer.com',
    //     'sciencedirect.com'
    //   ];

  const urlObj = new URL(url);
    //const isDomainValid = validDomains.some(domain => urlObj.hostname.includes(domain));

    //   if (!isPDF) {
    //     return NextResponse.json({ 
    //       error: 'URL must be from a trusted academic source or directly link to a PDF' 
    //     }, { status: 400 });
    //   }

  try {
    // Fetch with appropriate headers
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/pdf',
        'User-Agent': 'Mozilla/5.0 (compatible; ResearchAssistant/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      return NextResponse.json({ 
        error: 'URL does not point to a valid PDF file' 
      }, { status: 400 });
    }

    const pdfBuffer = await response.arrayBuffer();
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=paper.pdf`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch PDF' 
    }, { status: 500 });
  }
}