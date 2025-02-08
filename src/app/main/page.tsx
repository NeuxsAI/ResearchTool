"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Grid2x2, Search, Clock, BookOpen, Filter, Activity, MessageSquare, ChevronDown, SlidersHorizontal } from "lucide-react";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers, getCategories, getReadingList, getAnnotationsByPaper, schedulePaper, addToReadingList, deletePaper } from "@/lib/supabase/db";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FilterSortDialog } from "@/components/library/filter-sort-dialog";
import { PaperCard } from "@/components/paper-card";
import { Paper } from "@/lib/types";
import { useCategories } from "@/lib/context/categories-context";
import { cn } from "@/lib/utils";
import { DeletePaperDialog } from "@/components/library/delete-paper-dialog";
import { toast } from "sonner";

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
async function preloadData() {
  const [papersResult, readingListResult, categoriesResult] = await Promise.all([
    getPapers(),
    getReadingList(),
    getCategories()
  ]);

  return {
    papers: papersResult.data || [],
    readingList: readingListResult.data || [],
    categories: categoriesResult.data || []
  };
}

export default function LibraryPage() {
  const router = useRouter();
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  // State
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
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

  // Optimized data loading
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        
        const { papers, readingList, categories } = await preloadData();
        
        if (!mounted) return;

        // Set initial data
        setPapers(papers);
        setReadingList(readingList);

        // Load annotations in parallel for all papers
        const annotationsPromises = papers.map(paper => getAnnotationsByPaper(paper.id));
        const annotationsResults = await Promise.all(annotationsPromises);
        
        if (!mounted) return;

        const allAnnotations = annotationsResults
          .filter(result => !result.error)
          .flatMap(result => result.data || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        setRecentAnnotations(allAnnotations);
      } catch (error) {
        console.error("Error in loadData:", error);
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
      setRecentAnnotations(prevAnnotations => 
        prevAnnotations.filter(a => a.paper_id !== paperToDelete.id)
      );
      
      toast.success("Paper deleted successfully");
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to delete paper");
    } finally {
      setIsDeleting(false);
      setPaperToDelete(null);
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
              onClick={() => setFilterDialogOpen(true)}
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
                className="space-y-1 p-2 mx-auto"
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
                      className="mb-4 last:mb-0"
                    >
                      <div className="flex items-center gap-2 mb-2 px-2">
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
                              viewMode === "list" ? "max-w-4xl p-2  mx-auto" : "h-full"
                            )}
                          >
                            <PaperCard
                              paper={{
                                ...paper,
                                citations: paper.citations || 0,
                                impact: paper.impact || "low",
                                url: paper.url || "",
                                topics: paper.topics || [],
                                category: categories.find(c => c.id === paper.category_id),
                                in_reading_list: readingList.some(item => item.paper_id === paper.id),
                                scheduled_date: paper.scheduled_date,
                                estimated_time: paper.estimated_time,
                                repeat: paper.repeat
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
                              isLoading={isLoading}
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

      {renderFilterDialog()}

      {/* Add Delete Dialog */}
      <DeletePaperDialog
        open={Boolean(paperToDelete)}
        onOpenChange={(open) => !open && setPaperToDelete(null)}
        onConfirm={handleConfirmDelete}
        paperTitle={paperToDelete?.title || ""}
        isDeleting={isDeleting}
      />
    </motion.div>
  );
} 