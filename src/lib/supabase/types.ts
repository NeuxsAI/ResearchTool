export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category_id?: string;
  annotations_count?: number;
  url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Annotation {
  id: string;
  content: string;
  paper_id: string;
  user_id: string;
  highlight_text?: string;
  position?: {
    x: number;
    y: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BoardItem {
  id: string;
  board_id: string;
  paper_id: string;
  position?: any;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingListItem {
  id: string;
  paper_id: string;
  user_id: string;
  added_at: string;
}

export interface DbResult<T> {
  data: T | null;
  error: Error | null;
}

export interface DbArrayResult<T> {
  data: T[] | null;
  error: Error | null;
} 