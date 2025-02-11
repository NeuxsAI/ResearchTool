"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getReadingList, getPapers, getCategories, addToReadingList, schedulePaper, deletePaper, updatePaper } from "@/lib/supabase/db";
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronDown, 
  List, 
  CalendarDays, 
  BookOpen, 
  Activity,
  BookMarked,
  Grid2x2,
  Plus,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Paper } from "@/lib/types";
import { PaperCard, PaperCardSkeleton } from "@/components/paper-card";
import { SelectSingleEventHandler } from "react-day-picker";
import { cache, CACHE_KEYS } from '@/lib/cache';
import { DeletePaperDialog } from "@/components/library/delete-paper-dialog";
import { toast } from "sonner";

// Interface for Supabase data
interface SupabasePaper {
  id: string;
  title?: string;
  abstract?: string;
  authors?: string[];
  year?: number;
  institution?: string;
  url?: string;
  scheduled_date?: string;
  estimated_time?: number;
  category_id?: string;
}

interface ReadingListItem {
  id: string;
  paper_id: string;
  added_at: string;
  scheduled_date?: string;
  estimated_time?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

const loadingVariants = {
  animate: {
    opacity: [0.5, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }
};

// Preload function for parallel data fetching
async function preloadData(refresh = false) {
  const cachedPapers = !refresh && cache.get<Paper[]>(CACHE_KEYS.PAPERS);
  const cachedReadingList = !refresh && cache.get<ReadingListItem[]>(CACHE_KEYS.READING_LIST);
  
  if (cachedPapers && cachedReadingList) {
    return {
      papers: cachedPapers,
      readingList: cachedReadingList,
    };
  }

  // First get reading list and papers in parallel
  const [readingListResult, papersResult] = await Promise.all([
    getReadingList(),
    getPapers()
  ]);

  const readingList = readingListResult.data || [];
  const papers = papersResult.data || [];

  // Create a map of paper IDs to their reading list status
  const readingListMap = new Map(
    readingList.map(item => [item.paper_id, item])
  );

  // Enhance papers with reading list information
  const enhancedPapers = papers.map(paper => ({
    ...paper,
    citations: paper.citations || 0,
    in_reading_list: readingListMap.has(paper.id),
    scheduled_date: readingListMap.get(paper.id)?.scheduled_date,
    estimated_time: readingListMap.get(paper.id)?.estimated_time,
    repeat: readingListMap.get(paper.id)?.repeat,
    status: readingListMap.get(paper.id)?.status || 'unread'
  })) as Paper[];

  if (!refresh) {
    cache.set(CACHE_KEYS.PAPERS, enhancedPapers);
    cache.set(CACHE_KEYS.READING_LIST, readingList);
  }

  return { papers: enhancedPapers, readingList };
}

export default function ReadingListPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [papers, setPapers] = useState<Paper[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule">("schedule");
  const [scheduledViewMode, setScheduledViewMode] = useState<'calendar' | 'grid'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingTopics, setEditingTopics] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState("");

  const loadData = async (refresh = false) => {
    try {
      setIsLoading(true);
      const { papers, readingList } = await preloadData(refresh);
      if (papers) setPapers(papers);
      if (readingList) setReadingList(readingList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to load from cache first
    const cachedPapers = cache.get<Paper[]>(CACHE_KEYS.PAPERS);
    const cachedReadingList = cache.get<ReadingListItem[]>(CACHE_KEYS.READING_LIST);
    
    if (cachedPapers && cachedReadingList) {
      setPapers(cachedPapers);
      setReadingList(cachedReadingList);
      setIsLoading(false);
    } else {
      loadData(false);
    }
  }, []);

  const handlePaperClick = (paper: Paper) => {
    router.push(`/paper/${paper.id}`);
  };

  const handleAddToList = async (paper: Paper) => {
    setIsLoading(true);
    try {
      const result = await addToReadingList(paper.id);
      
      if (result.error) {
        throw result.error;
      }

      // Update papers list
      setPapers(prevPapers => 
        prevPapers.map(p => 
          p.id === paper.id 
            ? { ...p, in_reading_list: true }
            : p
        )
      );

      // Update reading list
      setReadingList(prevList => [
        ...prevList,
        {
          id: result.data?.id || '',
          paper_id: paper.id,
          added_at: new Date().toISOString(),
          scheduled_date: undefined,
          estimated_time: undefined
        }
      ]);

      toast.success("Paper added to reading list");
      
      // Refresh the data to ensure everything is in sync
      await loadData(true);
    } catch (error) {
      console.error('Error adding paper to reading list:', error);
      toast.error("Failed to add paper to reading list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedulePaper = async (
    paper: Paper,
    scheduledDate: Date,
    estimatedTime?: number,
    repeat?: "daily" | "weekly" | "monthly" | "none"
  ) => {
    console.log('handleSchedulePaper called with:', { paper, scheduledDate, estimatedTime, repeat });
    try {
      console.log('Calling schedulePaper...');
      const result = await schedulePaper(paper.id, scheduledDate, estimatedTime, repeat);
      console.log('schedulePaper result:', result);
      
      // Refresh both papers and reading list
      console.log('Refreshing data...');
      const [papersResult, readingListResult, categoriesResult] = await Promise.all([
        getPapers(),
        getReadingList(),
        getCategories()
      ]);
      console.log('Data refresh results:', { papersResult, readingListResult });

      // Update papers with reading list information
      const updatedPapers = (papersResult.data || []).map(p => {
        const readingListItem = readingListResult.data?.find(r => r.paper_id === p.id);
        const category = categoriesResult.data?.find(c => c.id === p.category_id);
        
        return {
          id: p.id,
          title: p.title || "",
          abstract: p.abstract,
          authors: p.authors || [],
          year: p.year || new Date().getFullYear(),
          citations: 0,
          impact: "low" as const,
          url: p.url || `https://example.com/paper/${p.id}`,
          topics: [],
          category_id: p.category_id,
          category: category ? {
            id: category.id,
            name: category.name,
            color: category.color
          } : undefined,
          scheduled_date: readingListItem?.scheduled_date,
          estimated_time: readingListItem?.estimated_time,
          repeat: readingListItem?.repeat,
          in_reading_list: Boolean(readingListItem)
        } as Paper;
      });

      setPapers(updatedPapers);
      setReadingList(readingListResult.data || []);
    } catch (error) {
      console.error('Error scheduling paper:', error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const todaysPapers = papers.filter(paper => {
    if (!paper.scheduled_date) return false;
    const scheduledDate = new Date(paper.scheduled_date);
    const today = new Date();
    
    // Check if it's scheduled for today
    if (format(scheduledDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return true;
    }
    
    // Check if it's a repeating paper
    if (paper.repeat) {
      const daysSinceScheduled = Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (paper.repeat) {
        case 'daily':
          return true;
        case 'weekly':
          return daysSinceScheduled % 7 === 0;
        case 'monthly':
          return scheduledDate.getDate() === today.getDate();
        default:
          return false;
      }
    }
    
    return false;
  });

  const thisWeeksPapers = papers.filter(paper => {
    if (!paper.scheduled_date) return false;
    const scheduledDate = new Date(paper.scheduled_date);
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    
    // For non-repeating papers, only include if they're scheduled for this week
    if (!paper.repeat) {
      return isWithinInterval(scheduledDate, { start: weekStart, end: weekEnd });
    }
    
    // For repeating papers
    switch (paper.repeat) {
      case 'daily':
        return true;
      case 'weekly': {
        // Calculate the next occurrence after weekStart
        const daysSinceScheduled = Math.floor((weekStart.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysToAdd = 7 - (daysSinceScheduled % 7);
        const nextOccurrence = new Date(weekStart);
        nextOccurrence.setDate(nextOccurrence.getDate() + daysToAdd);
        return isWithinInterval(nextOccurrence, { start: weekStart, end: weekEnd });
      }
      case 'monthly': {
        // Check if the monthly date falls within this week
        const monthlyDate = new Date(today.getFullYear(), today.getMonth(), scheduledDate.getDate());
        return isWithinInterval(monthlyDate, { start: weekStart, end: weekEnd });
      }
      default:
        return false;
    }
  });

  const upcomingPapers = papers.filter(p => {
    if (!p.scheduled_date) return false;
    const scheduledDate = new Date(p.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Only include papers scheduled for future dates
    if (scheduledDate < today) return false;
    
    // For repeating papers, calculate next occurrence
    if (p.repeat) {
      switch (p.repeat) {
        case 'daily':
          return true;
        case 'weekly': {
          const daysSinceScheduled = Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysUntilNext = 7 - (daysSinceScheduled % 7);
          return daysUntilNext > 0;
        }
        case 'monthly': {
          const nextOccurrence = new Date(today.getFullYear(), today.getMonth(), scheduledDate.getDate());
          if (nextOccurrence < today) {
            nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
          }
          return nextOccurrence >= today;
        }
        default:
          return false;
      }
    }
    
    return scheduledDate >= today;
  });

  const handleDeletePaper = async (paper: Paper) => {
    setPaperToDelete(paper);
  };

  const handleConfirmDelete = async () => {
    if (!paperToDelete) return;

    try {
      setIsDeleting(true);
      const result = await deletePaper(paperToDelete.id);
      
      if (result.error) {
        throw result.error;
      }

      // Update local state
      setPapers(prevPapers => prevPapers.filter(p => p.id !== paperToDelete.id));
      setReadingList(prevList => prevList.filter(item => item.paper_id !== paperToDelete.id));
      toast.success("Paper deleted successfully");
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to delete paper");
    } finally {
      setIsDeleting(false);
      setPaperToDelete(null);
    }
  };

  const handleAddTopic = async (paperId: string) => {
    if (!newTopic.trim()) return;
    
    try {
      const paperToUpdate = papers.find(p => p.id === paperId);
      if (!paperToUpdate) return;

      const updatedTopics = [...(paperToUpdate.topics || []), newTopic.trim()];
      
      // Update paper
      await updatePaper(paperId, {
        ...paperToUpdate,
        topics: updatedTopics
      });

      // Update local state
      setPapers(prevPapers => prevPapers.map(p => 
        p.id === paperId ? { ...p, topics: updatedTopics } : p
      ));
      
      setNewTopic("");
      toast.success("Topic added");
    } catch (error) {
      console.error("Error adding topic:", error);
      toast.error("Failed to add topic");
    }
  };

  const handleRemoveTopic = async (paperId: string, topicToRemove: string) => {
    try {
      const paperToUpdate = papers.find(p => p.id === paperId);
      if (!paperToUpdate) return;

      const updatedTopics = paperToUpdate.topics?.filter(t => t !== topicToRemove) || [];
      
      // Update paper
      await updatePaper(paperId, {
        ...paperToUpdate,
        topics: updatedTopics
      });

      // Update local state
      setPapers(prevPapers => prevPapers.map(p => 
        p.id === paperId ? { ...p, topics: updatedTopics } : p
      ));
      
      toast.success("Topic removed");
    } catch (error) {
      console.error("Error removing topic:", error);
      toast.error("Failed to remove topic");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 border-b border-[#1a1f2e] bg-[#030014]">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-white">Reading List</h1>
                <p className="text-xs text-[#4a5578]">Schedule and manage your research reading</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex">
          {/* Left Panel - Schedule */}
          <div className="w-[260px] border-r border-[#1a1f2e] bg-[#030014] overflow-y-auto">
            <div className="p-3">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-[#4a5578] flex items-center mb-2">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Today
                  </h3>
                  {todaysPapers.length === 0 ? (
                    <p className="text-[11px] text-[#4a5578] px-2">No papers scheduled for today</p>
                  ) : (
                    <ScrollArea className="h-[120px]">
                      {todaysPapers.map(paper => (
                        <div 
                          key={paper.id} 
                          className="text-[11px] hover:bg-[#2a2a2a] rounded cursor-pointer text-white group py-1.5 px-2 mb-1 last:mb-0"
                          onClick={() => handlePaperClick(paper)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {paper.scheduled_date && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-violet-500/10 text-violet-500 shrink-0">
                                  {format(new Date(paper.scheduled_date), 'h:mm a')}
                                </Badge>
                              )}
                              {paper.estimated_time && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-blue-500/10 text-blue-500 shrink-0">
                                  {paper.estimated_time}m
                                </Badge>
                              )}
                              {paper.repeat && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-500 shrink-0">
                                  {paper.repeat}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] font-medium leading-snug line-clamp-2 text-white/90">
                              {paper.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-medium text-[#4a5578] flex items-center mb-2">
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                    This Week
                  </h3>
                  {thisWeeksPapers.length === 0 ? (
                    <p className="text-[11px] text-[#4a5578] px-2">No papers scheduled this week</p>
                  ) : (
                    <ScrollArea className="h-[120px]">
                      {thisWeeksPapers.map(paper => (
                        <div 
                          key={paper.id} 
                          className="text-[11px] hover:bg-[#2a2a2a] rounded cursor-pointer text-white group py-1.5 px-2 mb-1 last:mb-0"
                          onClick={() => handlePaperClick(paper)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {paper.scheduled_date && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-violet-500/10 text-violet-500 shrink-0">
                                  {format(new Date(paper.scheduled_date), 'MMM d')}
                                </Badge>
                              )}
                              {paper.estimated_time && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-blue-500/10 text-blue-500 shrink-0">
                                  {paper.estimated_time}m
                                </Badge>
                              )}
                              {paper.repeat && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-500 shrink-0">
                                  {paper.repeat}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] font-medium leading-snug line-clamp-2 text-white/90">
                              {paper.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-medium text-[#4a5578] flex items-center mb-2">
                    <Activity className="h-3.5 w-3.5 mr-1.5" />
                    Upcoming
                  </h3>
                  {upcomingPapers.length === 0 ? (
                    <p className="text-[11px] text-[#4a5578] px-2">No upcoming papers</p>
                  ) : (
                    <ScrollArea className="h-[120px]">
                      {upcomingPapers.map(paper => (
                        <div 
                          key={paper.id} 
                          className="text-[11px] hover:bg-[#2a2a2a] rounded cursor-pointer text-white group py-1.5 px-2 mb-1 last:mb-0"
                          onClick={() => handlePaperClick(paper)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {paper.scheduled_date && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-violet-500/10 text-violet-500 shrink-0">
                                  {format(new Date(paper.scheduled_date), 'MMM d')}
                                </Badge>
                              )}
                              {paper.estimated_time && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-blue-500/10 text-blue-500 shrink-0">
                                  {paper.estimated_time}m
                                </Badge>
                              )}
                              {paper.repeat && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-500 shrink-0">
                                  {paper.repeat}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] font-medium leading-snug line-clamp-2 text-white/90">
                              {paper.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </div>

                <div className="pt-3 border-t border-[#2a2a2a] w-full border-b-0">
                  <h4 className="text-xs font-medium text-[#4a5578] mb-2">Reading Stats</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-[11px] text-[#4a5578]">
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                      {thisWeeksPapers.length} papers this week
                    </div>
                    <div className="flex items-center text-[11px] text-[#4a5578]">
                      <Activity className="h-3.5 w-3.5 mr-1.5" />
                      {upcomingPapers.length} papers upcoming
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Paper List */}
          <div className="flex-1 min-w-0 p-3">
            <Tabs defaultValue="scheduled" className="w-full">
              <TabsList className="h-7 bg-[#1a1f2e] p-0.5 gap-0.5">
                <TabsTrigger value="scheduled" className="h-6 text-[11px] data-[state=active]:bg-[#2a3142]">
                  Scheduled
                </TabsTrigger>
                <TabsTrigger value="unscheduled" className="h-6 text-[11px] data-[state=active]:bg-[#2a3142]">
                  Unscheduled
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scheduled" className="mt-0">
                <div className="flex items-center justify-end gap-2 mb-3">
                  <div className="bg-[#1a1f2e] rounded-md p-0.5 flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScheduledViewMode('calendar')}
                      className={cn(
                        "h-7 px-2.5 text-[11px]",
                        scheduledViewMode === 'calendar' ? "bg-[#2a3142] text-white" : "text-[#4a5578] hover:text-white hover:bg-[#2a3142]"
                      )}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                      Calendar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScheduledViewMode('grid')}
                      className={cn(
                        "h-7 px-2.5 text-[11px]",
                        scheduledViewMode === 'grid' ? "bg-[#2a3142] text-white" : "text-[#4a5578] hover:text-white hover:bg-[#2a3142]"
                      )}
                    >
                      <Grid2x2 className="h-3.5 w-3.5 mr-1.5" />
                      Grid
                    </Button>
                  </div>
                </div>

                {scheduledViewMode === 'grid' ? (
                  <div className="h-[calc(100vh-12rem)] overflow-y-auto space-y-2">
                    {isLoading ? (
                      Array(3).fill(0).map((_, i) => <PaperCardSkeleton key={i} />)
                    ) : (
                      papers.filter(p => p.scheduled_date).map((paper) => (
                        <PaperCard
                          key={paper.id}
                          paper={paper}
                          onAddToList={() => handleAddToList(paper)}
                          onSchedule={(date, estimatedTime, repeat) => handleSchedulePaper(paper, date, estimatedTime, repeat)}
                          onDelete={() => handleDeletePaper(paper)}
                          isLoading={isLoading}
                          context="reading-list"
                          showAddToListButton={false}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  <div className="h-[calc(100vh-12rem)] overflow-y-auto">
                    <div className="bg-[#030014] rounded-lg">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between p-4 border-b border-[#1a1f2e]">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const prev = new Date(selectedDate);
                              prev.setMonth(prev.getMonth() - 1);
                              setSelectedDate(prev);
                            }}
                            className="h-7 w-7 p-0 hover:bg-[#2a3142]"
                          >
                            <ChevronDown className="h-4 w-4 rotate-90 text-[#4a5578]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const next = new Date(selectedDate);
                              next.setMonth(next.getMonth() + 1);
                              setSelectedDate(next);
                            }}
                            className="h-7 w-7 p-0 hover:bg-[#2a3142]"
                          >
                            <ChevronDown className="h-4 w-4 -rotate-90 text-[#4a5578]" />
                          </Button>
                          <h3 className="text-sm font-medium text-white">
                            {format(selectedDate, 'MMMM yyyy')}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDate(new Date())}
                          className="h-7 px-2.5 text-[11px] hover:bg-[#2a3142] text-[#4a5578]"
                        >
                          Today
                        </Button>
                      </div>

                      {/* Calendar Grid - Make it more compact */}
                      <div className="grid grid-cols-7 auto-rows-[80px]">
                        {Array.from({ length: 42 }, (_, i) => {
                          const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                          date.setDate(1 - date.getDay() + i);
                          
                          const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                          
                          const scheduledPapers = papers.filter(p => {
                            if (!p.scheduled_date) return false;
                            const paperDate = new Date(p.scheduled_date);
                            return format(paperDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                          });

                          return (
                            <div
                              key={i}
                              onClick={() => handleDateSelect(date)}
                              className={cn(
                                "p-1 border-r border-b border-[#1a1f2e] last:border-r-0 relative cursor-pointer hover:bg-[#2a3142]/50 transition-colors",
                                !isCurrentMonth && "bg-[#1a1f2e]",
                                isSelected && "bg-[#2a3142]"
                              )}
                            >
                              <div className={cn(
                                "text-[11px] font-medium mb-1 rounded-full w-5 h-5 flex items-center justify-center",
                                isToday ? "bg-violet-500 text-white" : "text-[#4a5578]",
                                !isCurrentMonth && "text-[#4a5578]"
                              )}>
                                {date.getDate()}
                              </div>
                              <div className="space-y-0.5">
                                {scheduledPapers.slice(0, 2).map((paper, idx) => (
                                  <div
                                    key={paper.id}
                                    className={cn(
                                      "text-[9px] px-1 py-0.5 rounded truncate",
                                      "bg-violet-500/10 text-violet-500 border border-violet-500/20",
                                      "hover:bg-violet-500/20 transition-colors cursor-pointer"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePaperClick(paper);
                                    }}
                                  >
                                    {paper.estimated_time && (
                                      <span className="mr-1 opacity-70">{paper.estimated_time}m</span>
                                    )}
                                    {paper.title}
                                  </div>
                                ))}
                                {scheduledPapers.length > 2 && (
                                  <div className="text-[9px] text-[#4a5578] px-1">
                                    +{scheduledPapers.length - 2} more
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Day Schedule */}
                    <div className="mt-4 bg-[#030014] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-white">
                          Schedule for {format(selectedDate, 'MMMM d, yyyy')}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-[11px] hover:bg-[#2a3142] text-violet-500"
                          onClick={() => {
                            // Open schedule dialog for this date
                            // You can implement this functionality
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add paper
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {papers
                          .filter(p => {
                            if (!p.scheduled_date) return false;
                            const paperDate = new Date(p.scheduled_date);
                            return format(paperDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                          })
                          .sort((a, b) => {
                            if (!a.scheduled_date || !b.scheduled_date) return 0;
                            return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
                          })
                          .map(paper => (
                            <div
                              key={paper.id}
                              className="flex items-start gap-3 p-2 hover:bg-[#2a3142] rounded-lg transition-colors cursor-pointer group"
                              onClick={() => handlePaperClick(paper)}
                            >
                              <div className="w-12 text-center">
                                <div className="text-[11px] font-medium text-violet-500">
                                  {paper.estimated_time}m
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm text-white group-hover:text-violet-500 transition-colors line-clamp-1">
                                  {paper.title}
                                </h4>
                                {paper.authors && (
                                  <p className="text-[11px] text-[#4a5578] line-clamp-1">
                                    {paper.authors.join(', ')}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-[#2a3142]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Implement edit schedule functionality
                                }}
                              >
                                <Clock className="h-3.5 w-3.5 text-[#4a5578]" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unscheduled" className="mt-3">
                <div className="h-[calc(100vh-12rem)] overflow-y-auto space-y-2">
                  {papers.filter(p => !p.scheduled_date).map(paper => (
                    <div key={paper.id} onClick={() => handlePaperClick(paper)}>
                      <PaperCard
                        paper={paper}
                        onDelete={() => handleDeletePaper(paper)}
                        onAddToList={() => handleAddToList(paper)}
                        onSchedule={(date, time, repeat) => handleSchedulePaper(paper, date, time, repeat)}
                        isLoading={isLoading}
                        context="reading-list"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add Delete Dialog */}
      <DeletePaperDialog
        open={Boolean(paperToDelete)}
        onOpenChange={(open) => !open && setPaperToDelete(null)}
        onConfirm={handleConfirmDelete}
        paperTitle={paperToDelete?.title || ""}
        isDeleting={isDeleting}
      />
    </MainLayout>
  );
}