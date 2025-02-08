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
  source?: string;
  created_at?: string;
  metadata?: {
    institution?: string;
    query?: string;
    discovery_type?: string;
  };
} 