import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Validate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const authorsStr = formData.get('authors') as string;
    const yearStr = formData.get('year') as string;
    const abstract = formData.get('abstract') as string;
    const url = formData.get('url') as string;
    const citations = formData.get('citations') as string;
    const impact = formData.get('impact') as string;
    const topicsStr = formData.get('topics') as string;

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

    let topics: string[] = [];
    try {
      topics = topicsStr ? JSON.parse(topicsStr) : [];
    } catch (e) {
      console.error('Error parsing topics:', e);
      return NextResponse.json(
        { error: 'Invalid topics format' },
        { status: 400 }
      );
    }

    // Insert into papers table with only the fields that exist
    const { data: paper, error: insertError } = await supabase
      .from('papers')
      .insert({
        title,
        authors,
        year: parseInt(yearStr),
        abstract: abstract || '',
        url: url || '',
        created_at: new Date().toISOString(),
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add paper' },
        { status: 500 }
      );
    }

    return NextResponse.json({ paper });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 