import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: paper, error } = await supabase
      .from('papers')
      .select()
      .eq('id', params.id)
      .single();
    
    if (error || !paper) {
      console.error('Error or no paper:', { error, paper });
      throw new Error(`Failed to find paper: ${error?.message || 'Paper not found'}`);
    }

    console.log('Found paper:', paper);
    if (!paper.url) {
      console.error('Paper has no URL');
      throw new Error('Paper does not have a URL');
    }

    console.log('Fetching PDF from URL:', paper.url);
    const response = await fetch(paper.url);

    if (!response.ok) {
      console.error('PDF fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    console.log('Got PDF response, converting to buffer');
    const pdfBuffer = await response.arrayBuffer();
    
    console.log('Sending PDF response');
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="paper.pdf"`,
      },
    });
  } catch (error) {
    console.error("Detailed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch PDF" },
      { status: 500 }
    );
  }
}