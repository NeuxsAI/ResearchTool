"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Search, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers, getCategories } from "@/lib/supabase/db";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cache, CACHE_KEYS } from "@/lib/cache";

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
  const cachedCategories = !refresh && cache.get<Category[]>(CACHE_KEYS.CATEGORIES);
  const cachedPapers = !refresh && cache.get<Paper[]>(CACHE_KEYS.PAPERS);

  if (cachedCategories && cachedPapers) {
    return {
      categories: cachedCategories,
      papers: cachedPapers
    };
  }

  const [categoriesResult, papersResult] = await Promise.all([
    getCategories(),
    getPapers()
  ]);

  const categories = categoriesResult.data || [];
  const papers = papersResult.data || [];

  if (!refresh) {
    cache.set(CACHE_KEYS.CATEGORIES, categories);
    cache.set(CACHE_KEYS.PAPERS, papers);
  }

  return { categories, papers };
}

export default function CategoriesPage() {
  const router = useRouter();
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (refresh = false) => {
    try {
      setIsLoading(true);
      const { categories, papers } = await preloadData(refresh);
      setCategories(categories);
      setPapers(papers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to load from cache first
    const cachedCategories = cache.get<Category[]>(CACHE_KEYS.CATEGORIES);
    const cachedPapers = cache.get<Paper[]>(CACHE_KEYS.PAPERS);
    
    if (cachedCategories && cachedPapers) {
      setCategories(cachedCategories);
      setPapers(cachedPapers);
      setIsLoading(false);
    } else {
      loadData(false);
    }
  }, []);

  // Filter papers by search query
  const filteredPapers = papers.filter(paper => {
    const matchesSearch = searchQuery === "" || 
      paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors?.some(author => 
        author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  // Group papers by category
  const papersByCategory = categories.reduce((acc, category) => {
    acc[category.id] = filteredPapers.filter(
      paper => paper.category_id === category.id
    );
    return acc;
  }, {} as Record<string, Paper[]>);

  const handlePaperClick = (paper: Paper) => {
    // Pre-fetch the paper page for instant navigation
    router.prefetch(`/paper/${paper.id}`);
    router.push(`/paper/${paper.id}`);
  };

  const handlePaperAdded = (newPaper: Paper) => {
    setPapers(prevPapers => [...prevPapers, newPaper]);
  };

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div 
        className="flex-shrink-0 border-b border-[#2a2a2a] bg-[#030014] p-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-medium text-white">Categories</h1>
            <p className="text-xs text-[#888]">
              Browse papers by category
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers..."
            className="pl-8 h-8 text-[11px] bg-[#2a2a2a] border-[#333] focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 p-4">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, j) => (
                      <Card key={j} className="p-3 bg-[#2a2a2a] border-[#333]">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-8 w-8 rounded" />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-3" />
                              <Skeleton className="h-3 w-8" />
                            </div>
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {categories.map(category => {
                const papers = papersByCategory[category.id] || [];
                if (!papers.length) return null;

                return (
                  <motion.div 
                    key={category.id}
                    variants={itemVariants}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h3 className="text-[11px] font-medium text-[#888]">
                        {category.name}
                      </h3>
                      <span className="text-[10px] text-[#666]">
                        {papers.length} papers
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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

      {/* Add Paper Dialog */}
      <AddPaperDialog 
        open={isAddPaperOpen} 
        onOpenChange={setIsAddPaperOpen} 
        onPaperAdded={handlePaperAdded}
      />
    </motion.div>
  );
} 