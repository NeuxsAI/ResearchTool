import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadPDF } from '@/lib/supabase/storage';
import { createPaper } from '@/lib/supabase/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get the token and create Supabase client with it
    const token = authHeader.split(' ')[1];
    const supabase = createClient(token);
    
    // Validate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const title = formData.get('title') as string;
    const authorsStr = formData.get('authors') as string;
    const yearStr = formData.get('year') as string;
    const abstract = formData.get('abstract') as string;
    const categoryId = formData.get('categoryId') as string;
    const arxivId = formData.get('arxiv_id') as string;

    // Parse and validate the data
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let authors: string[] = [];
    try {
      authors = JSON.parse(authorsStr);
    } catch (e) {
      console.error('Error parsing authors:', e);
      return NextResponse.json(
        { error: 'Invalid authors format' },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    // Create the paper
    const paperData = {
      title,
      authors,
      year,
      abstract: abstract || '',
      url: url || '',
      category_id: categoryId || null,
      arxiv_id: arxivId || null,
      user_id: user.id
    };

    const { data: paper, error: paperError } = await createPaper(paperData, token);
    
    if (paperError) {
      console.error('Error creating paper:', paperError);
      return NextResponse.json(
        { error: `Failed to save paper to database: ${paperError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ paper });
  } catch (error) {
    console.error('Error in POST /api/papers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create paper' },
      { status: 500 }
    );
  }
} 