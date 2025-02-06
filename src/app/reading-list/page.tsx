"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getReadingList, getPapers, getCategories, addToReadingList, schedulePaper } from "@/lib/supabase/db";
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
  Brain
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, setDate, addWeeks, addMonths, differenceInWeeks, differenceInMonths } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PaperCard, PaperCardSkeleton, Paper } from "@/components/paper-card";
import { SelectSingleEventHandler } from "react-day-picker";

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
    setSearchResults([]);
    
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
      setHasSearched(true);
      
      const papersArray = Array.isArray(data.papers) ? data.papers : [];
      const mappedPapers = papersArray.map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        year: paper.year,
        citations: paper.citations || 0,
        impact: paper.impact || "low",
        url: paper.url,
        topics: paper.topics || [],
        in_reading_list: readingList.some(item => item.paper_id === paper.id)
      }));
      
      setSearchResults(mappedPapers);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search papers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [papersResult, readingListResult, categoriesResult] = await Promise.all([
          getPapers(),
          getReadingList(),
          getCategories()
        ]);

        // First map to base Paper interface
        const basePapers: Paper[] = (papersResult.data || [])
          .filter((paper: SupabasePaper) => 
            Boolean(paper.id && paper.title && paper.authors)
          )
          .map(paper => {
            const category = categoriesResult.data?.find(c => c.id === paper.category_id);
            return {
              id: paper.id!,
              title: paper.title!,
              abstract: paper.abstract,
              authors: paper.authors!,
              year: paper.year || new Date().getFullYear(),
              citations: 0,
              impact: "low" as const,
              url: paper.url || `https://example.com/paper/${paper.id}`,
              topics: [],
              category_id: paper.category_id,
              category: category ? {
                id: category.id,
                name: category.name,
                color: category.color
              } : undefined
            };
          });

        // Then extend with reading list properties
        const readingListPapers: Paper[] = basePapers.map(paper => ({
          ...paper,
          scheduled_date: undefined,
          estimated_time: undefined
        }));

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
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
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

  const handleDateSelect: SelectSingleEventHandler = (newDate) => {
    if (newDate) {
      setDate(newDate);
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
    
    // Check if it's scheduled for this week
    if (isWithinInterval(scheduledDate, { start: weekStart, end: weekEnd })) {
      return true;
    }
    
    // Check if it's a repeating paper that falls within this week
    if (paper.repeat) {
      switch (paper.repeat) {
        case 'daily':
          return true;
        case 'weekly':
          const weeksSinceScheduled = differenceInWeeks(today, scheduledDate);
          return weeksSinceScheduled >= 0;
        case 'monthly':
          const monthsSinceScheduled = differenceInMonths(today, scheduledDate);
          const monthlyDate = new Date(today);
          monthlyDate.setDate(scheduledDate.getDate());
          return monthsSinceScheduled >= 0 && isWithinInterval(monthlyDate, { start: weekStart, end: weekEnd });
        default:
          return false;
      }
    }
    
    return false;
  });

  const upcomingPapers = papers.filter(paper => {
    if (!paper.scheduled_date) return false;
    const scheduledDate = new Date(paper.scheduled_date);
    const today = new Date();
    
    // Check if it's scheduled for the future
    if (scheduledDate > today) {
      return true;
    }
    
    // Check if it's a repeating paper
    if (paper.repeat) {
      switch (paper.repeat) {
        case 'daily':
          return true;
        case 'weekly':
          const nextOccurrence = addWeeks(scheduledDate, Math.ceil(differenceInWeeks(today, scheduledDate)) + 1);
          return nextOccurrence > today;
        case 'monthly':
          const nextMonthlyOccurrence = addMonths(scheduledDate, Math.ceil(differenceInMonths(today, scheduledDate)) + 1);
          return nextMonthlyOccurrence > today;
        default:
          return false;
      }
    }
    
    return false;
  });

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
                        <p className="text-[11px] text-[#666]">No papers scheduled for today</p>
                      ) : (
                        <ScrollArea className="h-[100px]">
                          {todaysPapers.map(paper => (
                            <div 
                              key={paper.id} 
                              className="text-[11px] p-1.5 hover:bg-[#2a2a2a] rounded cursor-pointer text-white"
                              onClick={() => handlePaperClick(paper)}
                            >
                              {paper.title}
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
                        <p className="text-[11px] text-[#666]">No papers scheduled this week</p>
                      ) : (
                        <ScrollArea className="h-[100px]">
                          {thisWeeksPapers.map(paper => (
                            <div 
                              key={paper.id} 
                              className="text-[11px] p-1.5 hover:bg-[#2a2a2a] rounded cursor-pointer text-white"
                              onClick={() => handlePaperClick(paper)}
                            >
                              {paper.title}
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
                        <p className="text-[11px] text-[#666]">No upcoming papers</p>
                      ) : (
                        <ScrollArea className="h-[100px]">
                          {upcomingPapers.map(paper => (
                            <div 
                              key={paper.id} 
                              className="text-[11px] p-1.5 hover:bg-[#2a2a2a] rounded cursor-pointer text-white"
                              onClick={() => handlePaperClick(paper)}
                            >
                              {paper.title}
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

                  <TabsContent value="scheduled" className="mt-3">
                    <div className="h-[calc(100vh-12rem)] overflow-y-auto space-y-2">
                      {isLoading ? (
                        Array(3).fill(0).map((_, i) => <PaperCardSkeleton key={i} />)
                      ) : (
                        papers.filter(p => p.scheduled_date).map(paper => (
                          <div key={paper.id} onClick={() => handlePaperClick(paper)}>
                            <PaperCard
                              paper={paper}
                              onAddToList={() => handleAddToList(paper)}
                              onSchedule={(date, time, repeat) => handleSchedulePaper(paper, date, time, repeat)}
                              isLoading={isLoading}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="unscheduled" className="mt-3">
                    <div className="h-[calc(100vh-12rem)] overflow-y-auto space-y-2">
                      {papers.filter(p => !p.scheduled_date).map(paper => (
                        <div key={paper.id} onClick={() => handlePaperClick(paper)}>
                          <PaperCard
                            paper={paper}
                            onAddToList={() => handleAddToList(paper)}
                            onSchedule={(date, time, repeat) => handleSchedulePaper(paper, date, time, repeat)}
                            isLoading={isLoading}
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
                  <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} className="relative">
                    <Search className={cn(
                      "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5",
                      isLoading ? "text-blue-500 animate-pulse" : "text-[#666]"
                    )} />
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value === "") setHasSearched(false);
                      }}
                      placeholder="Search for papers, authors, or topics..."
                      className="pl-8 h-8 text-[11px] bg-[#2a2a2a] border-[#333] focus:ring-1 focus:ring-violet-500/30"
                      disabled={isLoading}
                    />
                  </form>

                  {!hasSearched ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-full max-w-md space-y-4">
                        <div className="flex justify-center">
                          <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                            <Search className="h-6 w-6 text-violet-500" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white mb-2">Search for Research Papers</h3>
                          <p className="text-sm text-[#888]">
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
                  ) : (
                    <div className="mt-6 flex-1 overflow-hidden">
                      <div className="h-full overflow-y-auto">
                        {isLoading ? (
                          <motion.div 
                            className="space-y-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <PaperCardSkeleton />
                            <PaperCardSkeleton />
                            <PaperCardSkeleton />
                          </motion.div>
                        ) : searchError ? (
                          <motion.div 
                            className="text-red-500 text-center py-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {searchError}
                          </motion.div>
                        ) : searchResults.length === 0 ? (
                          <motion.div 
                            className="text-center py-4 text-muted-foreground"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            No papers found matching your search.
                          </motion.div>
                        ) : (
                          <motion.div 
                            className="space-y-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            {searchResults.map((paper) => (
                              <motion.div key={paper.id} variants={itemVariants}>
                                <PaperCard
                                  paper={paper}
                                  onAddToList={() => handleAddToList(paper)}
                                  isLoading={isLoading}
                                />
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}