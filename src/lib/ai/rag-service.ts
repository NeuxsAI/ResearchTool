import type { RAGResponse, RAGContext, RAGAnnotation } from '@/types/rag';

export class RagService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';
  }

  async indexPaper(paperId: string, pdfUrl: string): Promise<RAGResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/papers/${paperId}/index-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pdf_url: pdfUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to index paper');
      }

      return response.json();
    } catch (error) {
      console.error('Error indexing paper:', error);
      throw error;
    }
  }

  async searchContext(paperId: string, query: string): Promise<RAGContext[]> {
    try {
      const response = await fetch(`${this.apiUrl}/papers/${paperId}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Failed to search context');
      }

      return response.json();
    } catch (error) {
      console.error('Error searching context:', error);
      throw error;
    }
  }
} 