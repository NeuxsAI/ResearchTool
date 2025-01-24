"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Grid2x2, Search, Clock, BookOpen, Filter, Activity, MessageSquare, ChevronDown } from "lucide-react";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers, getCategories, getReadingList, getAnnotationsByPaper } from "@/lib/supabase/db";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category_id?: string;
  annotations_count?: number;
  url?: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface ReadingListItem {
  id: string;
  paper_id: string;
  added_at: string;
}

interface Annotation {
  id: string;
  content: string;
  created_at: string;
  paper_id: string;
  chat_history?: any[];
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

export default function LibraryPage() {
  const router = useRouter();
  // State
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [recentAnnotations, setRecentAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "title" | "year">("recent");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [
          papersResult,
          categoriesResult,
          readingListResult
        ] = await Promise.all([
          getPapers(),
          getCategories(),
          getReadingList()
        ]);

        setPapers(papersResult.data || []);
        setCategories(categoriesResult.data || []);
        setReadingList(readingListResult.data || []);

        // Get recent annotations
        const recentPapers = (papersResult.data || []).slice(0, 5);
        const annotationsPromises = recentPapers.map(paper => 
          getAnnotationsByPaper(paper.id)
        );
        const annotationsResults = await Promise.all(annotationsPromises);
        const allAnnotations = annotationsResults
          .flatMap(result => result.data || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        setRecentAnnotations(allAnnotations);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter and sort papers
  const filteredPapers = papers
    .filter(paper => {
      const matchesSearch = searchQuery === "" || 
        paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors?.some(author => 
          author.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesCategories = selectedCategories.length === 0 ||
        selectedCategories.includes(paper.category_id || "");

      return matchesSearch && matchesCategories;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at || "").getTime() - 
                 new Date(a.created_at || "").getTime();
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "year":
          return (b.year || 0) - (a.year || 0);
        default:
          return 0;
      }
    });

  // Group papers by category
  const papersByCategory = categories.reduce((acc, category) => {
    acc[category.id] = filteredPapers.filter(
      paper => paper.category_id === category.id
    );
    return acc;
  }, {} as Record<string, Paper[]>);

  // Get reading status
  const getReadingStatus = (paperId: string) => {
    return readingList.find(item => item.paper_id === paperId) 
      ? "In Reading List"
      : undefined;
  };

  // Split categories into visible and overflow
  const MAX_VISIBLE_CATEGORIES = 3;
  const visibleCategories = categories
    .filter(category => papers.filter(p => p.category_id === category.id).length > 0)
    .slice(0, MAX_VISIBLE_CATEGORIES);
  
  const overflowCategories = categories
    .filter(category => papers.filter(p => p.category_id === category.id).length > 0)
    .slice(MAX_VISIBLE_CATEGORIES);

  const handlePaperClick = (paper: Paper) => {
    // Pre-fetch the paper page for instant navigation
    router.prefetch(`/paper/${paper.id}`);
    router.push(`/paper/${paper.id}`);
  };

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#2a2a2a] bg-[#1c1c1c]">
        <motion.div 
          className="p-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-medium text-white">My Library</h1>
              <p className="text-xs text-[#888]">
                Browse and manage your research papers and ideas
              </p>
            </div>
            <Button 
              onClick={() => setIsAddPaperOpen(true)}
              className="h-8 px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add paper
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers..."
                className="pl-8 h-8 text-[11px] bg-[#2a2a2a] border-[#333] focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            {/* Unified Filters */}
            <div className="flex items-center h-8 bg-[#1c1c1c] rounded-lg border border-[#2a2a2a]">
              <div className="flex items-center px-2 gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#666]" />
                <Badge
                  variant={selectedCategories.length === 0 ? "default" : "outline"}
                  className={`h-6 px-2.5 text-[11px] cursor-pointer transition-colors whitespace-nowrap ${
                    selectedCategories.length === 0 
                      ? "bg-[#2a2a2a] text-white hover:bg-[#333]" 
                      : "bg-transparent text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                  }`}
                  onClick={() => setSelectedCategories([])}
                >
                  All ({papers.length})
                </Badge>

                {visibleCategories.map(category => {
                  const count = papers.filter(p => p.category_id === category.id).length;
                  if (count === 0) return null;
                  
                  const isSelected = selectedCategories.includes(category.id);
                  
                  return (
                    <Badge
                      key={category.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-6 px-2.5 text-[11px] cursor-pointer transition-all whitespace-nowrap group ${
                        isSelected 
                          ? "bg-[#00B2B2] border-[#00B2B2] text-white hover:opacity-90" 
                          : "bg-transparent border-[#2a2a2a] text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                      }`}
                      onClick={() => setSelectedCategories(prev => 
                        prev.includes(category.id)
                          ? prev.filter(id => id !== category.id)
                          : [...prev, category.id]
                      )}
                    >
                      {category.name}
                      {count > 0 && (
                        <span className="ml-1 text-[9px] opacity-60">
                          {count}
                        </span>
                      )}
                    </Badge>
                  );
                })}
              </div>

              <div className="h-full border-l border-[#2a2a2a] px-2 flex items-center gap-1 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-[11px] ${
                    sortBy === "recent" 
                      ? "bg-[#2a2a2a] text-white" 
                      : "text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                  } transition-colors`}
                >
                  {sortBy === "recent" ? "Recent" : sortBy === "title" ? "Title" : "Year"}
                </Button>
                <ChevronDown 
                  className="h-3.5 w-3.5 text-[#666] cursor-pointer hover:text-white transition-colors"
                  onClick={() => setShowSortOptions(!showSortOptions)}
                />

                {/* Dropdown for sort options */}
                {showSortOptions && (
                  <div 
                    className="absolute top-full right-0 mt-1 w-32 py-1 bg-[#1c1c1c] rounded-md border border-[#2a2a2a] shadow-lg z-10"
                    onMouseLeave={() => setShowSortOptions(false)}
                  >
                    <button
                      className={`w-full px-3 py-1.5 text-left text-[11px] ${
                        sortBy === "recent" 
                          ? "text-white bg-[#2a2a2a]" 
                          : "text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                      } transition-colors`}
                      onClick={() => {
                        setSortBy("recent");
                        setShowSortOptions(false);
                      }}
                    >
                      Recent
                    </button>
                    <button
                      className={`w-full px-3 py-1.5 text-left text-[11px] ${
                        sortBy === "title" 
                          ? "text-white bg-[#2a2a2a]" 
                          : "text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                      } transition-colors`}
                      onClick={() => {
                        setSortBy("title");
                        setShowSortOptions(false);
                      }}
                    >
                      Title
                    </button>
                    <button
                      className={`w-full px-3 py-1.5 text-left text-[11px] ${
                        sortBy === "year" 
                          ? "text-white bg-[#2a2a2a]" 
                          : "text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                      } transition-colors`}
                      onClick={() => {
                        setSortBy("year");
                        setShowSortOptions(false);
                      }}
                    >
                      Year
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(prev => prev === "list" ? "grid" : "list")}
              className="h-8 w-8 p-0 hover:bg-[#333] flex items-center justify-center"
            >
              <Grid2x2 className="h-3.5 w-3.5 text-[#888]" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 p-4 flex">
        {/* Activity Sidebar */}
        <motion.div 
            className="w-[300px] flex-shrink-0"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            
            <div className="w-[240px] border-r border-[#2a2a2a] bg-[#1c1c1c] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full ">
              <h3 className="text-sm font-medium text-white mb-4">Recent Activity</h3>
              
              {/* Reading Progress */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-[#888] mb-2">
                  Reading List
                </h4>
                <div className="space-y-2">
                  {readingList.slice(0, 3).map(item => {
                    const paper = papers.find(p => p.id === item.paper_id);
                    if (!paper) return null;
                    
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-2 hover:bg-[#2a2a2a] p-1.5 rounded cursor-pointer transition-colors group"
                        onClick={() => handlePaperClick(paper)}
                      >
                        <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-[11px] text-[#888] group-hover:text-white truncate">
                          {paper.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Annotations */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-[#888] mb-2">
                  Recent Annotations
                </h4>
                <div className="space-y-2">
                  {recentAnnotations.map(annotation => {
                    const paper = papers.find(p => p.id === annotation.paper_id);
                    if (!paper) return null;
                    return (
                      <div 
                        key={annotation.id} 
                        className="space-y-1 hover:bg-[#2a2a2a] p-1.5 rounded cursor-pointer transition-colors group"
                        onClick={() => handlePaperClick(paper)}
                      >
                        <p className="text-[11px] text-violet-400/50 group-hover:text-white line-clamp-2">
                          {annotation.content}
                        </p>
                        <p className="text-[10px] text-[#666] group-hover:text-[#888]">
                          on {paper.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Chats */}
              <div>
                <h4 className="text-xs font-medium text-[#888] mb-2">
                  Active Conversations
                </h4>
                <div className="space-y-2">
                  {recentAnnotations
                    .filter(a => a.chat_history && a.chat_history.length > 0)
                    .slice(0, 3)
                    .map(annotation => {
                      const paper = papers.find(p => p.id === annotation.paper_id);
                      if (!paper) return null;
                      return (
                        <div 
                          key={annotation.id} 
                          className="flex items-center gap-2 hover:bg-[#2a2a2a] p-1.5 rounded cursor-pointer transition-colors group"
                          onClick={() => handlePaperClick(paper)}
                        >
                          <Activity className="h-3.5 w-3.5 text-emerald-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#888] group-hover:text-white truncate">
                              {paper.title}
                            </p>
                            <p className="text-[10px] text-[#666] group-hover:text-[#888]">
                              {annotation.chat_history?.length} messages
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </motion.div>
        <div className="h-full flex gap-4">
          {/* Papers List */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="p-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-2/3 mb-2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="space-y-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {Object.entries(papersByCategory).map(([categoryId, papers]) => {
                    const category = categories.find(c => c.id === categoryId);
                    if (!papers.length) return null;
                    
                    return (
                      <motion.div 
                        key={categoryId}
                        variants={itemVariants}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: category?.color }}
                            />
                            <h3 className="text-[11px] font-medium text-[#888]">
                              {category?.name || "Uncategorized"}
                            </h3>
                          </div>
                          <span className="text-[10px] text-[#666]">
                            {papers.length} papers
                          </span>
                        </div>
                        <div className={viewMode === "list" ? "space-y-1" : "grid grid-cols-2 gap-1"}>
                          {papers.map(paper => (
                            <motion.div
                              key={paper.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Card 
                                className="flex items-start gap-2 p-2 hover:bg-[#2a2a2a] transition-colors group border-[#2a2a2a] cursor-pointer"
                                onClick={() => handlePaperClick(paper)}
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded bg-[#2a2a2a] flex items-center justify-center group-hover:bg-[#333]">
                                  <FileText className="h-4 w-4 text-[#666]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    {paper.year && (
                                      <span className="text-[10px] text-[#666]">
                                        {paper.year}
                                      </span>
                                    )}
                                    {getReadingStatus(paper.id) && (
                                      <Badge variant="outline" className="h-3.5 px-1 text-[9px] border-violet-500/30 text-violet-500">
                                        Reading
                                      </Badge>
                                    )}
                                    {paper.annotations_count && paper.annotations_count > 0 && (
                                      <span className="text-[9px] text-[#666] flex items-center gap-0.5">
                                        <MessageSquare className="h-3 w-3" />
                                        {paper.annotations_count}
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
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Add Paper Dialog */}
      <AddPaperDialog 
        open={isAddPaperOpen} 
        onOpenChange={setIsAddPaperOpen} 
      />
    </motion.div>
  );
} 