import { BookMarked, FileText, Star, Calendar, Trash2, BookOpen, Loader2, MoreVertical, Pencil, MessageSquare, Plus } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Annotation } from "@/lib/types";
import { toast } from "react-hot-toast";


export interface PaperCardProps {
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
  context?: 'main' | 'reading-list' | 'discover' | 'category' | 'search';
  onAddToLibrary?: () => void;
  isAdding?: boolean;
  className?: string;
  annotations?: Annotation[];
  disableNavigation?: boolean;
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
  isAdding,
  className,
  annotations = [],
  disableNavigation = false
}: PaperCardProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(() => 
    paper.scheduled_date ? new Date(paper.scheduled_date) : undefined
  );
  const [estimatedTime, setEstimatedTime] = useState<string>(() => 
    paper.estimated_time?.toString() || ""
  );
  const [repeat, setRepeat] = useState<"daily" | "weekly" | "monthly" | "none">(() => 
    paper.repeat || "none"
  );
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoize state calculations to prevent unnecessary re-renders
  const isScheduled = !!paper.scheduled_date;
  const isInReadingList = paper.in_reading_list;

  // Determine button visibility based on context and paper state
  const shouldShowScheduleButton = showScheduleButton && (
    context === 'reading-list' || 
    context === 'main' ||
    (!isInReadingList && (context === 'discover' || context === 'search'))
  );

  const shouldShowAddToListButton = showAddToListButton && !isInReadingList && context !== 'reading-list';
  const shouldShowCategoryButton = showCategoryButton && (isInReadingList || paper.category);
  const shouldShowAddToLibrary = context === 'search' && !paper.in_reading_list;

  // Handle estimated time validation
  const handleEstimatedTimeChange = (value: string) => {
    const numValue = parseInt(value);
    if (value === "" || (!isNaN(numValue) && numValue > 0)) {
      setEstimatedTime(value);
    }
  };

  // Handle card click based on context
  const handleCardClick = () => {
    if (!disableNavigation) {
      router.push(`/paper/${paper.id}`);
    }
  };

  const handleSchedule = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || !date || !onSchedule) return;
    
    const estimatedMinutes = estimatedTime ? parseInt(estimatedTime) : undefined;
    onSchedule(date, estimatedMinutes, repeat);
    setOpen(false);
  };

  const handleAddToList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || isProcessing || !onAddToList) return;
    
    try {
      setIsProcessing(true);
      await onAddToList();
    } catch (error) {
      console.error('Error adding paper:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || isAdding || !onAddToLibrary) return;
    onAddToLibrary();
  };

  // Update state when paper prop changes
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
      className={className}
    >
      <Card 
        className={cn(
          "bg-[#0A192F] overflow-hidden cursor-pointer transition-all duration-200 group relative",
          "hover:shadow-lg border-[#1E3A8A]/30",
          variant === 'compact' 
            ? 'p-3 flex flex-col min-h-[100px] max-h-[120px]' 
            : 'p-4 flex flex-col min-h-[160px]',
          !disableNavigation && "cursor-pointer",
          className || ''
        )}
        onClick={handleCardClick}
      >
        {/* Top metadata row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Badge 
              variant="secondary" 
              className={cn(
                "px-1.5 py-0.5 font-medium rounded-md",
                variant === 'compact' ? 'text-[9px]' : 'text-[10px]',
                paper.impact === "high"
                  ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20"
                  : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
              )}
            >
              {paper.impact === "high" ? "High Impact" : "Low Impact"}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-[#4a5578]",
                variant === 'compact' ? 'text-[9px]' : 'text-[10px]'
              )}>{paper.year}</span>
              <span className={cn(
                "text-[#4a5578]",
                variant === 'compact' ? 'text-[9px]' : 'text-[10px]'
              )}>•</span>
              <span className={cn(
                "text-[#4a5578]",
                variant === 'compact' ? 'text-[9px]' : 'text-[10px]'
              )}>{paper.citations} citations</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-[#1E3A8A]/20 rounded-full"
              >
                <MoreVertical className="h-3.5 w-3.5 text-[#4a5578]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-[#0A192F] border-[#1E3A8A]">
              {shouldShowCategoryButton && (
                <DropdownMenuItem
                  className="text-[#4a5578] hover:text-white hover:bg-[#1E3A8A]/20 cursor-pointer text-[11px]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChangeCategory?.();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit Category
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer text-[11px]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className={cn(
            "font-medium leading-tight transition-colors mb-1",
            variant === 'compact' 
              ? 'text-xs line-clamp-2 text-[#E2E8F0] group-hover:text-[#38BDF8]' 
              : 'text-sm line-clamp-2 text-[#F8FAFC] group-hover:text-[#60A5FA]'
          )}>
            {paper.title}
          </h3>
          
          <p className={cn(
            "mb-2",
            variant === 'compact' 
              ? 'text-[9px] line-clamp-1 text-[#4a5578]' 
              : 'text-xs line-clamp-1 text-[#4a5578]'
          )}>
            {paper.authors.join(", ")}
          </p>

          {paper.abstract && variant !== 'compact' && (
            <p className="text-xs text-[#4a5578] line-clamp-2 leading-relaxed mb-3">
              {paper.abstract}
            </p>
          )}
          
          {variant !== 'compact' && paper.topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mb-3">
              {paper.topics.slice(0, 3).map((topic, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-[#1E3A8A]/10 text-[#4a5578] text-[9px] px-1.5 py-0.5 rounded-md"
                >
                  {topic}
                </Badge>
              ))}
              {paper.topics.length > 3 && (
                <span className="text-[9px] text-[#4a5578]">
                  +{paper.topics.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-auto" onClick={(e) => e.stopPropagation()}>
            {shouldShowScheduleButton && onSchedule && (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 gap-1.5 px-2 text-[10px] hover:bg-[#1E3A8A]/20",
                      isScheduled ? "text-[#60A5FA]" : "text-[#4a5578]"
                    )}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Calendar className="h-3 w-3" />
                    )}
                    {isScheduled ? "Scheduled" : "Schedule"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-[#0A192F] border-[#1E3A8A]"
                >
                  <div className="p-3">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <CalendarComponent
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            if (newDate) setDate(newDate);
                          }}
                          className="rounded-md border border-[#1E3A8A]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Input
                          type="number"
                          placeholder="Estimated time (minutes)"
                          value={estimatedTime}
                          onChange={(e) => handleEstimatedTimeChange(e.target.value)}
                          className="h-7 text-[11px] bg-[#0A192F] border-[#1E3A8A] text-white placeholder:text-[#4a5578]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Select value={repeat} onValueChange={setRepeat}>
                          <SelectTrigger className="h-7 text-[11px] bg-[#0A192F] border-[#1E3A8A] text-white">
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
                        className="w-full h-7 text-[11px] bg-[#1E3A8A] hover:bg-[#2D4A9E] text-white"
                        onClick={handleSchedule}
                        disabled={!date}
                      >
                        Schedule Paper
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {shouldShowAddToListButton && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 text-[10px] font-medium hover:bg-[#1E3A8A]/20 rounded-md ml-auto",
                  paper.in_reading_list 
                    ? "text-blue-400 hover:text-blue-300" 
                    : "text-[#4a5578] hover:text-white"
                )}
                onClick={handleAddToList}
                disabled={isProcessing || paper.in_reading_list}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Adding...
                  </>
                ) : paper.in_reading_list ? (
                  <>
                    <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                    In Library
                  </>
                ) : context === 'search' ? (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add to Library
                  </>
                ) : (
                  <>
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    Add to List
                  </>
                )}
              </Button>
            )}

            {annotations && annotations.length > 0 && (
              <div className="flex items-center gap-1 text-[#4a5578] ml-auto">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-[10px]">{annotations.length}</span>
              </div>
            )}
          </div>
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