"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Grid2x2, Search, Clock, BookOpen, Filter, Activity, MessageSquare, ChevronDown, SlidersHorizontal, Trash2, Pencil, LayoutGrid, List, Settings2, Sparkles } from "lucide-react";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers, getCategories, getReadingList, getAnnotationsByPaper, schedulePaper, addToReadingList, deletePaper } from "@/lib/supabase/db";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FilterSortDialog } from "@/components/library/filter-sort-dialog";
import { PaperCard, PaperCardSkeleton } from "@/components/paper-card";
import type { Paper } from "@/lib/supabase/types";
import { useCategories } from "@/lib/context/categories-context";
import { cn } from "@/lib/utils";
import { DeletePaperDialog } from "@/components/library/delete-paper-dialog";
import { toast } from "sonner";
import { cache, CACHE_KEYS } from "@/lib/cache";
import supabase from "@/lib/supabase/client";
import { MainLayout } from "@/components/layout/main-layout";

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

// Preload function for parallel data fetching
async function preloadData(refresh = false) {
  const cachedPapers = !refresh && cache.get<Paper[]>(CACHE_KEYS.PAPERS);
  const cachedCategories = !refresh && cache.get<Category[]>(CACHE_KEYS.CATEGORIES);
  const cachedReadingList = !refresh && cache.get<ReadingListItem[]>(CACHE_KEYS.READING_LIST);
  const cachedAnnotations = !refresh && cache.get(CACHE_KEYS.ANNOTATIONS as unknown as string) as Annotation[] | null;

  if (cachedPapers && cachedCategories && cachedReadingList && cachedAnnotations) {
    return {
      papers: cachedPapers,
      categories: cachedCategories,
      readingList: cachedReadingList,
      annotations: cachedAnnotations
    };
  }

  // Load everything in parallel
  const [papersResult, categoriesResult, readingListResult, annotationsResult] = await Promise.all([
    getPapers(),
    getCategories(),
    getReadingList(),
    // Only fetch recent annotations instead of for every paper
    supabase
      .from('annotations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  const papers = papersResult.data || [];
  const categories = categoriesResult.data || [];
  const readingList = readingListResult.data || [];
  const annotations = annotationsResult.data || [];

  if (!refresh) {
    cache.set(CACHE_KEYS.PAPERS, papers);
    cache.set(CACHE_KEYS.CATEGORIES, categories);
    cache.set(CACHE_KEYS.READING_LIST, readingList);
    cache.set(CACHE_KEYS.ANNOTATIONS as unknown as string, annotations);
  }

  return { papers, categories, readingList, annotations };
}

export default function LibraryPage() {
  const router = useRouter();
  const { categories: contextCategories, isLoading: isCategoriesLoading } = useCategories();
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
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (refresh = false) => {
    try {
      setIsLoading(true);
      const { papers, categories, readingList, annotations } = await preloadData(refresh);
      setPapers(papers);
      setCategories(categories);
      setReadingList(readingList);
      setRecentAnnotations(annotations);
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
    const cachedCategories = cache.get<Category[]>(CACHE_KEYS.CATEGORIES);
    const cachedReadingList = cache.get<ReadingListItem[]>(CACHE_KEYS.READING_LIST);
    const cachedAnnotations = cache.get<Annotation[]>(CACHE_KEYS.ANNOTATIONS as unknown as string);
    
    if (cachedPapers && cachedCategories && cachedReadingList && cachedAnnotations) {
      setPapers(cachedPapers);
      setCategories(cachedCategories);
      setReadingList(cachedReadingList);
      setRecentAnnotations(cachedAnnotations);
      setIsLoading(false);
    } else {
      loadData(false);
    }
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
        selectedCategories.includes(paper.category_id || "uncategorized");

      return matchesSearch && matchesCategories;
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

  // Group papers by category
  const papersByCategory = {
    ...categories.reduce((acc, category) => {
      acc[category.id] = filteredPapers.filter(
        paper => paper?.category_id === category.id
      );
      return acc;
    }, {} as Record<string, Paper[]>),
    uncategorized: filteredPapers.filter(paper => !paper?.category_id)
  };

  // Get reading status
  const getReadingStatus = (paperId: string) => {
    return readingList.find(item => item.paper_id === paperId) 
      ? "In Reading List"
      : undefined;
  };

  // Split categories into visible and overflow
  const MAX_VISIBLE_CATEGORIES = 3;
  const visibleCategories = categories
    .filter(category => papers.filter(p => p?.category_id === category.id).length > 0)
    .slice(0, MAX_VISIBLE_CATEGORIES);
  
  const overflowCategories = categories
    .filter(category => papers.filter(p => p?.category_id === category.id).length > 0)
    .slice(MAX_VISIBLE_CATEGORIES);

  const handlePaperClick = (paper: Paper) => {
    // Pre-fetch the paper page for instant navigation
    router.prefetch(`/paper/${paper.id}`);
    router.push(`/paper/${paper.id}`);
  };

  const handlePaperAdded = (newPaper: Paper) => {
    setPapers(prevPapers => [...prevPapers, newPaper]);
  };

  const handleFilterApply = ({ sortBy, categories: newSelectedCategories }: { sortBy: string; categories: string[] }) => {
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

  const handleSchedulePaper = async (paperId: string, date: Date, estimatedTime?: number, repeat?: "daily" | "weekly" | "monthly" | "none") => {
    try {
      const result = await schedulePaper(paperId, date, estimatedTime, repeat);
      if (result.error) {
        console.error("Error scheduling paper:", result.error);
        return;
      }

      // Update papers state to reflect scheduling
      setPapers(prevPapers => 
        prevPapers.map(paper => 
          paper.id === paperId 
            ? { 
                ...paper, 
                scheduled_date: date.toISOString(),
                estimated_time: estimatedTime,
                repeat: repeat
              }
            : paper
        )
      );
    } catch (error) {
      console.error("Error scheduling paper:", error);
    }
  };

  const handleDeletePaper = (paper: Paper) => {
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

      // Just reload the data instead of trying to manage state
      await loadData(true);
      
      // Clean up dialog state
      setPaperToDelete(null);
      setIsDeleting(false);
      
      toast.success("Paper deleted successfully");
    } catch (error) {
      console.error("Error deleting paper:", error);
      // Clean up dialog state even on error
      setPaperToDelete(null);
      setIsDeleting(false);
      toast.error("Failed to delete paper");
    }
  };

  const renderFilterDialog = () => {
    if (isCategoriesLoading) return null;
    
    return (
      <FilterSortDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        categories={categories}
        selectedCategories={selectedCategories}
        onApply={handleFilterApply}
      />
    );
  };

  // Render category section
  const renderCategorySection = (categoryId: string, papers: Paper[]) => {
    if (!papers.length) return null;
    
    const category = categories.find(c => c.id === categoryId);
    const isUncategorized = categoryId === 'uncategorized';
    
    return (
      <motion.div 
        key={categoryId}
        variants={itemVariants}
        className="mb-4 last:mb-0"
      >
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ 
                backgroundColor: isUncategorized ? '#666666' : category?.color 
              }}
            />
            <h3 className="text-[11px] font-medium text-[#888]">
              {isUncategorized ? "Uncategorized" : category?.name}
            </h3>
          </div>
          <span className="text-[10px] text-[#666]">
            {papers.length} papers
          </span>
        </div>
        <div className={cn(
          viewMode === "list" 
            ? "space-y-[2px]" 
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-2"
        )}>
          {papers.map(paper => (
            <motion.div
              key={paper.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "min-h-[180px]",
                viewMode === "list" ? "max-w-4xl p-2 mx-auto" : "h-full"
              )}
            >
              <PaperCard
                paper={{
                  ...paper,
                  citations: paper?.citations || 0,
                  impact: paper?.impact || "low",
                  url: paper?.url || "",
                  topics: paper?.topics || [],
                  category: categories.find(c => c.id === paper?.category_id),
                  in_reading_list: readingList.some(item => item.paper_id === paper.id),
                  scheduled_date: paper?.scheduled_date,
                  estimated_time: paper?.estimated_time,
                  repeat: paper?.repeat
                }}
                onAddToList={async () => {
                  const result = await addToReadingList(paper.id);
                  if (!result.error) {
                    setReadingList(prev => [...prev, result.data!]);
                  }
                }}
                onSchedule={(date, estimatedTime, repeat) => 
                  handleSchedulePaper(paper.id, date, estimatedTime, repeat)
                }
                onDelete={() => handleDeletePaper(paper)}
                isLoading={isDeleting && paperToDelete?.id === paper.id}
                context="main"
                showScheduleButton={!readingList.some(item => item.paper_id === paper.id)}
                showAddToListButton={!readingList.some(item => item.paper_id === paper.id)}
                variant={viewMode === "list" ? "default" : "compact"}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <motion.div 
        className="flex flex-col h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-shrink-0 border-b border-[#1a1f2e] bg-[#030014]">
          <motion.div 
            className="p-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-sm font-medium text-white">My Library</h1>
                <p className="text-xs text-[#4a5578]">
                  Browse and manage your research papers and ideas
                </p>
              </div>
              <div className="h-8 w-24 bg-[#1a1f2e] rounded animate-pulse" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="h-8 bg-[#1a1f2e] rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-[#1a1f2e] rounded animate-pulse" />
              <div className="h-8 w-8 bg-[#1a1f2e] rounded animate-pulse" />
            </div>
          </motion.div>
        </div>

        <div className="flex-1 min-h-0 flex">
          {/* Activity Sidebar */}
          <motion.div 
            className="w-[260px] flex-shrink-0 p-4 border-r border-[#1a1f2e] bg-[#030014]"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="space-y-6">
              <div>
                <div className="h-4 w-24 bg-[#1a1f2e] rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-[#1a1f2e] rounded animate-pulse" />
                  ))}
                </div>
              </div>
              <div>
                <div className="h-4 w-32 bg-[#1a1f2e] rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-[#1a1f2e] rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Papers List */}
          <motion.div 
            className="flex-1 min-w-0 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <PaperCardSkeleton key={i} />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (papers.length === 0) {
    return (
      <motion.div 
        className="flex flex-col h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-shrink-0 border-b border-[#1a1f2e] bg-[#030014]">
          <motion.div 
            className="p-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-sm font-medium text-white">My Library</h1>
                <p className="text-xs text-[#4a5578]">
                  Browse and manage your research papers and ideas
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center max-w-md text-center">
            <div className="w-12 h-12 rounded-full bg-[#1a1f2e] flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Your Library is Empty</h2>
            <p className="text-sm text-[#4a5578] mb-8">
              Start building your research collection by adding papers. You can import PDFs directly or add them from external sources.
            </p>
            <div className="flex flex-col w-full gap-3">
              <Button 
                onClick={() => setIsAddPaperOpen(true)}
                className="h-9 px-4 text-sm bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Paper
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/discover')}
                className="h-9 px-4 text-sm border-[#1a1f2e] hover:bg-[#1a1f2e] text-[#4a5578]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Discover Research Papers
              </Button>
            </div>
          </div>
        </div>

        {/* Add Paper Dialog */}
        <AddPaperDialog 
          open={isAddPaperOpen} 
          onOpenChange={setIsAddPaperOpen} 
          onPaperAdded={handlePaperAdded}
        />
      </motion.div>
    );
  } 

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1a1f2e] bg-[#030014]">
        <motion.div 
          className="p-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-sm font-medium text-white">My Library</h1>
              <p className="text-xs text-[#4a5578]">
                Browse and manage your research papers and ideas
              </p>
            </div>
            <Button 
              onClick={() => setIsAddPaperOpen(true)}
              className="h-8 px-3 text-[11px] bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add paper
            </Button>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4a5578]" />
              <Input
                type="text"
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-[11px] bg-[#1a1f2e] border-[#2a3142] text-white placeholder:text-[#4a5578]"
              />
            </div>

            {/* Filter and Sort Button */}
            <Button
              onClick={() => setFilterDialogOpen(true)}
              className="h-8 px-3 text-[11px] bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
            >
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              Filter & Sort
            </Button>

            {/* View Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(prev => prev === "list" ? "grid" : "list")}
              className="h-8 w-8 p-0 bg-[#1a1f2e] border border-[#2a3142] hover:bg-[#2a3142] flex items-center justify-center"
            >
              <Grid2x2 className="h-3.5 w-3.5 text-[#4a5578]" />
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
          {papers.length === 0 ? (
            <div className="w-[260px] p-4 border-r border-[#2a2a2a] bg-[#030014] h-full flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <Clock className="h-8 w-8 text-[#4a5578] mb-2" />
                <h3 className="text-sm font-medium text-white">No Activity Yet</h3>
                <p className="text-xs text-[#888] mt-1">
                  Add some papers to see your recent activity here
                </p>
              </div>
              <Button
                onClick={() => setIsAddPaperOpen(true)}
                className="h-8 px-3 text-[11px] bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add your first paper
              </Button>
            </div>
          ) : (
            <div className="w-[260px] p-4 border-r border-[#2a2a2a] bg-[#030014] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-full">
              <h3 className="text-sm font-medium text-white mb-4">Recent Activity</h3>
              
              {/* Reading Progress */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-[#888] mb-2">
                  Reading List
                </h4>
                <div className="space-y-1">
                  {readingList.slice(0, 3).map(item => {
                    const paper = papers.find(p => p.id === item.paper_id);
                    if (!paper) return null;
                    
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-2 hover:bg-[#2a2a2a] p-2 rounded cursor-pointer transition-colors group"
                        onClick={() => handlePaperClick(paper)}
                      >
                        <BookOpen className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-[#888] group-hover:text-white truncate leading-snug">
                            {paper.title}
                          </div>
                        </div>
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

              {/* Recent Annotations */}
              <div className="mt-6">
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
            </div>
          )}
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
                className="space-y-1 p-2 mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Render categorized papers first */}
                {Object.entries(papersByCategory)
                  .filter(([categoryId]) => categoryId !== 'uncategorized')
                  .map(([categoryId, papers]) => renderCategorySection(categoryId, papers))}
                
                {/* Render uncategorized papers last */}
                {renderCategorySection('uncategorized', papersByCategory.uncategorized)}
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

      {renderFilterDialog()}

      {/* Add Delete Dialog */}
      <DeletePaperDialog
        open={Boolean(paperToDelete)}
        onOpenChange={(open) => !open && setPaperToDelete(null)}
        paperId={paperToDelete?.id || ""}
        paperTitle={paperToDelete?.title || ""}
        onSuccess={() => {
          setPapers(prevPapers => prevPapers.filter(p => p.id !== paperToDelete?.id));
        }}
      />
    </motion.div>
  );
} 