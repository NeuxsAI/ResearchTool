import { createClient as createServerClient } from './server'
import { createClient as createBrowserClient } from './client'
import type { Category, Paper, Annotation, Board, BoardItem, ReadingListItem, DbResult, DbArrayResult, DiscoveredPaper } from '@/lib/supabase/types'
import { cache, CACHE_KEYS } from '../cache'

export type Database = {
  public: {
    Tables: {
      annotations: {
        Row: {
          id: string;
          content: string;
          paper_id: string;
          highlight_text?: string;
          created_at: string;
          updated_at: string;
          chat_history?: Array<{
            role: "user" | "assistant" | "system";
            content: string;
            timestamp: string;
            annotationId?: string;
            highlightText?: string;
            isStreaming?: boolean;
          }>;
        };
        Insert: {
          id?: string;
          content: string;
          paper_id: string;
          highlight_text?: string;
          created_at?: string;
          updated_at?: string;
          chat_history?: Array<{
            role: "user" | "assistant" | "system";
            content: string;
            timestamp: string;
            annotationId?: string;
            highlightText?: string;
            isStreaming?: boolean;
          }>;
        };
        Update: {
          content?: string;
          highlight_text?: string;
          updated_at?: string;
          chat_history?: Array<{
            role: "user" | "assistant" | "system";
            content: string;
            timestamp: string;
            annotationId?: string;
            highlightText?: string;
            isStreaming?: boolean;
          }>;
        };
      };
      // ... other tables ...
    };
  };
};

// Categories
export async function getCategories(): Promise<DbArrayResult<Category>> {
  const cachedCategories = cache.get(CACHE_KEYS.CATEGORIES)
  if (cachedCategories) return { data: cachedCategories, error: null }
  
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  const result = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
  
  if (!result.error) {
    cache.set(CACHE_KEYS.CATEGORIES, result.data)
  }
  return result
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
  const cachedPapers = cache.get(CACHE_KEYS.PAPERS)
  if (cachedPapers) return { data: cachedPapers, error: null }
  
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  const result = await supabase
    .from('papers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (!result.error) {
    cache.set(CACHE_KEYS.PAPERS, result.data)
  }
  return result
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
  if (!user) return { data: null, error: new Error('User not authenticated') };

  try {
    // Generate a new UUID for the paper
    const { data: { id: paperId } } = await supabase.rpc('generate_uuid');

    // Create paper with discovery data
    const paperData = {
      id: paperId,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      abstract: paper.abstract || '',
      url: paper.url,
      citations: paper.citations || 0,
      impact: paper.impact || 'low',
      topics: paper.topics || [],
      category_id: categoryId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // First create the paper
    const { data: createdPaper, error: paperError } = await supabase
      .from('papers')
      .insert(paperData)
      .select()
      .single();

    if (paperError) {
      console.error('Failed to create paper:', paperError);
      return { data: null, error: new Error(paperError.message) };
    }

    if (!createdPaper) {
      return { data: null, error: new Error('Failed to create paper: No data returned') };
    }

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
      // Even if reading list fails, we return the created paper
      return { data: createdPaper, error: new Error('Paper created but failed to add to reading list: ' + readingListError.message) };
    }

    return { data: createdPaper, error: null };
  } catch (error) {
    console.error('Error in addPaperFromDiscovery:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error occurred') };
  }
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
  const supabase = createBrowserClient()
  return await supabase
    .from('papers')
    .delete()
    .eq('id', id)
    .select()
    .single()
}

// Annotations
export async function getAnnotationsByPaper(paperId: string): Promise<DbArrayResult<Annotation>> {
  const cacheKey = CACHE_KEYS.ANNOTATIONS(paperId)
  const cachedAnnotations = cache.get(cacheKey)
  if (cachedAnnotations) return { data: cachedAnnotations, error: null }
  
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
  if (!result.error) {
    cache.set(cacheKey, result.data)
  }
  return result;
}

export async function createAnnotation(annotation: Database['public']['Tables']['annotations']['Insert']): Promise<DbResult<Annotation>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  return await supabase.from('annotations').insert({
    ...annotation,
    user_id: user.id
  }).select().single();
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
  const cachedReadingList = cache.get(CACHE_KEYS.READING_LIST)
  if (cachedReadingList) return { data: cachedReadingList, error: null }
  
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  const result = await supabase
    .from('reading_list')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
  
  if (!result.error) {
    cache.set(CACHE_KEYS.READING_LIST, result.data)
  }
  return result
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

  if (!error) {
    cache.invalidate(CACHE_KEYS.READING_LIST);
    cache.invalidate(CACHE_KEYS.PAPERS);
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
    const result = await supabase
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

    if (!result.error) {
      cache.invalidate(CACHE_KEYS.READING_LIST);
      cache.invalidate(CACHE_KEYS.PAPERS);
    }
    return result;
  } else {
    // Create new reading list item
    const result = await supabase
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

    if (!result.error) {
      cache.invalidate(CACHE_KEYS.READING_LIST);
      cache.invalidate(CACHE_KEYS.PAPERS);
    }
    return result;
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

export async function trackPaperInteraction(
  paperId: string,
  action: 'view' | 'read' | 'schedule' | 'annotate' | 'complete',
  metadata?: any
) {
  try {
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('paper_interactions')
      .insert({
        user_id: user.id,
        paper_id: paperId,
        action,
        metadata: metadata || null
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error tracking paper interaction:', error);
    return { error };
  }
}

// Function to get user's paper interactions
export async function getUserPaperInteractions(limit?: number) {
  try {
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    let query = supabase
      .from('paper_interactions')
      .select(`
        *,
        paper:papers(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting paper interactions:', error);
    return { data: null, error };
  }
}

// Discovered Papers
export async function getDiscoveredPapers(type: 'recommended' | 'trending'): Promise<DbArrayResult<DiscoveredPaper>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  const source = type === 'trending' ? 'trending_search' : 'recommendations';

  const { data, error } = await supabase
    .from('discovered_papers')
    .select('*')
    .eq('user_id', user.id)
    .eq('source', source)
    .order('discovered_at', { ascending: false });

  if (error) {
    console.error('Error getting papers:', error);
  }

  return { data, error };
}

export async function storeDiscoveredPapers(
  papers: Omit<DiscoveredPaper, 'user_id'>[]
): Promise<DbArrayResult<DiscoveredPaper>> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from('discovered_papers')
      .insert(papers.map(paper => ({
        ...paper,
        user_id: user.id
      })))
      .select();

    if (error) {
      console.error('Supabase error details:', error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      console.error('No data returned from insert');
      return { data: null, error: new Error('Failed to store papers') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error storing papers:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error occurred') };
  }
} 