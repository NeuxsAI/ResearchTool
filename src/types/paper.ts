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
  arxiv_id?: string;
  topics: string[];
  source?: string;
  created_at?: string;
  metadata?: {
    institution?: string;
    query?: string;
    discovery_type?: string;
  };
  // Reading list related fields
  in_reading_list?: boolean;
  scheduled_date?: string;
  estimated_time?: number;
  repeat?: "daily" | "weekly" | "monthly" | "none";
  status?: "unread" | "in_progress" | "completed";
  // Category related fields
  category_id?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Annotation {
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
} 