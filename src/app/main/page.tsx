"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Grid2x2, Search, Clock, BookOpen, Filter, Activity, MessageSquare, ChevronDown, SlidersHorizontal } from "lucide-react";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers, getCategories, getReadingList, getAnnotationsByPaper } from "@/lib/supabase/db";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FilterSortDialog } from "@/components/library/filter-sort-dialog";
import { Paper } from "@/lib/types";

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isFilterSortOpen, setIsFilterSortOpen] = useState(false);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // First fetch papers, categories, and reading list
        console.log("Fetching initial data...");
        const [papersResult, categoriesResult, readingListResult] = await Promise.all([
          getPapers(),
          getCategories(),
          getReadingList()
        ]);

        if (papersResult.error) {
          console.error("Error fetching papers:", papersResult.error);
          return;
        }
        if (categoriesResult.error) {
          console.error("Error fetching categories:", categoriesResult.error);
          return;
        }
        if (readingListResult.error) {
          console.error("Error fetching reading list:", readingListResult.error);
          return;
        }

        setPapers(papersResult.data || []);
        setCategories(categoriesResult.data || []);
        setReadingList(readingListResult.data || []);

        // Get recent annotations
        console.log("Fetching annotations...");
        const allPapers = papersResult.data || [];
        console.log("Fetching annotations for all papers:", allPapers.length);
        
        try {
          const annotationsPromises = allPapers.map(paper => 
            getAnnotationsByPaper(paper.id)
          );
          const annotationsResults = await Promise.all(annotationsPromises);
          
          // Check for errors in annotation results
          const annotationErrors = annotationsResults.filter(result => result.error);
          if (annotationErrors.length > 0) {
            console.error("Errors fetching annotations:", annotationErrors);
          }

          const allAnnotations = annotationsResults
            .flatMap(result => result.data || [])
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
          
          console.log("Fetched annotations:", allAnnotations);
          setRecentAnnotations(allAnnotations);
        } catch (annotationError) {
          console.error("Error fetching annotations:", annotationError);
          setRecentAnnotations([]);
        }
      } catch (error) {
        console.error("Error in loadData:", error);
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
        paper.authors?.some((author: string) => 
          author.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesCategories = selectedCategories.length === 0 ||
        selectedCategories.includes(paper.category_id || "");

      return matchesSearch && matchesCategories;
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
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

  const handlePaperAdded = (newPaper: Paper) => {
    setPapers(prevPapers => [...prevPapers, newPaper]);
  };

  const handleFilterSort = ({ sortBy, categories: newSelectedCategories }: { sortBy: string; categories: string[] }) => {
    // Update selected categories
    setSelectedCategories(newSelectedCategories);
    
    // Sort papers
    const sorted = [...papers].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (b.created_at ? new Date(b.created_at).getTime() : 0) - 
                 (a.created_at ? new Date(a.created_at).getTime() : 0);
        case "oldest":
          return (a.created_at ? new Date(a.created_at).getTime() : 0) - 
                 (b.created_at ? new Date(b.created_at).getTime() : 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "year":
          return (b.year || 0) - (a.year || 0);
        default:
          return 0;
      }
    });
    
    setPapers(sorted);
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

          {/* Search and Controls */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
              <Input
                type="text"
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
              />
            </div>

            {/* Filter and Sort Button */}
            <Button
              onClick={() => setIsFilterSortOpen(true)}
              className="h-8 px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
            >
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              Filter & Sort
            </Button>

            {/* View Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(prev => prev === "list" ? "grid" : "list")}
              className="h-8 w-8 p-0 bg-[#2a2a2a] border border-[#333] hover:bg-[#333] flex items-center justify-center"
            >
              <Grid2x2 className="h-3.5 w-3.5 text-[#888]" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex">
        {/* Activity Sidebar */}
        <motion.div 
          className="w-[260px] flex-shrink-0"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="w-[260px] p-4 border-r border-[#2a2a2a] bg-[#1c1c1c] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full">
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
                      <p className="text-[11px] text-slate-100 group-hover:text-white line-clamp-2">
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

        {/* Papers List */}
        <div className="flex-1 min-w-0 overflow-hidden border-l border-[#2a2a2a] -ml-px">
          <ScrollArea className="h-full w-full">
            {isLoading ? (
              <div className="p-4 space-y-2 max-w-3xl mx-auto">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-3 w-2/3 mb-1.5" />
                        <Skeleton className="h-2 w-1/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <motion.div 
                className="space-y-1 p-2 max-w-3xl mx-auto"
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
                      className="mb-1 last:mb-0"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
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
                      <div className={viewMode === "list" ? "space-y-[2px]" : "grid grid-cols-2 gap-[2px]"}>
                        {papers.map(paper => (
                          <motion.div
                            key={paper.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Card 
                              className="flex items-start gap-1.5 p-2 m-2 hover:bg-[#2a2a2a] transition-colors group border-[#2a2a2a] cursor-pointer"
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

      {/* Add Paper Dialog */}
      <AddPaperDialog 
        open={isAddPaperOpen} 
        onOpenChange={setIsAddPaperOpen} 
        onPaperAdded={handlePaperAdded}
      />

      {/* Filter/Sort Dialog */}
      <FilterSortDialog
        open={isFilterSortOpen}
        onOpenChange={setIsFilterSortOpen}
        onApply={handleFilterSort}
        categories={categories.map(cat => ({
          ...cat,
          count: papers.filter(p => p.category_id === cat.id).length
        }))}
        selectedCategories={selectedCategories}
      />
    </motion.div>
  );
} 