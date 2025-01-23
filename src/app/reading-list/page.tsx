"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getReadingList, getPapers } from "@/lib/supabase/db";
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
  Star
} from "lucide-react";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category_id?: string;
  scheduled_date?: string;
  estimated_time?: number;
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

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [papersResult, readingListResult] = await Promise.all([
          getPapers(),
          getReadingList()
        ]);

        setPapers(papersResult.data || []);
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
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for papers, authors, or topics..."
                    className="pl-8 h-8 text-[11px] bg-[#2a2a2a] border-[#333] focus:ring-1 focus:ring-violet-500/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-7 px-2.5 text-[11px] hover:bg-[#2a2a2a] text-[#888]"
                  >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Filters
                  </Button>
                  <Badge variant="secondary" className="bg-[#2a2a2a] text-[#888] hover:bg-[#333]">
                    Last year
                  </Badge>
                  <Badge variant="secondary" className="bg-[#2a2a2a] text-[#888] hover:bg-[#333]">
                    High impact
                  </Badge>
                  <Badge variant="secondary" className="bg-[#2a2a2a] text-[#888] hover:bg-[#333]">
                    Machine Learning
                  </Badge>
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
        <div className="flex-1 min-h-0 p-4">
          <div className="h-full flex gap-4">
            {/* Papers List */}
            <div className="flex-1 min-w-0">
              <ScrollArea className="h-full">
                <Tabs value={activeTab} className="w-full">
                <TabsContent value="discover" className="m-0">
                  {/* Search Results */}
                  <motion.div 
                    className="space-y-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {[1,2,3].map((_, i) => (
                      <motion.div key={i} variants={itemVariants}>
                        <Card className="p-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer border-[#2a2a2a]">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded bg-[#2a2a2a] flex items-center justify-center">
                              <FileText className="h-5 w-5 text-[#666]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-medium text-white truncate">
                                  Attention Is All You Need
                                </h3>
                                <Badge className="bg-violet-500/10 text-violet-500 hover:bg-violet-500/20">
                                  High Impact
                                </Badge>
                              </div>
                              <p className="text-xs text-[#888] mb-2 line-clamp-2">
                                We propose a new simple network architecture, the Transformer, based solely on attention mechanisms...
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-[#666]">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  52,000 citations
                                </span>
                                <span>2017</span>
                                <span>Google Research</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] hover:bg-[#333] text-white bg-[#2a2a2a]"
                            >
                              <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                              Add to list
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
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

            {/* Activity Sidebar */}
            <motion.div 
              className="w-[300px] flex-shrink-0"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="h-full p-4 bg-[#1c1c1c] border-[#2a2a2a]">
                {activeTab === "schedule" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-white mb-4">Filters</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium text-[#888] mb-2">Date Range</h4>
                        <div className="space-y-1">
                          {["All time", "Last year", "Last 6 months", "Last month"].map((range) => (
                            <Button
                              key={range}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-7 text-[11px] hover:bg-[#2a2a2a] text-[#888]"
                            >
                              {range}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#888] mb-2">Impact</h4>
                        <div className="space-y-1">
                          {["Any impact", "High impact", "Rising stars"].map((impact) => (
                            <Button
                              key={impact}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-7 text-[11px] hover:bg-[#2a2a2a] text-[#888]"
                            >
                              {impact}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#888] mb-2">Topics</h4>
                        <div className="space-y-1">
                          {["Machine Learning", "Computer Vision", "Natural Language Processing", "Reinforcement Learning"].map((topic) => (
                            <Button
                              key={topic}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-7 text-[11px] hover:bg-[#2a2a2a] text-[#888]"
                            >
                              {topic}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 