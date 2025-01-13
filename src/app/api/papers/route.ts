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
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get the token
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
    const authors = JSON.parse(formData.get('authors') as string) as string[];
    const year = parseInt(formData.get('year') as string);
    const abstract = formData.get('abstract') as string;
    const categoryId = formData.get('categoryId') as string;

    console.log('Form data received:', {
      hasFile: !!file,
      url,
      title,
      authors,
      year,
      hasAbstract: !!abstract,
      categoryId
    });

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
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
        throw new Error('Failed to upload PDF');
      }
    } else if (url) {
      // Validate URL
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

    console.log('Creating paper record with URL:', pdfUrl);

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
      throw new Error('Failed to save paper to database');
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