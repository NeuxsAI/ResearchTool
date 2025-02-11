"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import { getPaperById, updatePaper, getReadingList } from "@/lib/supabase/db";
import { MainLayout } from "@/components/layout/main-layout";
import { EditPaperDialog } from "@/components/library/edit-paper-dialog";
import { PDFViewer } from '@/components/pdf/pdf-viewer';
import { AnnotationSidebar } from "@/components/annotations/annotation-sidebar";
import { createAnnotation, getAnnotationsByPaper } from "@/lib/supabase/db";
import { toast } from "sonner";
import { cache, CACHE_KEYS } from "@/lib/cache";
import type { Paper, Annotation, ReadingListItem } from "@/lib/supabase/types";

interface Selection {
  text: string;
  position: { x: number; y: number };
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  annotationId?: string;
  highlightText?: string;
  isStreaming?: boolean;
}

interface UIAnnotation {
  id: string;
  content: string;
  highlight_text?: string;
  created_at: string;
  chat_history?: ChatMessage[];
}

// Preload function for parallel data fetching
async function preloadPaperData(paperId: string, refresh = false) {
  const cachedPaper = !refresh && cache.get<Paper>(`paper_${paperId}`);
  const cachedAnnotations = !refresh && cache.get<Annotation[]>(`annotations_${paperId}`);
  const cachedReadingList = !refresh && cache.get<ReadingListItem[]>(CACHE_KEYS.READING_LIST);

  if (cachedPaper && cachedAnnotations && cachedReadingList) {
    return {
      paper: cachedPaper,
      annotations: cachedAnnotations,
      readingList: cachedReadingList
    };
  }

  const [paperResult, annotationsResult, readingListResult] = await Promise.all([
    getPaperById(paperId),
    getAnnotationsByPaper(paperId),
    getReadingList()
  ]);

  const paper = paperResult.data;
  const annotations = annotationsResult.data || [];
  const readingList = readingListResult.data || [];

  if (!refresh && paper) {
    cache.set(`paper_${paperId}`, paper);
    cache.set(`annotations_${paperId}`, annotations);
    cache.set(CACHE_KEYS.READING_LIST, readingList);
  }

  return { paper, annotations, readingList };
}

export default function PaperPage() {
  const params = useParams();
  const paperId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  
  const [paper, setPaper] = useState<Paper | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditPaperOpen, setIsEditPaperOpen] = useState(false);
  const [isAnnotationSidebarOpen, setIsAnnotationSidebarOpen] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string | undefined>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Transform DB annotation to UI annotation
  const transformAnnotation = (annotation: Annotation): UIAnnotation => ({
    id: annotation.id,
    content: annotation.content,
    highlight_text: annotation.highlight_text,
    created_at: annotation.created_at,
    chat_history: annotation.chat_history
  });

  const loadData = async (refresh = false) => {
    if (!paperId) return;
    
    try {
      setIsLoading(true);
      const { paper, annotations, readingList } = await preloadPaperData(paperId, refresh);
      if (paper) {
        setPaper(paper);
        setAnnotations(annotations);
        setReadingList(readingList);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!paperId) return;

    // Try to load from cache first
    const cachedPaper = cache.get<Paper>(`paper_${paperId}`);
    const cachedAnnotations = cache.get<Annotation[]>(`annotations_${paperId}`);
    const cachedReadingList = cache.get<ReadingListItem[]>(CACHE_KEYS.READING_LIST);
    
    if (cachedPaper && cachedAnnotations && cachedReadingList) {
      setPaper(cachedPaper);
      setAnnotations(cachedAnnotations);
      setReadingList(cachedReadingList);
      setIsLoading(false);
    } else {
      loadData(false);
    }
  }, [paperId]);

  const handleSaveAnnotation = async (content: string, highlightedText?: string) => {
    if (!paper) return;
    
    try {
      const result = await createAnnotation({
        paper_id: paper.id,
        content,
        highlight_text: highlightedText
      });

      if (result.error) throw result.error;
      if (!result.data) throw new Error("No data returned");

      // Update local state immediately
      setAnnotations(prev => [...prev, result.data!]);
      
      // Clear highlight
      setHighlightedText(undefined);
      
      // Clear specific cache keys but don't reload
      cache.delete(`annotations_${paper.id}`);
      
      toast.success("Annotation saved");
    } catch (error) {
      console.error("Error saving annotation:", error);
      toast.error("Failed to save annotation");
    }
  };

  // Simple text selection handler
  const handleTextSelection = (text: string) => {
    console.log('Selection handler called with:', text);
    // If no text or empty text, clear the highlight
    if (!text || text.trim() === "") {
      setHighlightedText(undefined);
      return;
    }
    setHighlightedText(text.trim());
  };

  // Effect ONLY handles opening the sidebar when there's text
  useEffect(() => {
    console.log('useEffect triggered. highlightedText:', highlightedText);
    if (highlightedText) {
      setIsAnnotationSidebarOpen(true);
    }
  }, [highlightedText]);

  const handleSidebarClose = () => {
    console.log('Sidebar closing, clearing highlight');
    setIsAnnotationSidebarOpen(false);
    setHighlightedText(undefined);
  };

  const handleAnnotationClick = (annotationId: string) => {
    // Find the annotation in the list
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation) return;

    // Open the sidebar
    setIsAnnotationSidebarOpen(true);

    // Scroll the annotation into view in the sidebar
    setTimeout(() => {
      const element = document.getElementById(`annotation-${annotationId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        element.classList.add('highlight-pulse');
        setTimeout(() => element.classList.remove('highlight-pulse'), 1000);
      }
    }, 100); // Small delay to ensure sidebar is open
  };

  const handleStartChat = (annotation: {
    id: string;
    content: string;
    highlight_text?: string;
    created_at: string;
    chat_history?: ChatMessage[];
  }) => {
    setHighlightedText(annotation.highlight_text);
    setChatMessages(annotation.chat_history || []);
  };

  const handleSendMessage = async (content: string, highlightedText?: string) => {
    try {
      setIsChatLoading(true);
      
      // If this is the first message and we have highlighted text, add it as context
      if (chatMessages.length === 0 && highlightedText) {
        const contextMessage: ChatMessage = {
          role: "system",
          content: highlightedText,
          timestamp: new Date().toISOString(),
          highlightText: highlightedText
        };
        setChatMessages([contextMessage]);
      }
      
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        highlightText: highlightedText // Include current highlight with message
      };
      
      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);

      // Create EventSource for streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          paperId: paper?.id,  // Pass the paper ID for RAG context
          highlightedText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response reader available');
      }

      // Add assistant message placeholder
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true
      };
      setChatMessages([...updatedMessages, assistantMessage]);

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.content) {
                setChatMessages(messages => {
                  const lastMessage = messages[messages.length - 1];
                  if (lastMessage.role === "assistant" && lastMessage.isStreaming) {
                    const updatedMessage = {
                      ...lastMessage,
                      content: lastMessage.content + data.content
                    };
                    return [...messages.slice(0, -1), updatedMessage];
                  }
                  return messages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Mark streaming as complete
      setChatMessages(messages => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant" && lastMessage.isStreaming) {
          return [...messages.slice(0, -1), { ...lastMessage, isStreaming: false }];
        }
        return messages;
      });

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveChat = async (messages: ChatMessage[]) => {
    try {
      const firstMessage = messages[0];
      if (!firstMessage || !paper) return;

      const { data: annotation, error } = await createAnnotation({
        paper_id: paper.id,
        content: firstMessage.content.slice(0, 100) + "...",
        highlight_text: firstMessage.highlightText,
        chat_history: messages
      });

      if (error) throw error;
      if (!annotation) throw new Error("No annotation returned");

      // Update local state immediately
      setAnnotations(prev => [...prev, annotation]);
      
      // Clear chat state
      setChatMessages([]);
      
      // Clear specific cache
      cache.delete(`annotations_${paper.id}`);
      
      toast.success("Chat saved as annotation");
    } catch (error) {
      console.error("Error saving chat:", error);
      toast.error("Failed to save chat");
    }
  };

  // Add this new handler
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only clear if clicking the container itself, not a selection
    if (e.target === e.currentTarget) {
      setHighlightedText(undefined);
    }
  };

  const handleAnnotationSelect = (uiAnnotation: UIAnnotation) => {
    const annotation = annotations.find(a => a.id === uiAnnotation.id);
    if (annotation) {
      setHighlightedText(annotation.highlight_text);
      setChatMessages(annotation.chat_history || []);
    }
  };

  const handleAnnotationDelete = async (annotationId: string) => {
    try {
      // Update UI immediately
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      
      // Clear specific cache
      cache.delete(`annotations_${paper.id}`);
      
      toast.success("Annotation deleted");
    } catch (error) {
      console.error("Error deleting annotation:", error);
      toast.error("Failed to delete annotation");
      // Revert on error
      loadData(true);
    }
  };

  if (isLoading) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-[#888]">Loading...</div>
      </div>
    </MainLayout>;
  }

  if (!paper) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#eee] mb-2">Paper not found</h1>
          <p className="text-[#888]">The paper you're looking for doesn't exist.</p>
        </div>
      </div>
    </MainLayout>;
  }

  const handleUpdatePaper = async (paperDetails: { title: string; authors: string[]; year: number }) => {
    try {
      const { error } = await updatePaper(paper.id, paperDetails);
      if (error) throw error;

      // Update local state immediately
      setPaper(prev => prev ? { ...prev, ...paperDetails } : null);
      
      // Clear specific cache
      cache.delete(`paper_${paper.id}`);
      
      toast.success('Paper updated successfully');
    } catch (error) {
      console.error('Error updating paper:', error);
      toast.error('Failed to update paper');
      throw error;
    }
  };

  return (
    <MainLayout>
      <div className="h-full bg-[#030014] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1f2e]">
          <div className="flex items-center gap-2">
            <h1 className="text-[#eee] text-sm font-medium">{paper.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
              onClick={() => setIsEditPaperOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Paper Details
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
              onClick={() => setIsAnnotationSidebarOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Annotation
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 relative">
          {paper?.url ? (
            <div onClick={handleContainerClick} className="h-full relative">
              <PDFViewer 
                url={paper.url}
                onSelection={handleTextSelection}
                annotations={annotations}
                onAnnotationClick={handleAnnotationClick}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#4a5578]">
              No PDF available for this paper
            </div>
          )}
          
          <AnnotationSidebar
            open={isAnnotationSidebarOpen}
            onClose={() => setIsAnnotationSidebarOpen(false)}
            onSave={handleSaveAnnotation}
            onSendMessage={handleSendMessage}
            onSaveChat={handleSaveChat}
            onStartChat={handleStartChat}
            onClearHighlight={() => setHighlightedText(undefined)}
            annotations={annotations.map(transformAnnotation)}
            highlightedText={highlightedText}
            chatMessages={chatMessages}
            isChatLoading={isChatLoading}
          />
        </div>
      </div>

      {/* Edit Paper Dialog */}
      <EditPaperDialog
        open={isEditPaperOpen}
        onOpenChange={setIsEditPaperOpen}
        paper={paper}
        onSave={handleUpdatePaper}
      />

      <style jsx global>{`
        .highlight-pulse {
          animation: pulse 1s;
        }

        @keyframes pulse {
          0% {
            background-color: rgba(255, 255, 0, 0);
          }
          50% {
            background-color: rgba(255, 255, 0, 0.2);
          }
          100% {
            background-color: rgba(255, 255, 0, 0);
          }
        }
      `}</style>
    </MainLayout>
  );
} 