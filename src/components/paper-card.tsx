import { BookMarked, FileText, Star, Calendar, Trash2, BookOpen, Loader2 } from "lucide-react";
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
  onDelete?: () => void;
  onChangeCategory?: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'compact';
  showScheduleButton?: boolean;
  showCategoryButton?: boolean;
  showAddToListButton?: boolean;
  context?: 'main' | 'reading-list' | 'discover';
  onAddToLibrary?: (paper: Paper) => Promise<void>;
  isAdding?: boolean;
}

export function PaperCard({ 
  paper, 
  onAddToList, 
  onSchedule, 
  onDelete,
  onChangeCategory, 
  isLoading,
  variant = 'default',
  showScheduleButton = true,
  showCategoryButton = true,
  showAddToListButton = true,
  context = 'main',
  onAddToLibrary,
  isAdding
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
        className="bg-[#1c1c1c] border-[#2a2a2a] overflow-hidden cursor-pointer hover:border-[#3a3a3a] transition-all duration-200 group"
        onClick={() => router.push(`/paper/${paper.id}`)}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge 
              variant="secondary" 
              className={
                paper.impact === "high"
                  ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs font-medium"
                  : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium"
              }
            >
              {paper.impact === "high" ? "High Impact" : "Low Impact"}
            </Badge>
            <div className="flex items-center gap-1.5 text-[#666]">
              <span className="text-xs">{paper.year}</span>
              <span className="text-xs">•</span>
              <span className="text-xs">{paper.citations} citations</span>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-white mb-1.5 leading-snug group-hover:text-violet-400 transition-colors line-clamp-2">
            {paper.title}
          </h3>
          
          <p className="text-xs text-[#888] mb-3 line-clamp-1">
            {paper.authors.join(", ")}
          </p>

          {paper.abstract && (
            <p className="text-xs text-[#888] mb-3 line-clamp-2 leading-relaxed">
              {paper.abstract}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-1">
            {paper.topics.slice(0, 3).map((topic, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-[#2a2a2a]/50 text-[#888] text-[10px] px-1.5 py-0"
              >
                {topic}
              </Badge>
            ))}
            {paper.topics.length > 3 && (
              <span className="text-[10px] text-[#666]">
                +{paper.topics.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Status indicators */}
        {(isScheduled || isInReadingList || paper.status) && (
          <div className="px-4 py-2 border-t border-[#2a2a2a] flex items-center gap-1.5">
            {isScheduled && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-violet-500/10 text-violet-400">
                <Calendar className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
            )}
            {isInReadingList && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] text-blue-400">
                <BookMarked className="h-3 w-3 mr-1" />
                In List
              </Badge>
            )}
            {paper.status && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-4 px-1.5 text-[10px]",
                  paper.status === 'completed' && "bg-green-500/10 text-green-400",
                  paper.status === 'in_progress' && "bg-yellow-500/10 text-yellow-400",
                  paper.status === 'unread' && "bg-gray-500/10 text-gray-400"
                )}
              >
                {paper.status === 'completed' ? 'Read' : 
                 paper.status === 'in_progress' ? 'Reading' : 'Unread'}
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div 
          className="px-4 py-2 border-t border-[#2a2a2a] flex items-center gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {shouldShowScheduleButton && onSchedule && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-[10px]",
                    isScheduled ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" : "bg-[#2a2a2a] hover:bg-[#333] text-white"
                  )}
                  onClick={(e) => {
                    if (isLoading) return;
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true);
                  }}
                  disabled={isLoading}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {isScheduled ? 'Update' : 'Schedule'}
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
              className="h-6 px-2 text-[10px] hover:bg-[#333] bg-[#2a2a2a] text-white"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChangeCategory();
              }}
              disabled={isLoading}
            >
              <BookMarked className="h-3 w-3 mr-1" />
              Category
            </Button>
          )}

          {shouldShowAddToListButton && onAddToList && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] hover:bg-[#333] bg-[#2a2a2a] text-white"
              onClick={handleAddToList}
              disabled={isLoading}
            >
              <BookMarked className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}

          {context === "main" && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 px-2 text-[10px] text-red-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}

          {onAddToLibrary && (
            <Button
              variant="secondary"
              size="sm"
              className={`h-6 px-2 text-[10px] font-medium transition-colors ml-auto
                ${isAdding 
                  ? 'bg-[#2a2a2a] text-[#888]' 
                  : paper.in_reading_list 
                  ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                  : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                }`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToLibrary(paper);
              }}
              disabled={isAdding || paper.in_reading_list}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Adding...
                </>
              ) : paper.in_reading_list ? (
                <>
                  <FileText className="h-3 w-3 mr-1" />
                  In Library
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3 mr-1" />
                  Add
                </>
              )}
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