export interface Paper {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  year: number;
  citations: number;
  institution?: string;
  impact: "high" | "low";
  url: string;
  topics: string[];
  category_id?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  created_at?: string;
  updated_at?: string;
  scheduled_date?: string;
  estimated_time?: number;
  repeat?: "daily" | "weekly" | "monthly" | "none";
  in_reading_list?: boolean;
  status?: 'unread' | 'in_progress' | 'completed';
  user_id?: string;
}

export interface Annotation {
  id: string;
  paper_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  page?: number;
  color?: string;
  type?: 'highlight' | 'note' | 'comment';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface ReadingListItem {
  id: string;
  paper_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status?: 'unread' | 'in_progress' | 'completed';
  scheduled_date?: string;
  estimated_time?: number;
  repeat?: "daily" | "weekly" | "monthly" | "none";
} 