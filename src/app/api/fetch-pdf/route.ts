import { NextRequest, NextResponse } from "next/server";

// These exports configure the route handler
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Convert arxiv abstract URL to PDF URL
    if (url.includes('arxiv.org/abs/')) {
      const arxivId = url.split('/').pop();
      url = `https://arxiv.org/pdf/${arxivId}.pdf`;
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

    // Fetch the PDF with appropriate headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      return NextResponse.json({ 
        error: 'URL does not point to a valid PDF file' 
      }, { status: 400 });
    }

    // Get the PDF content
    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF' },
      { status: 500 }
    );
  }
}