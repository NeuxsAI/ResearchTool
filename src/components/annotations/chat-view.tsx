"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Save, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CodeProps } from "react-markdown/lib/ast-to-react";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  annotationId?: string;
  highlightText?: string;
  isStreaming?: boolean;
}

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  highlightedText?: string;
  isLoading?: boolean;
  onSaveChat?: () => Promise<void>;
  onClearHighlight?: () => void;
}

const EXAMPLE_PROMPTS = [
  "Explain this in simpler terms",
  "What are the key points?",
  "How does this relate to other concepts?",
  "Give me an example"
];

export function ChatView({ 
  messages, 
  onSendMessage, 
  highlightedText,
  isLoading = false,
  onSaveChat,
  onClearHighlight
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const [showPrompts, setShowPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const content = input;
    setInput("");
    setShowPrompts(false);
    await onSendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setShowPrompts(false);
  };

  return (
    <div className="relative flex flex-col" style={{ height: "calc(100vh - 82px)" }}>
      {/* Chat Header */}
      {messages.length > 0 && onSaveChat && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-1.5 border-b border-[#2a2a2a] bg-[#1c1c1c]">
          <p className="text-[10px] text-[#666]">{messages.length} messages</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveChat}
            className="h-5 px-2 text-[10px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
          >
            <Save className="h-3 w-3 mr-1" />
            Save Chat
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
        <div className="p-3 space-y-3">
          {/* Original annotation context - only show if it's the first message and has highlightText */}
          {messages[0]?.role === "system" && messages[0]?.highlightText && (
            <div className="p-2 bg-[#2a2a2a] border-l-2 border-violet-500 rounded">
              <p className="text-[10px] text-[#999] leading-relaxed">{messages[0].content}</p>
            </div>
          )}

          {/* Additional highlighted text context - only show if different from original */}
          {highlightedText && (!messages[0]?.highlightText || highlightedText !== messages[0].highlightText) && (
            <div className="p-2 bg-[#2a2a2a] border-l-2 border-emerald-500/30 rounded">
              <p className="text-[10px] text-[#999] leading-relaxed">
                <span className="text-emerald-500/70 font-medium">Additional Context:</span> {highlightedText}
              </p>
            </div>
          )}

          {messages.length === 0 && showPrompts && (
            <div className="space-y-3 py-2">
              <div className="text-center">
                <Sparkles className="h-5 w-5 mx-auto mb-2 text-violet-500/70" />
                <h3 className="text-[11px] font-medium text-[#eee] mb-1">Research Assistant</h3>
                <p className="text-[10px] text-[#888]">Ask me anything about the paper</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className="p-2 text-[10px] bg-[#2a2a2a] hover:bg-[#333] rounded text-[#ccc] transition-colors duration-200 border border-[#333] hover:border-[#444] text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Only show non-system messages in the chat thread */}
          {messages.filter(m => m.role !== "system").map((message, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 ${
                message.role === "assistant" ? "bg-[#2a2a2a]" : ""
              } rounded p-2`}
            >
              <div 
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  message.role === "assistant" ? "bg-emerald-500/10" : "bg-violet-500/10"
                }`}
              >
                <span className={`text-[10px] ${
                  message.role === "assistant" ? "text-emerald-500" : "text-violet-500"
                }`}>
                  {message.role === "assistant" ? "AI" : "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-pre:bg-[#1c1c1c] prose-pre:border prose-pre:border-[#333]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({inline, className, children, ...props}: CodeProps) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            {...props}
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="text-[10px] !bg-[#1c1c1c] !p-2 rounded border border-[#333] overflow-x-auto max-w-full"
                            customStyle={{
                              margin: 0,
                              background: '#1c1c1c',
                              padding: '8px',
                            }}
                            wrapLongLines={true}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code {...props} className="bg-[#1c1c1c] px-1 py-0.5 rounded text-[10px]">
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <p className="text-[9px] text-[#666] mt-1">
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <span className="inline-block w-3 h-3 border-[1.5px] border-[#444] border-t-white rounded-full animate-spin" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-[#2a2a2a] bg-[#1c1c1c]">
        {highlightedText && highlightedText.trim() !== "" && (
          <div className="mb-2 p-2 bg-[#2a2a2a] border-l-2 border-violet-500/30 rounded relative group">
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            className="min-h-[45px] max-h-[120px] bg-transparent border-none text-[11px] resize-none pr-8 py-2.5 px-3 placeholder:text-[#666]"
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute bottom-2 right-2 h-5 px-2 bg-violet-600/75 hover:bg-violet-700 text-[8px] uppercase font-bold text-white"
          >
            {isLoading ? (
              <span className="inline-block w-3 h-3 border-[1.5px] border-[#444] text-white border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-white flex items-center gap-1">
                Submit
                <Send className="h-2.5 w-2.5" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}