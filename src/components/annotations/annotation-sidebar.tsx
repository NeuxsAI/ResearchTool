"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageSquare, MessageCircle } from "lucide-react";
import { useState } from "react";
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
  onSave: (content: string, highlightedText?: string) => Promise<void>;
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
  chatMessages?: ChatMessage[];
  isChatLoading?: boolean;
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
  chatMessages = [],
  isChatLoading = false
}: AnnotationSidebarProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("annotations");

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
      className={`fixed right-0 top-0 h-full w-[400px] bg-[#1c1c1c] border-l border-[#2a2a2a] transform transition-transform duration-200 ease-in-out flex flex-col ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-[#666]" />
          <h2 className="text-[11px] font-medium text-white">Research Assistant</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 hover:bg-[#333]"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5 text-[#666]" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 flex bg-[#1c1c1c] border-b border-[#2a2a2a] justify-start w-full">
          <TabsTrigger 
            value="annotations"
            className="h-[24px] px-3 text-[8px] uppercase tracking-wider font-medium data-[state=active]:bg-transparent rounded-none border-b border-transparent data-[state=active]:border-violet-500"
          >
            Annotations
          </TabsTrigger>
          <TabsTrigger 
            value="chat"
            className="h-[24px] px-3 text-[8px] uppercase tracking-wider font-medium data-[state=active]:bg-transparent rounded-none border-b border-transparent data-[state=active]:border-violet-500"
          >
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="annotations" className="flex-1 mt-0 p-0 border-none data-[state=active]:flex flex-col min-h-0">
          {/* Annotations List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 space-y-2">
              {annotations.map((annotation, index) => (
                <div 
                  key={annotation.id} 
                  id={`annotation-${annotation.id}`}
                  className="group bg-[#2a2a2a] rounded p-3 border border-[#333]"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#333] flex items-center justify-center">
                      <span className="text-[10px] text-[#888]">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      {annotation.highlight_text && (
                        <div className="p-2 bg-[#333] border-l border-violet-500/30 rounded">
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
                      {annotation.chat_history && annotation.chat_history.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#333]">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] text-violet-400">Chat Thread ({annotation.chat_history.length} messages)</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartChat(annotation)}
                              className="h-5 px-2 text-[8px] uppercase font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                            >
                              Continue
                            </Button>
                          </div>
                          <div className="max-h-[100px] overflow-hidden relative">
                            {annotation.chat_history.slice(0, 3).map((msg, i) => (
                              <div key={i} className="text-[10px] text-[#aaa] mb-1.5">
                                <span className={msg.role === "assistant" ? "text-emerald-500" : "text-violet-500"}>
                                  {msg.role === "assistant" ? "AI: " : "You: "}
                                </span>
                                {msg.content.length > 150 ? `${msg.content.slice(0, 150)}...` : msg.content}
                              </div>
                            ))}
                            {annotation.chat_history.length > 3 && (
                              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#2a2a2a] to-transparent" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Comment - Fixed at bottom */}
          <div className="flex-shrink-0 p-3 border-t border-[#2a2a2a] bg-[#1c1c1c]">
            {highlightedText && highlightedText.trim() !== "" && (
              <div className="mb-2 p-2 bg-[#2a2a2a] border-l border-violet-500/30 rounded relative group">
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearHighlight}
                    className="h-4 w-4 p-0 hover:bg-[#333]"
                  >
                    <X className="h-3 w-3 text-[#666]" />
                  </Button>
                </div>
                <p className="text-[10px] text-[#999] leading-relaxed pr-4">{highlightedText}</p>
              </div>
            )}
            <div className="relative bg-[#2a2a2a] rounded border border-[#333] shadow-sm">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add your thoughts..."
                className="min-h-[45px] max-h-[120px] bg-transparent border-none text-[11px] resize-none pr-8 py-2.5 px-3 placeholder:text-[#666]"
              />
              <Button 
                onClick={handleSave}
                disabled={!content.trim() || isLoading}
                className="absolute bottom-2 right-2 h-5 px-2 bg-violet-600/75 hover:bg-violet-700 text-[8px] uppercase font-bold text-white"
              >
                {isLoading ? (
                  <span className="inline-block w-3 h-3 border-[1.5px] border-[#444] text-white border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="text-white">Save</span>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 mt-0 p-0 border-none data-[state=active]:flex flex-col min-h-0">
          <ChatView
            messages={chatMessages}
            onSendMessage={(content) => onSendMessage(content, highlightedText)}
            highlightedText={highlightedText}
            isLoading={isChatLoading}
            onSaveChat={onSaveChat ? handleSaveChat : undefined}
            onClearHighlight={onClearHighlight}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 