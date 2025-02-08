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
import { Paper } from "@/lib/types";
import { useRouter } from "next/navigation";


interface PaperCardProps {
  paper: Paper;
  onAddToList?: () => void;
  onSchedule?: (date: Date, estimatedTime?: number, repeat?: "daily" | "weekly" | "monthly" | "none") => void;
  onChangeCategory?: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'compact';
  showScheduleButton?: boolean;
  showCategoryButton?: boolean;
  showAddToListButton?: boolean;
  context?: 'main' | 'reading-list' | 'discover';
}

export function PaperCard({ 
  paper, 
  onAddToList, 
  onSchedule, 
  onChangeCategory, 
  isLoading,
  variant = 'default',
  showScheduleButton = true,
  showCategoryButton = true,
  showAddToListButton = true,
  context = 'main'
}: PaperCardProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date>();
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [repeat, setRepeat] = useState<"daily" | "weekly" | "monthly" | "none">("none");
  const [open, setOpen] = useState(false);

  // Initialize scheduled state from paper prop
  const isScheduled = !!paper.scheduled_date;
  const isInReadingList = paper.in_reading_list;

  // Determine button visibility based on context and paper state
  const shouldShowScheduleButton = showScheduleButton && (
    context === 'reading-list' || 
    (!isInReadingList && context === 'discover') ||
    (!isScheduled && context === 'main')
  );

  const shouldShowAddToListButton = showAddToListButton && !isInReadingList;
  const shouldShowCategoryButton = showCategoryButton && (isInReadingList || paper.category);

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
      whileHover={{ scale: 0.995 }}
      whileTap={{ scale: 0.995 }}
    >
      <Card 
        onClick={() => router.push(`/paper/${paper.id}`)}
        className={cn(
          "p-4 hover:bg-[#1c1c1c] transition-colors cursor-pointer border-[#2a2a2a] min-h-[150px] flex flex-col",
          variant === 'compact' ? "m-0" : "m-3", 
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-start gap-4 flex-grow">
          <div className="flex-shrink-0 w-10 h-10 rounded bg-[#2a2a2a] flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#666]" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-white leading-tight mb-1 line-clamp-2">
                  {paper.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-[#666] flex-wrap">
                  {paper.category && (
                    <span className="flex items-center gap-1.5 min-w-0">
                      <div 
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: paper.category.color || '#666' }}
                      />
                      <span className="truncate">{paper.category.name}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Star className="h-3 w-3 flex-shrink-0" />
                    {paper.citations} citations
                  </span>
                  <span className="whitespace-nowrap">{paper.year}</span>
                  {paper.institution && (
                    <span className="truncate max-w-[200px]">{paper.institution}</span>
                  )}
                </div>
              </div>
              <Badge 
                className={cn(
                  "h-5 px-1.5 text-[10px] whitespace-nowrap flex-shrink-0",
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
                  className="bg-[#2a2a2a] hover:bg-[#333] text-[10px] px-1.5 py-0 text-[#888] truncate max-w-[150px]"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 mt-3">
          {isScheduled && (
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-[10px] bg-violet-500/10 text-violet-500"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Scheduled
            </Badge>
          )}
          {isInReadingList && (
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-[10px] bg-blue-500/10 text-blue-500"
            >
              <BookMarked className="h-3 w-3 mr-1" />
              In Reading List
            </Badge>
          )}
          {paper.status && (
            <Badge 
              variant="secondary" 
              className={cn(
                "h-5 px-1.5 text-[10px]",
                paper.status === 'completed' && "bg-green-500/10 text-green-500",
                paper.status === 'in_progress' && "bg-yellow-500/10 text-yellow-500",
                paper.status === 'unread' && "bg-gray-500/10 text-gray-500"
              )}
            >
              {paper.status === 'completed' ? 'Read' : 
               paper.status === 'in_progress' ? 'Reading' : 'Unread'}
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div 
          className="flex items-center justify-end gap-2 mt-3 pt-3"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {shouldShowScheduleButton && onSchedule && (
            <Popover 
              open={open} 
              onOpenChange={setOpen}
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
                  {isScheduled ? 'Update Schedule' : 'Schedule'}
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

          {shouldShowCategoryButton && onChangeCategory && (
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
              {paper.category ? 'Change Category' : 'Add Category'}
            </Button>
          )}

          {shouldShowAddToListButton && onAddToList && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[11px] hover:bg-[#333] bg-[#2a2a2a] text-white"
              onClick={handleAddToList}
              disabled={isLoading}
            >
              <BookMarked className="h-3.5 w-3.5 mr-1.5" />
              Add to List
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function PaperCardSkeleton() {
  return (
    <div className="p-3">
      <Card className="p-4 border-[#2a2a2a] min-h-[150px]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded bg-[#2a2a2a] animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 bg-[#2a2a2a] rounded w-3/4 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-3 bg-[#2a2a2a] rounded w-20 animate-pulse" />
              <div className="h-3 bg-[#2a2a2a] rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}