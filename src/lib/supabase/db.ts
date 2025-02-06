import { createClient as createServerClient } from './server'
import { createClient as createBrowserClient } from './client'
import type { Category, Paper, Annotation, Board, BoardItem, ReadingListItem, DbResult, DbArrayResult } from '@/lib/supabase/types'

// Categories
export async function getCategories(): Promise<DbArrayResult<Category>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
}

export async function getCategoryById(id: string): Promise<DbResult<Category>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }
  
  return await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
}

export async function createCategory(category: Partial<Category>): Promise<DbResult<Category>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('categories')
    .insert({ ...category, user_id: user.id })
    .select()
    .single()
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<DbResult<Category>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }
  
  return await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
}

export async function deleteCategory(id: string): Promise<DbResult<Category>> {
  const supabase = createBrowserClient()
  return await supabase.from('categories').delete().eq('id', id).select().single()
}

// Papers
export const getPapers = async (): Promise<DbArrayResult<Paper>> => {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('papers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
}

export async function getPapersByCategory(categoryId: string): Promise<DbArrayResult<Paper>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('papers')
    .select(`
      *,
      annotations:annotations(count)
    `)
    .eq('category_id', categoryId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
}

export async function getPaperById(id: string): Promise<DbResult<Paper>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }
  
  return await supabase
    .from('papers')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
}

// Server-side operations that need token
export async function createPaper(paper: Partial<Paper>, token?: string): Promise<DbResult<Paper>> {
  const supabase = token ? createServerClient(token) : createServerClient();
  
  // Create the paper with the provided user_id
  return await supabase
    .from('papers')
    .insert(paper)
    .select()
    .single();
}

export async function addPaperFromDiscovery(
  paper: {
    title: string;
    authors: string[];
    year: number;
    abstract?: string;
    url: string;
    citations?: number;
    impact?: 'high' | 'low';
    topics?: string[];
  },
  categoryId?: string
): Promise<DbResult<Paper>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create paper with discovery data
  const paperData = {
    ...paper,
    category_id: categoryId,
    user_id: user.id,
    citations: paper.citations ?? 0,
    impact: paper.impact ?? 'low',
    topics: paper.topics ?? [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // First create the paper
  const { data: createdPaper, error: paperError } = await supabase
    .from('papers')
    .insert(paperData)
    .select()
    .single();

  if (paperError) return { data: null, error: paperError };
  if (!createdPaper) return { data: null, error: new Error('Failed to create paper') };

  // Then add it to reading list
  const { error: readingListError } = await supabase
    .from('reading_list')
    .insert({
      paper_id: createdPaper.id,
      user_id: user.id,
      added_at: new Date().toISOString(),
    });

  if (readingListError) {
    console.error('Failed to add paper to reading list:', readingListError);
    // We don't return here since the paper was created successfully
  }

  return { data: createdPaper, error: null };
}

export async function updatePaper(
  id: string, 
  paper: Partial<Paper>, 
  token?: string
): Promise<DbResult<Paper>> {
  const supabase = token ? createServerClient(token) : createBrowserClient();
  const updateData = {
    ...paper,
    updated_at: new Date().toISOString(),
  };
  console.log('Updating paper with ID:', id);
  console.log('Update data:', updateData);
  const result = await supabase.from('papers').update(updateData).eq('id', id).select().single();
  console.log('Update result:', result);
  return result;
}

export async function deletePaper(id: string, token?: string): Promise<DbResult<Paper>> {
  const supabase = createServerClient(token)
  return await supabase.from('papers').delete().eq('id', id).select().single()
}

// Annotations
export async function getAnnotationsByPaper(paperId: string): Promise<DbArrayResult<Annotation>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  console.log("Fetching annotations for paper:", paperId);
  const result = await supabase
    .from('annotations')
    .select('*')
    .eq('paper_id', paperId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  console.log("Annotations result:", result);
  return result;
}

export async function createAnnotation(annotation: Partial<Annotation>): Promise<DbResult<Annotation>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  console.log("Creating annotation with:", {
    ...annotation,
    user_id: user.id
  });
  
  const result = await supabase.from('annotations').insert({
    ...annotation,
    user_id: user.id
  }).select().single();
  
  console.log("Supabase response:", result);
  return result;
}

export async function updateAnnotation(id: string, annotation: Partial<Annotation>): Promise<DbResult<Annotation>> {
  const supabase = createBrowserClient()
  return await supabase.from('annotations').update(annotation).eq('id', id).select().single()
}

export async function deleteAnnotation(id: string): Promise<DbResult<Annotation>> {
  const supabase = createBrowserClient()
  return await supabase.from('annotations').delete().eq('id', id).select().single()
}

// Boards
export const getBoards = async (): Promise<DbArrayResult<Board>> => {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
}

export async function getBoardById(id: string): Promise<DbResult<Board>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }
  
  return await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
}

export async function createBoard(board: Partial<Board>): Promise<DbResult<Board>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('boards')
    .insert({ ...board, user_id: user.id })
    .select()
    .single()
}

export async function updateBoard(id: string, board: Partial<Board>): Promise<DbResult<Board>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('boards')
    .update(board)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
}

export async function deleteBoard(id: string): Promise<DbResult<Board>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('boards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
}

// Board Items
export async function getBoardItems(boardId: string): Promise<DbArrayResult<BoardItem>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('board_items')
    .select('*')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
}

export async function createBoardItem(item: Partial<BoardItem>): Promise<DbResult<BoardItem>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('board_items')
    .insert({ ...item, user_id: user.id })
    .select()
    .single()
}

export async function updateBoardItem(id: string, item: Partial<BoardItem>): Promise<DbResult<BoardItem>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('board_items')
    .update(item)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
}

export async function deleteBoardItem(id: string): Promise<DbResult<BoardItem>> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('board_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
}

// Reading List
export const getReadingList = async (): Promise<DbArrayResult<ReadingListItem>> => {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('reading_list')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
}

export async function addToReadingList(paperId: string, paperData?: Partial<Paper>): Promise<DbResult<ReadingListItem>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };

  // First check if paper exists
  const { data: existingPaper, error: paperCheckError } = await supabase
    .from('papers')
    .select()
    .eq('id', paperId)
    .maybeSingle();

  if (paperCheckError) {
    console.error('Error checking paper:', paperCheckError);
    return { data: null, error: paperCheckError };
  }

  // If paper doesn't exist and we have paper data, create it
  if (!existingPaper && paperData) {
    const { error: createPaperError } = await supabase
      .from('papers')
      .insert({
        id: paperId,
        title: paperData.title,
        authors: paperData.authors,
        year: paperData.year,
        abstract: paperData.abstract,
        url: paperData.url,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (createPaperError) {
      console.error('Error creating paper:', createPaperError);
      return { data: null, error: createPaperError };
    }
  }

  // Check if paper is already in reading list
  const { data: existingItem, error: checkError } = await supabase
    .from('reading_list')
    .select()
    .eq('paper_id', paperId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking reading list:', checkError);
    return { data: null, error: checkError };
  }

  if (existingItem) {
    return { data: existingItem, error: null };
  }

  // Add to reading list
  const { data, error } = await supabase
    .from('reading_list')
    .insert({
      paper_id: paperId,
      user_id: user.id,
      added_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding to reading list:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function removeFromReadingList(id: string): Promise<DbResult<ReadingListItem>> {
  const supabase = createBrowserClient()
  return await supabase.from('reading_list').delete().eq('id', id).select().single()
}

// Reading List Scheduling
export async function schedulePaper(
  paperId: string,
  scheduledDate: Date,
  estimatedTime?: number,
  repeat?: "daily" | "weekly" | "monthly" | "none"
): Promise<DbResult<ReadingListItem>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First check if the paper is already in the reading list
  const { data: existingItem } = await supabase
    .from('reading_list')
    .select('*')
    .eq('paper_id', paperId)
    .eq('user_id', user.id)
    .single();

  if (existingItem) {
    // Update existing reading list item
    return await supabase
      .from('reading_list')
      .update({
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        estimated_time: estimatedTime,
        repeat: repeat || 'none',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingItem.id)
      .eq('user_id', user.id)
      .select()
      .single();
  } else {
    // Create new reading list item
    return await supabase
      .from('reading_list')
      .insert({
        paper_id: paperId,
        user_id: user.id,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        estimated_time: estimatedTime,
        repeat: repeat || 'none',
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
  }
}

export async function getScheduledPapers(
  startDate: Date,
  endDate: Date
): Promise<DbArrayResult<ReadingListItem & { paper_title: string; paper_authors: string[]; paper_abstract: string }>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return await supabase
    .rpc('get_scheduled_papers', {
      _start_date: startDate.toISOString().split('T')[0],
      _end_date: endDate.toISOString().split('T')[0],
      _user_id: user.id
    });
}

export async function updateReadingStatus(
  id: string,
  status: 'unread' | 'in_progress' | 'completed'
): Promise<DbResult<ReadingListItem>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return await supabase
    .from('reading_list')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
}

export async function getPapersWithDiscoveryData(): Promise<DbArrayResult<Paper>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  return await supabase
    .from('papers')
    .select(`
      *,
      annotations:annotations(count),
      reading_list:reading_list(
        scheduled_date,
        estimated_time,
        repeat
      )
    `)
    .eq('user_id', user.id)
    .order('citations', { ascending: false });
} 