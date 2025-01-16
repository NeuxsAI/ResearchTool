import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageSquare } from "lucide-react";
import { useState } from "react";
import { ChatModal } from "../chat/chat-modal";

interface AnnotationSidebarProps {
  open: boolean;
  onClose: () => void;
  onSave: (content: string, highlightedText?: string) => Promise<void>;
  annotations?: Array<{
    id: string;
    content: string;
    highlight_text?: string;
    created_at: string;
  }>;
  highlightedText?: string;
}

export function AnnotationSidebar({ 
  open, 
  onClose, 
  onSave, 
  annotations = [], 
  highlightedText 
}: AnnotationSidebarProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    try {
      setIsLoading(true);
      await onSave(content, highlightedText);
      setContent("");
    } catch (error) {
      console.error("Error saving annotation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed right-0 top-0 h-full w-[400px] bg-[#1c1c1c] border-l border-[#2a2a2a] transform transition-transform duration-200 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#666]" />
            <h2 className="text-sm font-medium text-white">Annotations</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-[#333]"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-[#666]" />
          </Button>
        </div>

        {/* Annotations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {annotations.map((annotation, index) => (
              <div 
                key={annotation.id} 
                id={`annotation-${annotation.id}`}
                className="group transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                    <span className="text-xs text-[#888]">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    {annotation.highlight_text && (
                      <div className="mb-2 p-2 bg-[#2a2a2a] border-l-2 border-[#666] rounded">
                        <p className="text-sm text-[#888] break-words">{annotation.highlight_text}</p>
                      </div>
                    )}
                    <p className="text-sm text-white mb-1 break-words">{annotation.content}</p>
                    <p className="text-xs text-[#666]">
                      {new Date(annotation.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Comment */}
        <div className="flex-shrink-0 p-4 border-t border-[#2a2a2a] bg-[#1c1c1c]">
          {highlightedText && (
            <div className="mb-3 p-2 bg-[#2a2a2a] border-l-2 border-[#666] rounded">
              <p className="text-sm text-[#888] break-words">{highlightedText}</p>
            </div>
          )}
          <div className="relative bg-[#2a2a2a] rounded-lg border border-[#333] shadow-sm">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add your thoughts or prompt a question to learn more..."
              className="w-full min-h-[100px] max-h-[200px] bg-transparent border-none text-xs text-white/90 resize-y placeholder:text-[#666] focus:ring-0 p-3"
            />
            <div className="absolute bottom-2.5 right-2.5 flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={!content.trim() || isLoading}
                className="h-5 px-2 bg-emerald-900/50 hover:bg-emerald-900/75 text-white text-[10px] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium transition-colors"
              >
                {isLoading ? (
                  <span className="inline-block w-3 h-3 border-2 border-[#444] border-t-[#888] rounded-full animate-spin" />
                ) : (
                  "Submit >"
                )}
              </Button>
              <Button
                onClick={() => setIsChatOpen(true)}
                disabled={!highlightedText}
                className="h-5 px-2 bg-violet-900/50 hover:bg-violet-900/75 text-white text-[10px] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium transition-colors"
              >
                {"Chat >"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ChatModal
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        highlightedText={highlightedText}
      />
    </>
  );
} 