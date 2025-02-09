import { RagService } from '@/lib/ai/rag-service';

export function usePaperRag() {
  const ragService = new RagService();
  return ragService;
} 