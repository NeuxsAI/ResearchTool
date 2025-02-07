import { BookMarked, FileText, Star, Calendar } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  category_id?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  repeat?: "daily" | "weekly" | "monthly" | "none";
  in_reading_list?: boolean;
}

interface PaperCardProps {
  paper: Paper;
  onAddToList?: () => void;
  onSchedule?: (date: Date, estimatedTime?: number, repeat?: "daily" | "weekly" | "monthly" | "none") => void;
  onChangeCategory?: () => void;
  isLoading?: boolean;
}

export function PaperCard({ paper, onAddToList, onSchedule, onChangeCategory, isLoading }: PaperCardProps) {
  const [date, setDate] = useState<Date>();
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [repeat, setRepeat] = useState<"daily" | "weekly" | "monthly" | "none">("none");
  const [open, setOpen] = useState(false);

  // Initialize scheduled state from paper prop
  const isScheduled = !!paper.scheduled_date;

  const handleAddToList = (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation();
    onAddToList?.();
  };

  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (date && onSchedule) {
      onSchedule(date, estimatedTime ? parseInt(estimatedTime) : undefined, repeat);
      setOpen(false);
    }
  };

  // Set initial date if paper is scheduled
  useEffect(() => {
    if (paper.scheduled_date) {
      setDate(new Date(paper.scheduled_date));
      setEstimatedTime(paper.estimated_time?.toString() || "");
      setRepeat(paper.repeat || "none");
    }
  }, [paper.scheduled_date, paper.estimated_time, paper.repeat]);

  return (
    <motion.div 
      whileHover={{ scale: 0.99 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className={cn(
        "p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer border-[#2a2a2a] min-h-[150px] flex flex-col",
        isLoading && "opacity-50 pointer-events-none"
      )}>
        <div className="flex items-start gap-4 flex-grow">
          <div className="flex-shrink-0 w-10 h-10 rounded bg-[#2a2a2a] flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#666]" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-sm font-medium text-white leading-tight mb-1 line-clamp-2">
                  {paper.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-[#666]">
                  {paper.category && (
                    <span className="flex items-center gap-1.5">
                      <div 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: paper.category.color || '#666' }}
                      />
                      {paper.category.name}
                    </span>
                  )}
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
          </div>
        </div>

        {/* Fixed button container at bottom */}
        <div 
          className="flex items-center justify-end gap-2 mt-1 pt-2"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {onSchedule && (
            <Popover 
              open={open} 
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-[11px] hover:bg-[#333] text-white",
                    isScheduled ? "bg-violet-500/10 text-violet-500" : "bg-[#2a2a2a]"
                  )}
                  onClick={(e) => {
                    if (isLoading) return;
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true);
                  }}
                  disabled={isLoading}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {isScheduled ? 'Scheduled' : 'Schedule'}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0" 
                align="end"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <div className="p-3">
                  <div className="space-y-2">
                    <div>
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Est. time (min)"
                          className="h-8 text-xs"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(e.target.value)}
                        />
                      </div>
                      <Select value={repeat} onValueChange={(value: any) => setRepeat(value)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Repeat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No repeat</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full h-8 text-xs"
                      onClick={handleSchedule}
                      disabled={!date}
                    >
                      {isScheduled ? 'Update Schedule' : 'Schedule Paper'}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {paper.category ? (
            onChangeCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11px] hover:bg-[#333] bg-[#2a2a2a] text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChangeCategory();
                }}
                disabled={isLoading}
              >
                <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                Change Category
              </Button>
            )
          ) : (
            onAddToList && !paper.in_reading_list && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11px] hover:bg-[#333] bg-[#2a2a2a] text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleAddToList(e);
                }}
                disabled={isLoading}
              >
                <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                Add to list
              </Button>
            )
          )}
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