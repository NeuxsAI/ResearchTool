import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getPaperById } from "@/lib/supabase/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response('Not authenticated', { status: 401 });
    }

    // Get the paper details first
    const { data: paper, error: paperError } = await getPaperById(params.id);
    if (paperError || !paper || !paper.url) {
      console.error('Paper error:', paperError);
      return new Response('Paper not found or has no URL', { status: 404 });
    }

    console.log('Paper URL:', paper.url);

    // Check if URL is a Supabase storage URL
    const isSupabaseStorage = paper.url.includes('supabase.co/storage');

    if (isSupabaseStorage) {
      // For Supabase storage URLs, get the path from the URL
      const storageUrl = new URL(paper.url);
      const pathParts = storageUrl.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('papers') + 1).join('/');
      
      console.log('Fetching from storage, path:', filePath);
      
      // Get the file directly from storage
      const { data, error } = await supabase.storage
        .from('papers')
        .download(filePath);

      if (error) {
        console.error('Storage download error:', error);
        return new Response('Failed to fetch PDF from storage', { status: 500 });
      }

      return new Response(data, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${params.id}.pdf"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } else {
      // For external URLs (like arXiv), proxy the request
      console.log('Proxying external URL:', paper.url);
      
      const response = await fetch(paper.url);
      if (!response.ok) {
        console.error('External fetch error:', response.status, response.statusText);
        return new Response('Failed to fetch external PDF', { status: response.status });
      }

      const pdfData = await response.arrayBuffer();
      return new Response(pdfData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${params.id}.pdf"`,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  } catch (error) {
    console.error('Error in PDF endpoint:', error);
    return new Response('Failed to fetch PDF', { status: 500 });
  }
}