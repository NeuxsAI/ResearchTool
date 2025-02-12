"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageSquare, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatView } from "./chat-view";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  annotationId?: string;
  highlightText?: string;
  isStreaming?: boolean;
}

interface AnnotationSidebarProps {
  open: boolean;
  onClose: () => void;
  onSave: (content: string, highlightedText?: string, position?: any) => Promise<void>;
  onSendMessage: (content: string, highlightedText?: string) => Promise<void>;
  onSaveChat?: (messages: ChatMessage[]) => Promise<void>;
  onStartChat: (annotation: {
    id: string;
    content: string;
    highlight_text?: string;
    created_at: string;
    chat_history?: ChatMessage[];
  }) => void;
  onClearHighlight: () => void;
  annotations?: Array<{
    id: string;
    content: string;
    highlight_text?: string;
    created_at: string;
    chat_history?: ChatMessage[];
  }>;
  highlightedText?: string;
  highlightPosition?: any;
  chatMessages?: ChatMessage[];
  isChatLoading?: boolean;
  activeTab?: 'annotations' | 'chat';
}

export function AnnotationSidebar({ 
  open, 
  onClose, 
  onSave,
  onSendMessage,
  onSaveChat,
  onStartChat,
  onClearHighlight,
  annotations = [], 
  highlightedText,
  highlightPosition,
  chatMessages = [],
  isChatLoading = false,
  activeTab: initialTab = 'annotations'
}: AnnotationSidebarProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    try {
      setIsLoading(true);
      await onSave(content, highlightedText, highlightPosition);
      setContent("");
    } catch (error) {
      console.error("Error saving annotation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSaveChat = async () => {
    if (!onSaveChat || chatMessages.length === 0) return;
    await onSaveChat(chatMessages);
  };

  const handleStartChat = (annotation: typeof annotations[0]) => {
    onStartChat(annotation);
    setActiveTab("chat");
  };

  return (
    <div 
      className={`h-full bg-[#030014] border-l border-[#1a1f2e] flex flex-col relative ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ contain: 'strict' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1f2e] bg-[#030014] relative z-[1]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-white">Research Assistant</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 w-5 p-0 hover:bg-[#333] -mr-1"
          onClick={onClose}
        >
          <X className="h-3 w-3 text-[#666]" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-[#1a1f2e] bg-[#030014] relative z-[1]">
          <TabsList className="flex h-[28px] items-center px-2 bg-transparent">
            <TabsTrigger 
              value="annotations"
              className="flex-1 h-full w-min px-3 text-[10px] uppercase tracking-wider font-medium data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500"
            >
              Annotations
            </TabsTrigger>
            <TabsTrigger 
              value="chat"
              className="flex-1 h-full w-min px-3 text-[10px] uppercase tracking-wider font-medium data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500"
            >
              Chat
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <TabsContent value="annotations" className="absolute inset-0 data-[state=active]:flex flex-col">
            {/* Annotations List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 space-y-2">
                {annotations.map((annotation, index) => (
                  <div 
                    key={annotation.id} 
                    id={`annotation-${annotation.id}`}
                    className="group bg-[#1a1f2e] rounded p-3 border border-[#2a2a2a]"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                        <span className="text-[10px] text-[#888]">{index + 1}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        {annotation.highlight_text && (
                          <div className="p-2 bg-[#2a2a2a] border-l-2 border-violet-500/30 rounded">
                            <p className="text-[10px] text-[#999] leading-relaxed">{annotation.highlight_text}</p>
                          </div>
                        )}
                        <p className="text-[11px] text-white leading-relaxed">{annotation.content}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-[#666]">
                            {new Date(annotation.created_at).toLocaleString()}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartChat(annotation)}
                            className="h-5 px-2 text-[8px] uppercase font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Comment */}
            <div className="flex-shrink-0 p-3 border-t border-[#1a1f2e]">
              {highlightedText && highlightedText.trim() !== "" && (
                <div className="mb-2 p-2 bg-[#1a1f2e] border-l-2 border-violet-500/30 rounded relative group">
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearHighlight}
                      className="h-4 w-4 p-0 hover:bg-[#2a2a2a]"
                    >
                      <X className="h-3 w-3 text-[#666]" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-[#999] leading-relaxed pr-4">{highlightedText}</p>
                </div>
              )}
              <div className="relative bg-[#1a1f2e] rounded border border-[#2a2a2a] shadow-sm focus-within:border-violet-500/50 transition-colors">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add your thoughts..."
                  className="min-h-[45px] max-h-[120px] bg-transparent border-none text-[10px] resize-none pr-8 py-3 px-3.5 placeholder:text-[#666] focus:ring-0 focus:outline-none"
                />
                <Button 
                  onClick={handleSave}
                  disabled={!content.trim() || isLoading}
                  className="absolute bottom-2.5 right-2.5 h-5 px-2 bg-violet-600/75 hover:bg-violet-700 text-[8px] uppercase font-bold text-white rounded"
                >
                  {isLoading ? (
                    <span className="inline-block w-3 h-3 border-[1.5px] border-[#444] border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="absolute inset-0 data-[state=active]:flex flex-col">
            <ChatView
              messages={chatMessages}
              onSendMessage={(content) => onSendMessage(content, highlightedText)}
              highlightedText={highlightedText}
              isLoading={isChatLoading}
              onSaveChat={onSaveChat ? handleSaveChat : undefined}
              onClearHighlight={onClearHighlight}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 