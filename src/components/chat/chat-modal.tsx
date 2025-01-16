"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, X, Minus, Square } from "lucide-react";
import { Rnd } from "react-rnd";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightedText?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  "Explain this concept",
  "Simplify this",
  "How does this relate to other concepts?",
  "What are the key implications?",
  "Give me an example",
];

export function ChatModal({ open, onOpenChange, highlightedText }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const lastPosition = useRef({ x: 100, y: 100 });
  const lastSize = useRef({ width: 500, height: 600 });

  useEffect(() => {
    if (!highlightedText && open) {
      onOpenChange(false);
    }
  }, [highlightedText, open, onOpenChange]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages([...messages, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          highlightedText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  if (!open || !highlightedText) return null;

  return (
    <Rnd
      default={{
        x: 100,
        y: 100,
        width: 500,
        height: 600,
      }}
      minWidth={400}
      minHeight={400}
      bounds="window"
      dragHandleClassName="chat-window-header"
      position={isMaximized ? { x: 0, y: 0 } : undefined}
      size={isMaximized ? { width: window.innerWidth, height: window.innerHeight } : undefined}
      onDragStop={(e, d) => {
        if (!isMaximized) {
          lastPosition.current = { x: d.x, y: d.y };
        }
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        if (!isMaximized) {
          lastSize.current = {
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          };
          lastPosition.current = position;
        }
      }}
      disableDragging={isMaximized}
      className="fixed z-50 bg-[#1c1c1c] rounded-lg border border-[#2a2a2a] shadow-lg overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="chat-window-header flex items-center justify-between p-4 border-b border-[#2a2a2a] cursor-move bg-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-white">Chat Assistant</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 hover:bg-[#333]"
              onClick={() => setIsMaximized(false)}
            >
              <Minus className="h-4 w-4 text-[#666]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 hover:bg-[#333]"
              onClick={toggleMaximize}
            >
              <Square className="h-3 w-3 text-[#666]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 hover:bg-[#333]"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 text-[#666]" />
            </Button>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-b border-[#2a2a2a] flex gap-2 flex-wrap">
          {quickPrompts.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-[#2a2a2a] border-[#333] hover:bg-[#333]"
              onClick={() => handleQuickPrompt(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {highlightedText && (
            <div className="mb-4 p-3 bg-[#2a2a2a] rounded-lg border border-[#333]">
              <p className="text-sm text-[#888]">{highlightedText}</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "assistant"
                    ? "bg-[#2a2a2a] text-white"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-[#2a2a2a]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#666] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#666] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-[#666] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="min-h-[80px] max-h-[160px] bg-[#2a2a2a] border-[#333] text-sm resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Rnd>
  );
} 