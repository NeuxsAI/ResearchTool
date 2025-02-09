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