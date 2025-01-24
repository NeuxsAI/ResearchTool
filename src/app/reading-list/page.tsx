"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getReadingList, getPapers, getCategories } from "@/lib/supabase/db";
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
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PaperCard, PaperCardSkeleton } from "@/components/paper-card";
import { Paper } from "@/components/paper-card";

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "discover">("schedule");
  const [sortBy, setSortBy] = useState<"relevance" | "citations" | "date">("relevance");
  const [dateRange, setDateRange] = useState<"all" | "recent" | "last-year">("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all-time");
  const [selectedImpact, setSelectedImpact] = useState<string>("any-impact");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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

  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]); // Clear previous results
    
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
      console.log('Search results:', data);
      
      // Check if data.papers exists and is an array
      const papersArray = Array.isArray(data.papers) ? data.papers : [];
      
      // Map the API response to match the Paper interface
      const mappedPapers: Paper[] = papersArray.map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        year: paper.year,
        citations: paper.citations || 0,
        institution: paper.institution,
        impact: paper.impact || "low",
        url: paper.url,
        topics: paper.topics || [],
      }));
      
      setSearchResults(mappedPapers);
      setHasSearched(true);
      setIsSearching(false);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search papers');
      setHasSearched(true);
      setIsSearching(false);
    }
  }

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

        setPapers(readingListPapers);
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

  const scheduledPapers = readingList.map(item => {
    const paper = papers.find(p => p.id === item.paper_id);
    return {
      ...paper,
      scheduled_date: item.scheduled_date,
      estimated_time: item.estimated_time
    };
  }).filter(paper => paper.title) as Paper[];

  const papersByDate = scheduledPapers.reduce((acc, paper) => {
    const date = paper.scheduled_date ? new Date(paper.scheduled_date) : new Date();
    const dateStr = format(date, "yyyy-MM-dd");
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(paper);
    return acc;
  }, {} as Record<string, Paper[]>);

  // Group papers by week
  const thisWeekPapers = scheduledPapers.filter(paper => {
    if (!paper.scheduled_date) return false;
    const paperDate = new Date(paper.scheduled_date);
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    return paperDate >= today && paperDate <= weekFromNow;
  });

  // Get upcoming papers (next 30 days)
  const upcomingPapers = scheduledPapers.filter(paper => {
    if (!paper.scheduled_date) return false;
    const paperDate = new Date(paper.scheduled_date);
    const today = new Date();
    const monthFromNow = new Date();
    monthFromNow.setDate(today.getDate() + 30);
    return paperDate >= today && paperDate <= monthFromNow;
  });

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[#2a2a2a] bg-[#1c1c1c]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-medium text-white">Reading List</h1>
                <p className="text-xs text-[#888]">
                  Discover and schedule your research reading
                </p>
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "schedule" | "discover")}>
                <TabsList className="h-8 bg-[#2a2a2a] p-0.5 gap-0.5">
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

            {activeTab === "discover" && (
              <div className="space-y-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} className="relative">
                  <Search className={cn(
                    "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5",
                    isSearching ? "text-blue-500 animate-pulse" : "text-[#666]"
                  )} />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value === "") setHasSearched(false);
                    }}
                    placeholder="Search for papers, authors, or topics..."
                    className="pl-8 h-8 text-[11px] bg-[#2a2a2a] border-[#333] focus:ring-1 focus:ring-violet-500/30"
                    disabled={isSearching}
                  />
                </form>
                <div className="flex items-center gap-2">
                  {selectedDateRange !== "all-time" && (
                    <Badge 
                      variant="secondary" 
                      className="bg-[#2a2a2a] text-[#888] hover:bg-[#333] cursor-pointer"
                      onClick={() => setSelectedDateRange("all-time")}
                    >
                      {selectedDateRange.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")} ×
                    </Badge>
                  )}
                  {selectedImpact !== "any-impact" && (
                    <Badge 
                      variant="secondary" 
                      className="bg-[#2a2a2a] text-[#888] hover:bg-[#333] cursor-pointer"
                      onClick={() => setSelectedImpact("any-impact")}
                    >
                      {selectedImpact.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")} ×
                    </Badge>
                  )}
                  {selectedTopics.map(topic => (
                    <Badge 
                      key={topic}
                      variant="secondary" 
                      className="bg-[#2a2a2a] text-[#888] hover:bg-[#333] cursor-pointer"
                      onClick={() => setSelectedTopics(prev => prev.filter(t => t !== topic))}
                    >
                      {topic.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")} ×
                    </Badge>
                  ))}
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] hover:bg-[#2a2a2a] text-[#888]"
                  >
                    <SortAsc className="h-3.5 w-3.5 mr-1.5" />
                    Sort by: {sortBy}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex">
          {/* Filters Panel - Now on the left */}
          {activeTab === "discover" && (
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
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 p-4">
            <div className="h-full flex gap-4">
              {/* Papers List */}
              <div className="flex-1 min-w-0">
                <ScrollArea className="h-full">
                  <Tabs value={activeTab} className="w-full">
                    <TabsContent value="discover" className="m-0">
                      {!hasSearched ? (
                        <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center px-4">
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
                        <div className="mt-6">
                          {isSearching ? (
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
                                    onAddToList={() => {/* TODO: Implement add to list */}}
                                  />
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="schedule" className="m-0">
                      {/* Existing Reading List Content */}
                      {isLoading ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <Card key={i} className="p-3 bg-[#1c1c1c] border-[#2a2a2a]">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded bg-[#2a2a2a] animate-pulse" />
                                <div className="flex-1">
                                  <div className="h-4 w-2/3 bg-[#2a2a2a] rounded animate-pulse mb-2" />
                                  <div className="h-3 w-1/3 bg-[#2a2a2a] rounded animate-pulse" />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <motion.div 
                          className="space-y-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {/* Today's Reading */}
                          <motion.div variants={itemVariants}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <h3 className="text-[11px] font-medium text-[#888]">Today</h3>
                            </div>
                            <div className="space-y-1">
                              {papersByDate[format(new Date(), "yyyy-MM-dd")]?.map((paper) => (
                                <Card 
                                  key={paper.id}
                                  className="flex items-start gap-2 p-2 hover:bg-[#2a2a2a] transition-colors group border-[#2a2a2a] cursor-pointer"
                                  onClick={() => handlePaperClick(paper)}
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded bg-[#2a2a2a] flex items-center justify-center group-hover:bg-[#333]">
                                    <FileText className="h-4 w-4 text-[#666]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      {paper.estimated_time && (
                                        <span className="text-[10px] text-[#666] flex items-center gap-0.5">
                                          <Clock className="h-3 w-3" />
                                          {paper.estimated_time} min
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-[11px] font-medium text-white truncate leading-snug mb-0.5">
                                      {paper.title}
                                    </h3>
                                    {paper.authors && (
                                      <p className="text-[10px] text-[#666] truncate">
                                        {paper.authors.join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </Card>
                              ))}
                              {!papersByDate[format(new Date(), "yyyy-MM-dd")]?.length && (
                                <div className="text-center py-4 text-sm text-[#666]">
                                  No papers scheduled for today
                                </div>
                              )}
                            </div>
                          </motion.div>

                          {/* This Week */}
                          <motion.div variants={itemVariants}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <h3 className="text-[11px] font-medium text-[#888]">This Week</h3>
                            </div>
                            <div className="space-y-1">
                              {thisWeekPapers.map((paper) => (
                                <Card 
                                  key={paper.id}
                                  className="flex items-start gap-2 p-2 hover:bg-[#2a2a2a] transition-colors group border-[#2a2a2a] cursor-pointer"
                                  onClick={() => handlePaperClick(paper)}
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded bg-[#2a2a2a] flex items-center justify-center group-hover:bg-[#333]">
                                    <FileText className="h-4 w-4 text-[#666]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      {paper.scheduled_date && (
                                        <span className="text-[10px] text-[#666] flex items-center gap-0.5">
                                          <CalendarIcon className="h-3 w-3" />
                                          {format(new Date(paper.scheduled_date), "MMM d")}
                                        </span>
                                      )}
                                      {paper.estimated_time && (
                                        <span className="text-[10px] text-[#666] flex items-center gap-0.5">
                                          <Clock className="h-3 w-3" />
                                          {paper.estimated_time} min
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-[11px] font-medium text-white truncate leading-snug mb-0.5">
                                      {paper.title}
                                    </h3>
                                    {paper.authors && (
                                      <p className="text-[10px] text-[#666] truncate">
                                        {paper.authors.join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </motion.div>

                          {/* Upcoming */}
                          <motion.div variants={itemVariants}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                              <h3 className="text-[11px] font-medium text-[#888]">Upcoming</h3>
                            </div>
                            <div className="space-y-1">
                              {upcomingPapers.map((paper) => (
                                <Card 
                                  key={paper.id}
                                  className="flex items-start gap-2 p-2 hover:bg-[#2a2a2a] transition-colors group border-[#2a2a2a] cursor-pointer"
                                  onClick={() => handlePaperClick(paper)}
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded bg-[#2a2a2a] flex items-center justify-center group-hover:bg-[#333]">
                                    <FileText className="h-4 w-4 text-[#666]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      {paper.scheduled_date && (
                                        <span className="text-[10px] text-[#666] flex items-center gap-0.5">
                                          <CalendarIcon className="h-3 w-3" />
                                          {format(new Date(paper.scheduled_date), "MMM d")}
                                        </span>
                                      )}
                                      {paper.estimated_time && (
                                        <span className="text-[10px] text-[#666] flex items-center gap-0.5">
                                          <Clock className="h-3 w-3" />
                                          {paper.estimated_time} min
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-[11px] font-medium text-white truncate leading-snug mb-0.5">
                                      {paper.title}
                                    </h3>
                                    {paper.authors && (
                                      <p className="text-[10px] text-[#666] truncate">
                                        {paper.authors.join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </div>

              {/* Calendar Sidebar - Only show in schedule tab */}
              {activeTab === "schedule" && (
                <motion.div 
                  className="w-[300px] flex-shrink-0"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="h-full p-4 bg-[#1c1c1c] border-[#2a2a2a]">
                    <h3 className="text-sm font-medium text-white mb-4">Schedule</h3>
                    
                    {/* Calendar */}
                    <div className="mb-6">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        className="text-white"
                        modifiers={{
                          booked: (date) => {
                            const dateStr = format(date, "yyyy-MM-dd");
                            return !!papersByDate[dateStr]?.length;
                          }
                        }}
                        modifiersStyles={{
                          booked: {
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            borderRadius: "4px"
                          }
                        }}
                      />
                    </div>

                    {/* Reading Stats */}
                    <div>
                      <h4 className="text-xs font-medium text-[#888] mb-2">
                        Reading Stats
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-1.5 rounded">
                          <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#888]">
                              {thisWeekPapers.length} papers this week
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded">
                          <Activity className="h-3.5 w-3.5 text-emerald-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#888]">
                              {upcomingPapers.length} papers upcoming
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 