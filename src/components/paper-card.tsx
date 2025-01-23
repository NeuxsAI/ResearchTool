import { BookMarked, FileText, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export interface Paper {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  year: number;
  citations: number;
  institution?: string;
  impact: "high" | "low";
  url: string;
  topics: string[];
  scheduled_date?: string;
  estimated_time?: number;
}

interface PaperCardProps {
  paper: Paper;
  onAddToList: () => void;
}

export function PaperCard({ paper, onAddToList }: PaperCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className="p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer border-[#2a2a2a]">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded bg-[#2a2a2a] flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#666]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-sm font-medium text-white leading-tight mb-1">
                  {paper.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-[#666]">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {paper.citations} citations
                  </span>
                  <span>{paper.year}</span>
                  {paper.institution && <span>{paper.institution}</span>}
                </div>
              </div>
              <Badge 
                className={cn(
                  "h-5 px-1.5 text-[10px] shrink-0",
                  paper.impact === "high" 
                    ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20"
                    : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                )}
              >
                {paper.impact === "high" ? "High Impact" : "Low Impact"}
              </Badge>
            </div>
            {paper.abstract && (
              <p className="text-xs text-[#888] mb-3 line-clamp-2 leading-relaxed">
                {paper.abstract}
              </p>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {paper.topics.map((topic) => (
                  <Badge 
                    key={topic}
                    variant="secondary" 
                    className="bg-[#2a2a2a] hover:bg-[#333] text-[10px] px-1.5 py-0 text-[#888]"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11px] hover:bg-[#333] text-white bg-[#2a2a2a]"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToList();
                }}
              >
                <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                Add to list
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function PaperCardSkeleton() {
  return (
    <Card className="p-3 border-[#2a2a2a]">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded bg-[#2a2a2a]" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 bg-[#2a2a2a] rounded w-2/3" />
          <div className="h-4 bg-[#2a2a2a] rounded w-full" />
          <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
        </div>
      </div>
    </Card>
  );
} 