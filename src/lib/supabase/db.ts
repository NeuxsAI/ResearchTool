import { createClient as createServerClient } from './server'
import supabase from './client'
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
          highlight_position?: {
            boundingRect: {
              x1: number;
              y1: number;
              x2: number;
              y2: number;
              width: number;
              height: number;
              pageNumber: number;
            };
            rects: Array<{
              x1: number;
              y1: number;
              x2: number;
              y2: number;
              width: number;
              height: number;
              pageNumber: number;
            }>;
            pageNumber: number;
          };
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
          highlight_position?: {
            boundingRect: {
              x1: number;
              y1: number;
              x2: number;
              y2: number;
              width: number;
              height: number;
              pageNumber: number;
            };
            rects: Array<{
              x1: number;
              y1: number;
              x2: number;
              y2: number;
              width: number;
              height: number;
              pageNumber: number;
            }>;
            pageNumber: number;
          };
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('categories')
    .insert({ ...category, user_id: user.id })
    .select()
    .single()
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<DbResult<Category>> {
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
  return await supabase.from('categories').delete().eq('id', id).select().single()
}

// Papers
export const getPapers = async (): Promise<DbArrayResult<Paper>> => {
  const cachedPapers = cache.get(CACHE_KEYS.PAPERS)
  if (cachedPapers) return { data: cachedPapers, error: null }
  
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('papers')
    .select('*')
    .eq('category_id', categoryId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
}

export async function getPaperById(id: string): Promise<DbResult<Paper>> {
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
  },
  categoryId?: string
): Promise<DbResult<Paper>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { data: null, error: new Error('Not authenticated') };
  }

  try {
    // Create form data with only fields that exist in the papers table
    const formData = new FormData();
    formData.append('title', paper.title);
    formData.append('authors', JSON.stringify(paper.authors));
    formData.append('year', paper.year.toString());
    formData.append('abstract', paper.abstract || '');
    formData.append('url', paper.url || '');

    // Submit to API route with proper headers and credentials
    const response = await fetch('/api/papers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create paper:', errorData);
      throw new Error(errorData.error || 'Failed to create paper');
    }

    const data = await response.json();
    
    // Clear cache to force refresh
    cache.delete(CACHE_KEYS.PAPERS);
    cache.delete(CACHE_KEYS.READING_LIST);
    
    return { data: data.paper, error: null };
  } catch (error) {
    console.error('Error adding paper:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to add paper')
    };
  }
}

export async function updatePaper(
  id: string, 
  paper: Partial<Paper>, 
  token?: string
): Promise<DbResult<Paper>> {
  const supabase = token ? createServerClient(token) : createServerClient();
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }
  
  try {
    // First get the paper data
    const { data: paper, error: getError } = await supabase
      .from('papers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (getError) {
      console.error('Error getting paper:', getError)
      return { data: null, error: getError }
    }

    // Delete related paper chunks first
    const { error: chunksError } = await supabase
      .from('paper_chunks')
      .delete()
      .eq('paper_id', id)

    if (chunksError) {
      console.error('Error deleting paper chunks:', chunksError)
      return { data: null, error: chunksError }
    }
    
    // Then delete the paper
    const { error: deleteError } = await supabase
      .from('papers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('Error deleting paper:', deleteError)
      return { data: null, error: deleteError }
    }
    
    // Clear cache
    cache.delete(CACHE_KEYS.PAPERS)
    cache.delete(CACHE_KEYS.READING_LIST)
    cache.delete(CACHE_KEYS.ANNOTATIONS as unknown as string)
    
    return { data: paper, error: null }
  } catch (error) {
    console.error('Error in deletePaper:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to delete paper')
    }
  }
}

// Annotations
export async function getAnnotationsByPaper(paperId: string): Promise<DbArrayResult<Annotation>> {
  const cacheKey = CACHE_KEYS.ANNOTATIONS(paperId)
  const cachedAnnotations = cache.get(cacheKey)
  if (cachedAnnotations) return { data: cachedAnnotations, error: null }
  
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  return await supabase.from('annotations').insert({
    ...annotation,
    user_id: user.id
  }).select().single();
}

export async function updateAnnotation(id: string, annotation: Partial<Annotation>): Promise<DbResult<Annotation>> {
  return await supabase.from('annotations').update(annotation).eq('id', id).select().single()
}

export async function deleteAnnotation(id: string): Promise<DbResult<Annotation>> {
  return await supabase.from('annotations').delete().eq('id', id).select().single()
}

// Boards
export const getBoards = async (): Promise<DbArrayResult<Board>> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
}

export async function getBoardById(id: string): Promise<DbResult<Board>> {
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('boards')
    .insert({ ...board, user_id: user.id })
    .select()
    .single()
}

export async function updateBoard(id: string, board: Partial<Board>): Promise<DbResult<Board>> {
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('board_items')
    .select('*')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
}

export async function createBoardItem(item: Partial<BoardItem>): Promise<DbResult<BoardItem>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('board_items')
    .insert({ ...item, user_id: user.id })
    .select()
    .single()
}

export async function updateBoardItem(id: string, item: Partial<BoardItem>): Promise<DbResult<BoardItem>> {
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

export async function addToReadingList(paperId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // First check if the paper is already in the reading list
    const { data: existing, error: checkError } = await supabase
      .from('reading_list')
      .select('id')
      .eq('paper_id', paperId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      return { data: existing, error: null };
    }

    // If not in reading list, add it
    const { data, error } = await supabase
      .from('reading_list')
      .insert({
        paper_id: paperId,
        user_id: user.id,
        added_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error in addToReadingList:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in addToReadingList:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to add to reading list') 
    };
  }
}

export async function removeFromReadingList(id: string): Promise<DbResult<ReadingListItem>> {
  return await supabase.from('reading_list').delete().eq('id', id).select().single()
}

// Reading List Scheduling
export async function schedulePaper(
  paperId: string,
  scheduledDate: Date,
  estimatedTime?: number,
  repeat?: "daily" | "weekly" | "monthly" | "none"
): Promise<DbResult<ReadingListItem>> {
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
    .order('created_at', { ascending: false });
}