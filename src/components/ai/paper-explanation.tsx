"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Loader2, Copy, ThumbsUp, ThumbsDown } from "lucide-react";

interface PaperExplanationProps {
  paperId: string;
  onAsk?: (question: string) => Promise<string>;
}

export function PaperExplanation({ paperId, onAsk }: PaperExplanationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const quickQuestions = [
    "What are the key concepts?",
    "Explain this in simpler terms",
    "Generate a summary",
    "What are the main findings?",
    "What are the limitations?",
    "How does this relate to other papers?",
  ];

  const handleAskQuestion = async (question: string) => {
    setIsLoading(true);
    setCurrentQuestion(question);
    try {
      const response = await onAsk?.(question);
      setExplanation(response || "");
    } catch (error) {
      console.error("Error getting explanation:", error);
      setExplanation("Sorry, I couldn't generate an explanation at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <Brain className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Ask about this paper</span>
      </div>

      {/* Quick questions */}
      <div className="grid gap-1.5">
        {quickQuestions.map((question) => (
          <Button
            key={question}
            variant="outline"
            className="justify-start h-8 px-2.5 text-xs font-normal"
            onClick={() => handleAskQuestion(question)}
            disabled={isLoading}
          >
            {question}
          </Button>
        ))}
      </div>

      {/* Response area */}
      {(isLoading || explanation) && (
        <Card className="p-3 mt-4">
          {currentQuestion && (
            <div className="text-xs font-medium mb-2">{currentQuestion}</div>
          )}
          
          {isLoading ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating explanation...
            </div>
          ) : explanation ? (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed">{explanation}</p>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
} 