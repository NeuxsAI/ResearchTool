"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getReadingList, getPapers, getCategories, addToReadingList, schedulePaper, deletePaper } from "@/lib/supabase/db";
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronDown, 
  List, 
  CalendarDays, 
  BookOpen, 
  Activity,
  Search,
  Filter,
  SortAsc,
  Sparkles,
  BookMarked,
  Star,
  Calendar as CalendarIcon2,
  Trophy,
  Tags,
  TrendingUp,
  Clock as ClockIcon,
  Zap,
  Layers,
  Brain,
  Grid2x2,
  Plus
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, setDate, addWeeks, addMonths, differenceInWeeks, differenceInMonths } from "date-fns";
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
async function preloadData() {
  const [papersResult, readingListResult, categoriesResult] = await Promise.all([
    getPapers(),
    getReadingList(),
    getCategories()
  ]);

  // Process and combine data
  const papers = (papersResult.data || []).map(p => {
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
      url: p.url || "",
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
    };
  });

  return {
    papers,
    readingList: readingListResult.data || [],
    categories: categoriesResult.data || []
  };
}

export default function ReadingListPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [papers, setPapers] = useState<Paper[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "discover">("schedule");
  const [sortBy, setSortBy] = useState<"relevance" | "citations" | "date">("relevance");
  const [dateRange, setDateRange] = useState<"all" | "recent" | "last-year">("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all-time");
  const [selectedImpact, setSelectedImpact] = useState<string>("any-impact");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scheduledViewMode, setScheduledViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const exampleQueries = [
    { text: "Attention mechanisms", icon: Sparkles },
    { text: "Geoffrey Hinton", icon: BookOpen },
    { text: "Large language models", icon: Brain }
  ];

  const handleExampleQuery = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setSearchError(null);
    setHasSearched(true);
    
    try {
      const response = await fetch('/api/papers/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          dateRange: selectedDateRange,
          impact: selectedImpact,
          topics: selectedTopics,
          page: 1,
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search papers');
      }

      const data = await response.json();
      
      const mappedPapers = (data.papers || []).map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors || [],
        year: paper.year || new Date().getFullYear(),
        citations: paper.citations || 0,
        impact: paper.impact || "low",
        url: paper.url,
        topics: paper.topics || [],
        institution: paper.institution,
        in_reading_list: readingList.some(item => item.paper_id === paper.id)
      }));
      
      setSearchResults(mappedPapers);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search papers');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        
        const { papers: loadedPapers, readingList: loadedReadingList } = await preloadData();
        
        if (!mounted) return;
        
        setPapers(loadedPapers);
        setReadingList(loadedReadingList);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePaperClick = (paper: Paper) => {
    router.push(`/paper/${paper.id}`);
  };

  const handleAddToList = async (paper: Paper) => {
    setIsLoading(true);
    try {
      const result = await addToReadingList(paper.id, {
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        abstract: paper.abstract,
        url: paper.url,
        category_id: paper.category_id
      });
      
      const [papersResult, readingListResult] = await Promise.all([
        getPapers(),
        getReadingList()
      ]);
      
      // Map papers to match the Paper interface
      const updatedPapers = (papersResult.data || []).map(p => ({
        id: p.id,
        title: p.title || "",
        abstract: p.abstract,
        authors: p.authors || [],
        year: p.year || new Date().getFullYear(),
        citations: 0,
        impact: "low" as const,
        url: p.url || "",
        topics: [],
        category_id: p.category_id,
        in_reading_list: readingListResult.data?.some(r => r.paper_id === p.id)
      }));
      
      setPapers(updatedPapers);
      setReadingList(readingListResult.data || []);
    } catch (error) {
      console.error('Error adding paper to reading list:', error);
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

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 border-b border-[#2a2a2a] bg-[#1c1c1c]">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-white">Reading List</h1>
                <p className="text-xs text-[#888]">Schedule and manage your research reading</p>
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "schedule" | "discover")}>
                <TabsList className="h-8 bg-[#2a2a2a] text-[11px] p-0.5 gap-0.5">
                  <TabsTrigger value="schedule" className="h-7 data-[state=active]:bg-[#333]">
                    <BookMarked className="h-3.5 w-3.5 mr-2" />
                  Schedule
                  </TabsTrigger>
                  <TabsTrigger value="discover" className="h-7 data-[state=active]:bg-[#333]">
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Discover
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex">
          {activeTab === "schedule" ? (
            <>
              {/* Left Panel - Schedule */}
              <div className="w-[260px] border-r border-[#2a2a2a] bg-[#1c1c1c] overflow-y-auto">
                <div className="p-3">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-medium text-[#888] flex items-center mb-2">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Today
                      </h3>
                      {todaysPapers.length === 0 ? (
                        <p className="text-[11px] text-[#666] px-2">No papers scheduled for today</p>
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
                      <h3 className="text-xs font-medium text-[#888] flex items-center mb-2">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        This Week
                      </h3>
                      {thisWeeksPapers.length === 0 ? (
                        <p className="text-[11px] text-[#666] px-2">No papers scheduled this week</p>
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
                      <h3 className="text-xs font-medium text-[#888] flex items-center mb-2">
                        <Activity className="h-3.5 w-3.5 mr-1.5" />
                        Upcoming
                      </h3>
                      {upcomingPapers.length === 0 ? (
                        <p className="text-[11px] text-[#666] px-2">No upcoming papers</p>
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

                    <div className="pt-3 border-t border-[#2a2a2a]">
                      <h4 className="text-xs font-medium text-[#888] mb-2">Reading Stats</h4>
                      <div className="space-y-1">
                        <div className="flex items-center text-[11px] text-[#666]">
                          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                          {thisWeeksPapers.length} papers this week
                        </div>
                        <div className="flex items-center text-[11px] text-[#666]">
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
                  <TabsList className="h-7 bg-[#2a2a2a] p-0.5 gap-0.5">
                    <TabsTrigger value="scheduled" className="h-6 text-[11px] data-[state=active]:bg-[#333]">
                      Scheduled
                    </TabsTrigger>
                    <TabsTrigger value="unscheduled" className="h-6 text-[11px] data-[state=active]:bg-[#333]">
                      Unscheduled
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="scheduled" className="mt-0">
                    <div className="flex items-center justify-end gap-2 mb-3">
                      <div className="bg-[#2a2a2a] rounded-md p-0.5 flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setScheduledViewMode('grid')}
                          className={cn(
                            "h-7 px-2.5 text-[11px]",
                            scheduledViewMode === 'grid' ? "bg-[#333] text-white" : "text-[#888] hover:text-white"
                          )}
                        >
                          <Grid2x2 className="h-3.5 w-3.5 mr-1.5" />
                          Grid
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setScheduledViewMode('calendar')}
                          className={cn(
                            "h-7 px-2.5 text-[11px]",
                            scheduledViewMode === 'calendar' ? "bg-[#333] text-white" : "text-[#888] hover:text-white"
                          )}
                        >
                          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                          Calendar
                        </Button>
                      </div>
                    </div>

                    {scheduledViewMode === 'grid' ? (
                      <div className="h-[calc(100vh-12rem)] overflow-y-auto space-y-2">
                        {isLoading ? (
                          Array(3).fill(0).map((_, i) => <PaperCardSkeleton key={i} />)
                        ) : (
                          papers.filter(p => p.scheduled_date).map(paper => (
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
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="h-[calc(100vh-12rem)] overflow-y-auto">
                        <div className="bg-[#1c1c1c] rounded-lg">
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const prev = new Date(selectedDate);
                                  prev.setMonth(prev.getMonth() - 1);
                                  setSelectedDate(prev);
                                }}
                                className="h-7 w-7 p-0 hover:bg-[#2a2a2a]"
                              >
                                <ChevronDown className="h-4 w-4 rotate-90 text-[#888]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const next = new Date(selectedDate);
                                  next.setMonth(next.getMonth() + 1);
                                  setSelectedDate(next);
                                }}
                                className="h-7 w-7 p-0 hover:bg-[#2a2a2a]"
                              >
                                <ChevronDown className="h-4 w-4 -rotate-90 text-[#888]" />
                              </Button>
                              <h3 className="text-sm font-medium text-white">
                                {format(selectedDate, 'MMMM yyyy')}
                              </h3>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDate(new Date())}
                              className="h-7 px-2.5 text-[11px] hover:bg-[#2a2a2a] text-[#888]"
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
                                    "p-1 border-r border-b border-[#2a2a2a] last:border-r-0 relative cursor-pointer hover:bg-[#2a2a2a]/50 transition-colors",
                                    !isCurrentMonth && "bg-[#1a1a1a]",
                                    isSelected && "bg-[#2a2a2a]"
                                  )}
                                >
                                  <div className={cn(
                                    "text-[11px] font-medium mb-1 rounded-full w-5 h-5 flex items-center justify-center",
                                    isToday ? "bg-violet-500 text-white" : "text-[#888]",
                                    !isCurrentMonth && "text-[#666]"
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
                                      <div className="text-[9px] text-[#666] px-1">
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
                        <div className="mt-4 bg-[#1c1c1c] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-white">
                              Schedule for {format(selectedDate, 'MMMM d, yyyy')}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] hover:bg-[#2a2a2a] text-violet-500"
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
                                  className="flex items-start gap-3 p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer group"
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
                                      <p className="text-[11px] text-[#888] line-clamp-1">
                                        {paper.authors.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:bg-[#333]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Implement edit schedule functionality
                                    }}
                                  >
                                    <Clock className="h-3.5 w-3.5 text-[#888]" />
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
            </>
          ) : (
            /* Discover Tab Content */
            <div className="flex-1 min-h-0 flex">
              {/* Filters Panel */}
              <div className="w-[240px] border-r border-[#2a2a2a] bg-[#1c1c1c] overflow-y-auto">
                <div className="p-4 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon2 className="h-3.5 w-3.5 text-blue-500" />
                      <h4 className="text-xs font-medium text-white">Date Range</h4>
                    </div>
                    <div className="space-y-1">
                      {[
                        { value: "all-time", label: "All time", icon: Layers },
                        { value: "last-year", label: "Last year", icon: CalendarIcon },
                        { value: "last-6-months", label: "Last 6 months", icon: ClockIcon },
                        { value: "last-month", label: "Last month", icon: CalendarDays }
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDateRange(value)}
                          className={cn(
                            "w-full justify-start h-7 text-[11px] group",
                            selectedDateRange === value 
                              ? "bg-[#2a2a2a] text-white" 
                              : "text-[#888] hover:bg-[#2a2a2a]"
                          )}
                        >
                          <Icon className={cn(
                            "h-3.5 w-3.5 mr-2",
                            selectedDateRange === value 
                              ? "text-blue-500" 
                              : "text-[#666] group-hover:text-[#888]"
                          )} />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      <h4 className="text-xs font-medium text-white">Impact</h4>
                    </div>
                    <div className="space-y-1">
                      {[
                        { value: "any-impact", label: "Any impact", icon: Layers },
                        { value: "high-impact", label: "High impact", icon: Zap },
                        { value: "rising-stars", label: "Rising stars", icon: TrendingUp }
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImpact(value)}
                          className={cn(
                            "w-full justify-start h-7 text-[11px] group",
                            selectedImpact === value 
                              ? "bg-[#2a2a2a] text-white" 
                              : "text-[#888] hover:bg-[#2a2a2a]"
                          )}
                        >
                          <Icon className={cn(
                            "h-3.5 w-3.5 mr-2",
                            selectedImpact === value 
                              ? "text-amber-500" 
                              : "text-[#666] group-hover:text-[#888]"
                          )} />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Tags className="h-3.5 w-3.5 text-violet-500" />
                      <h4 className="text-xs font-medium text-white">Topics</h4>
                    </div>
                    <div className="space-y-1">
                      {[
                        { value: "machine-learning", label: "Machine Learning", color: "bg-blue-500" },
                        { value: "computer-vision", label: "Computer Vision", color: "bg-green-500" },
                        { value: "nlp", label: "Natural Language Processing", color: "bg-violet-500" },
                        { value: "reinforcement-learning", label: "Reinforcement Learning", color: "bg-amber-500" }
                      ].map(({ value, label, color }) => (
                        <Button
                          key={value}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTopics(prev => 
                              prev.includes(value) 
                                ? prev.filter(t => t !== value)
                                : [...prev, value]
                            )
                          }}
                          className={cn(
                            "w-full justify-start h-7 text-[11px] group",
                            selectedTopics.includes(value)
                              ? "bg-[#2a2a2a] text-white"
                              : "text-[#888] hover:bg-[#2a2a2a]"
                          )}
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mr-2",
                            selectedTopics.includes(value) ? color : "bg-[#666]"
                          )} />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0 p-4">
                <div className="h-full flex flex-col">
                  <div className="relative mb-6">
                    <Search className={cn(
                      "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5",
                      isLoading ? "text-violet-500" : "text-[#666]"
                    )} />
                    <form onSubmit={(e) => { 
                      e.preventDefault(); 
                      handleSearch(searchQuery); 
                    }}>
                      <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value === "") {
                            setHasSearched(false);
                            setSearchResults([]);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch(searchQuery);
                          }
                        }}
                        placeholder="Search for papers, authors, or topics..."
                        className="pl-8 h-8 text-[11px] bg-[#2a2a2a] border-[#333] focus:ring-1 focus:ring-violet-500/30"
                        disabled={isLoading}
                      />
                    </form>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <PaperCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : !hasSearched ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-full max-w-md space-y-6">
                        <div className="flex justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                            <Search className="h-6 w-6 text-[#666]" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white mb-2">Search for Research Papers</h3>
                          <p className="text-xs text-[#888]">
                            Enter a topic, author, or paper title to discover relevant research papers
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {exampleQueries.map(({ text, icon: Icon }) => (
                            <Badge 
                              key={text}
                              variant="secondary" 
                              className="bg-[#2a2a2a] text-[#888] hover:bg-[#333] cursor-pointer flex items-center gap-1.5 group"
                              onClick={() => handleExampleQuery(text)}
                            >
                              <Icon className="h-3 w-3 text-[#666] group-hover:text-[#888]" />
                              {text}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : searchError ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <Search className="h-6 w-6 text-red-500" />
                      </div>
                      <p className="text-sm text-red-500">{searchError}</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-4">
                        <Search className="h-6 w-6 text-[#666]" />
                      </div>
                      <p className="text-sm text-[#888]">No papers found matching your search.</p>
                    </div>
                  ) : (
                    <motion.div 
                      className="space-y-4 pb-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {searchResults.map((paper) => (
                        <motion.div key={paper.id} variants={itemVariants}>
                          <PaperCard
                            paper={{
                              ...paper,
                              citations: paper.citations || 0,
                              impact: paper.impact || "low",
                              url: paper.url || "",
                              topics: paper.topics || [],
                              in_reading_list: readingList.some(item => item.paper_id === paper.id),
                              scheduled_date: paper.scheduled_date,
                              estimated_time: paper.estimated_time,
                              repeat: paper.repeat
                            }}
                            onDelete={() => handleDeletePaper(paper)}
                            onAddToList={() => handleAddToList(paper)}
                            onSchedule={(date, time, repeat) => handleSchedulePaper(paper, date, time, repeat)}
                            isLoading={isLoading}
                            variant="compact"
                            context="discover"
                            showScheduleButton={!paper.in_reading_list}
                            showAddToListButton={!paper.in_reading_list}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
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