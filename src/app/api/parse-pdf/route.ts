import { NextRequest } from 'next/server';
import pdfParse from 'pdf-parse';

// These exports configure the route handler
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This is the actual route handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: 'No valid PDF file provided' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    try {
      const data = await pdfParse(buffer);
      return new Response(
        JSON.stringify({ text: data.text }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (parseError: unknown) {
      return new Response(
        JSON.stringify({ 
          error: parseError instanceof Error ? parseError.message : 'Failed to parse PDF content' 
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process request' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 