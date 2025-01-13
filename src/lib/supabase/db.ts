import { createClient } from './client'
import type { Category, Paper, Annotation, Board, BoardItem, ReadingListItem, DbResult, DbArrayResult } from './types'

// Categories
export async function getCategories(): Promise<DbArrayResult<Category>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
  
  return await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
}

export async function getCategoryById(id: string): Promise<DbResult<Category>> {
  const supabase = createClient()
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  return await supabase
    .from('categories')
    .insert({ ...category, user_id: user.id })
    .select()
    .single()
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<DbResult<Category>> {
  const supabase = createClient()
  return await supabase.from('categories').update(category).eq('id', id).select().single()
}

export async function deleteCategory(id: string): Promise<DbResult<Category>> {
  const supabase = createClient()
  return await supabase.from('categories').delete().eq('id', id).select().single()
}

// Papers
export const getPapers = async (): Promise<DbArrayResult<Paper>> => {
  const supabase = createClient()
  return await supabase
    .from('papers')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getPapersByCategory(categoryId: string): Promise<DbArrayResult<Paper>> {
  const supabase = createClient()
  return await supabase.from('papers').select('*').eq('category_id', categoryId).order('created_at', { ascending: false })
}

export async function getPaperById(id: string): Promise<DbResult<Paper>> {
  const supabase = createClient()
  return await supabase.from('papers').select('*').eq('id', id).single()
}

export async function createPaper(paper: Partial<Paper>): Promise<DbResult<Paper>> {
  const supabase = createClient()
  return await supabase.from('papers').insert(paper).select().single()
}

export async function updatePaper(id: string, paper: Partial<Paper>): Promise<DbResult<Paper>> {
  const supabase = createClient()
  return await supabase.from('papers').update(paper).eq('id', id).select().single()
}

export async function deletePaper(id: string): Promise<DbResult<Paper>> {
  const supabase = createClient()
  return await supabase.from('papers').delete().eq('id', id).select().single()
}

// Annotations
export async function getAnnotationsByPaper(paperId: string): Promise<DbArrayResult<Annotation>> {
  const supabase = createClient()
  return await supabase.from('annotations').select('*').eq('paper_id', paperId).order('created_at')
}

export async function createAnnotation(annotation: Partial<Annotation>): Promise<DbResult<Annotation>> {
  const supabase = createClient()
  return await supabase.from('annotations').insert(annotation).select().single()
}

export async function updateAnnotation(id: string, annotation: Partial<Annotation>): Promise<DbResult<Annotation>> {
  const supabase = createClient()
  return await supabase.from('annotations').update(annotation).eq('id', id).select().single()
}

export async function deleteAnnotation(id: string): Promise<DbResult<Annotation>> {
  const supabase = createClient()
  return await supabase.from('annotations').delete().eq('id', id).select().single()
}

// Boards
export const getBoards = async (): Promise<DbArrayResult<Board>> => {
  const supabase = createClient()
  return await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getBoardById(id: string): Promise<DbResult<Board>> {
  const supabase = createClient()
  return await supabase.from('boards').select('*').eq('id', id).single()
}

export async function createBoard(board: Partial<Board>): Promise<DbResult<Board>> {
  const supabase = createClient()
  return await supabase.from('boards').insert(board).select().single()
}

export async function updateBoard(id: string, board: Partial<Board>): Promise<DbResult<Board>> {
  const supabase = createClient()
  return await supabase.from('boards').update(board).eq('id', id).select().single()
}

export async function deleteBoard(id: string): Promise<DbResult<Board>> {
  const supabase = createClient()
  return await supabase.from('boards').delete().eq('id', id).select().single()
}

// Board Items
export async function getBoardItems(boardId: string): Promise<DbArrayResult<BoardItem>> {
  const supabase = createClient()
  return await supabase.from('board_items').select('*').eq('board_id', boardId)
}

export async function createBoardItem(item: Partial<BoardItem>): Promise<DbResult<BoardItem>> {
  const supabase = createClient()
  return await supabase.from('board_items').insert(item).select().single()
}

export async function updateBoardItem(id: string, item: Partial<BoardItem>): Promise<DbResult<BoardItem>> {
  const supabase = createClient()
  return await supabase.from('board_items').update(item).eq('id', id).select().single()
}

export async function deleteBoardItem(id: string): Promise<DbResult<BoardItem>> {
  const supabase = createClient()
  return await supabase.from('board_items').delete().eq('id', id).select().single()
}

// Reading List
export const getReadingList = async (): Promise<DbArrayResult<ReadingListItem>> => {
  const supabase = createClient()
  return await supabase
    .from('reading_list')
    .select('*')
    .order('added_at', { ascending: false })
}

export async function addToReadingList(paperId: string): Promise<DbResult<ReadingListItem>> {
  const supabase = createClient()
  return await supabase.from('reading_list').insert({ paper_id: paperId }).select().single()
}

export async function removeFromReadingList(id: string): Promise<DbResult<ReadingListItem>> {
  const supabase = createClient()
  return await supabase.from('reading_list').delete().eq('id', id).select().single()
} 