"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import { getPaperById, updatePaper } from "@/lib/supabase/db";
import { MainLayout } from "@/components/layout/main-layout";
import { EditPaperDialog } from "@/components/library/edit-paper-dialog";
import { PDFViewer } from '@/components/pdf/pdf-viewer';
import { AnnotationSidebar } from "@/components/annotations/annotation-sidebar";
import { createAnnotation, getAnnotationsByPaper } from "@/lib/supabase/db";
import { toast } from "sonner";

interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category_id?: string;
  annotations_count?: number;
  url?: string;
}

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
  chat_history?: ChatMessage[];
}

export default function PaperPage() {
  const params = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditPaperOpen, setIsEditPaperOpen] = useState(false);
  const [isAnnotationSidebarOpen, setIsAnnotationSidebarOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    content: string;
    highlight_text?: string;
    created_at: string;
    chat_history?: ChatMessage[];
  }>>([]);
  const [highlightedText, setHighlightedText] = useState<string | undefined>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    async function loadPaper() {
      if (!params?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const paperId = Array.isArray(params.id) ? params.id[0] : params.id;
        const { data, error: paperError } = await getPaperById(paperId);

        if (paperError) {
          console.error("Error loading paper:", paperError);
          setError("Failed to load paper");
          return;
        }

        if (!data) {
          setError("Paper not found");
          return;
        }

        setPaper(data);
      } catch (error) {
        console.error("Error loading paper data:", error);
        setError("Failed to load paper data");
      } finally {
        setIsLoading(false);
      }
    }
    loadPaper();
  }, [params?.id]);

  useEffect(() => {
    async function loadAnnotations() {
      if (!paper?.id) return;
      
      try {
        const { data, error } = await getAnnotationsByPaper(paper.id);
        if (error) throw error;
        setAnnotations(data || []);
      } catch (error) {
        console.error("Error loading annotations:", error);
        toast.error("Failed to load annotations");
      }
    }
    loadAnnotations();
  }, [paper?.id]);

  const handleSaveAnnotation = async (content: string, highlightText?: string) => {
    if (!paper?.id) return;

    try {
      const now = new Date().toISOString();
      const { data, error } = await createAnnotation({
        content,
        paper_id: paper.id,
        highlight_text: highlightText,
        created_at: now,
        updated_at: now
      });

      if (error) {
        console.error("Full annotation error:", error);
        throw error;
      }

      // Reset selection
      setHighlightedText(undefined);

      // Reload annotations
      const { data: newAnnotations } = await getAnnotationsByPaper(paper.id);
      setAnnotations(newAnnotations || []);
      toast.success("Annotation saved");
    } catch (error) {
      console.error("Detailed error:", error);
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

  const handleSaveChat = async () => {
    try {
      // Get the first message as title/summary
      const firstMessage = chatMessages[0];
      if (!firstMessage) return;

      // Create a new annotation with the chat
      const { data: annotation, error } = await createAnnotation({
        paper_id: paper?.id as string,
        content: firstMessage.content.slice(0, 100) + "...", // First message as summary
        highlight_text: firstMessage.highlightText,
        chat_history: chatMessages
      });

      if (error) throw error;

      // Refresh annotations
      const { data: updatedAnnotations } = await getAnnotationsByPaper(paper?.id as string);
      setAnnotations(updatedAnnotations || []);

      // Reset chat messages after successful save
      setChatMessages([]);
      
      toast.success("Chat saved as annotation");
    } catch (error) {
      console.error("Error saving chat:", error);
      toast.error("Failed to save chat");
    }
  };

  const handleStartChat = (annotation: typeof annotations[0]) => {
    // If there's existing chat history, load it
    if (annotation.chat_history?.length) {
      setChatMessages(annotation.chat_history);
    } else {
      // Start new chat with annotation content as context
      const initialMessage: ChatMessage = {
        role: "system",
        content: `Context: ${annotation.content}${annotation.highlight_text ? `\n\nHighlighted text: ${annotation.highlight_text}` : ""}`,
        timestamp: new Date().toISOString(),
        annotationId: annotation.id
      };
      setChatMessages([initialMessage]);
    }
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
      setChatMessages(prev => [...prev, userMessage]);

      // Create initial streaming message
      const streamingMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        highlightText: highlightedText, // Include current highlight with response
        isStreaming: true
      };
      setChatMessages(prev => [...prev, streamingMessage]);

      // Send to API with all messages including context
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          highlightedText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let accumulatedContent = "";
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              accumulatedContent += data.content || "";
              
              // Update the streaming message with accumulated content
              setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.isStreaming) {
                  lastMessage.content = accumulatedContent;
                }
                return newMessages;
              });
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      // Mark message as done streaming
      setChatMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add this new handler
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only clear if clicking the container itself, not a selection
    if (e.target === e.currentTarget) {
      setHighlightedText(undefined);
    }
  };

  if (isLoading) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-[#888]">Loading...</div>
      </div>
    </MainLayout>;
  }

  if (error || !paper) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#eee] mb-2">Paper not found</h1>
          <p className="text-[#888]">{error || "The paper you're looking for doesn't exist."}</p>
        </div>
      </div>
    </MainLayout>;
  }

  const handleUpdatePaper = async (paperDetails: { title: string; authors: string[]; year: number }) => {
    try {
      console.log('Updating paper with details:', paperDetails);
      const { error } = await updatePaper(paper.id, paperDetails);
      if (error) {
        console.error('Full update error:', error);
        throw error;
      }
      setPaper(prev => prev ? { ...prev, ...paperDetails } : null);
      toast.success('Paper updated successfully');
    } catch (error) {
      console.error('Error updating paper:', error);
      toast.error('Failed to update paper');
      throw error;
    }
  };

  return (
    <MainLayout>
      <div className="h-full bg-[#1c1c1c] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <h1 className="text-[#eee] text-sm font-medium">{paper.title}</h1>
            <span className="text-[#666] text-sm">•</span>
            <span className="text-[#666] text-sm">{paper.year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 bg-[#2a2a2a] hover:bg-[#333] text-white"
              onClick={() => setIsEditPaperOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Paper Details
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 bg-[#2a2a2a] hover:bg-[#333] text-white"
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
            <div className="h-full flex items-center justify-center text-[#888]">
              No PDF available for this paper
            </div>
          )}
          
          <AnnotationSidebar
            open={isAnnotationSidebarOpen}
            onClose={handleSidebarClose}
            onSave={handleSaveAnnotation}
            onSendMessage={handleSendMessage}
            onSaveChat={handleSaveChat}
            onStartChat={handleStartChat}
            onClearHighlight={() => setHighlightedText(undefined)}
            annotations={annotations}
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