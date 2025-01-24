import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadPDF } from '@/lib/supabase/storage';
import { createPaper } from '@/lib/supabase/db';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get auth token from request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get the token and validate user
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
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

    // Parse and validate the data
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let authors: string[];
    try {
      authors = JSON.parse(authorsStr);
      if (!Array.isArray(authors)) {
        throw new Error('Authors must be an array');
      }
    } catch (error) {
      console.error('Error parsing authors:', error);
      return NextResponse.json(
        { error: 'Invalid authors format' },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return NextResponse.json(
        { error: 'Invalid year format' },
        { status: 400 }
      );
    }

    if (!file && !url) {
      return NextResponse.json(
        { error: 'Either a file or URL is required' },
        { status: 400 }
      );
    }

    // Get the PDF URL - either from file upload or direct URL
    let pdfUrl: string;
    if (file) {
      console.log('Uploading file:', file.name, file.size);
      try {
        pdfUrl = await uploadPDF(file, user.id, token);
        console.log('File uploaded successfully:', pdfUrl);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload PDF: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error') },
          { status: 500 }
        );
      }
    } else if (url) {
      try {
        new URL(url);
        pdfUrl = url;
        console.log('Using provided URL:', url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No PDF source provided' },
        { status: 400 }
      );
    }

    // Create paper record in database
    const { data: paper, error: dbError } = await createPaper({
      title,
      authors,
      year,
      abstract,
      category_id: categoryId,
      user_id: user.id,
      url: pdfUrl,
    }, token);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save paper to database: ' + dbError.message },
        { status: 500 }
      );
    }

    if (!paper) {
      console.error('No paper data returned from database');
      return NextResponse.json(
        { error: 'Failed to create paper: No data returned' },
        { status: 500 }
      );
    }

    console.log('Paper created successfully:', paper);
    return NextResponse.json({ paper });
  } catch (error) {
    console.error('Error creating paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create paper' },
      { status: 500 }
    );
  }
} 