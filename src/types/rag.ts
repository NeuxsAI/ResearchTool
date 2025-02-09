export interface RAGResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface RAGContext {
  chunk_text: string;
  section_name: string;
  similarity: number;
}

export interface RAGAnnotation {
  id: string;
  content: string;
  highlight_text?: string;
  similarity: number;
} 