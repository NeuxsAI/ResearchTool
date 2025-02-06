export interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  abstract?: string;
  category_id?: string;
  annotations_count?: number;
  url?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  citations?: number;
  impact?: 'high' | 'low';
  topics?: string[];
} 