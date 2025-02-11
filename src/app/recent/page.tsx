"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Grid2x2, Search, MessageSquare, LayoutGrid, List } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers, getCategories, getAnnotationsByPaper, getReadingList, deletePaper, addToReadingList } from "@/lib/supabase/db";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cache, CACHE_KEYS } from "@/lib/cache";
import type { Paper as DbPaper, Annotation, ReadingListItem } from "@/lib/supabase/types";
import type { Paper } from "@/lib/types";
import { PaperCard } from "@/components/paper-card";
import { DeletePaperDialog } from "@/components/library/delete-paper-dialog";

// Animation variants
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

// Update the cache keys
const RECENT_CACHE_KEYS = {
  ...CACHE_KEYS,
  ANNOTATIONS: "recent_annotations",
  READING_LIST: "recent_reading_list"
} as const;

// Preload function for parallel data fetching
async function preloadData(refresh = false) {
  const cachedPapers = !refresh && cache.get<DbPaper[]>(RECENT_CACHE_KEYS.RECENT_PAPERS);
  const cachedAnnotations = !refresh && cache.get<Annotation[]>(RECENT_CACHE_KEYS.ANNOTATIONS);
  const cachedReadingList = !refresh && cache.get<ReadingListItem[]>(RECENT_CACHE_KEYS.READING_LIST);

  if (cachedPapers && cachedAnnotations && cachedReadingList) {
    return {
      papers: cachedPapers,
      annotations: cachedAnnotations,
      readingList: cachedReadingList
    };
  }

  // First get papers to get their IDs
  const papersResult = await getPapers();
  const papers = papersResult.data || [];

  // Then load everything else in parallel
  const [annotationsResults, readingListResult] = await Promise.all([
    Promise.all(papers.map(paper => getAnnotationsByPaper(paper.id))),
    getReadingList()
  ]);

  const annotations = annotationsResults
    .filter(result => !result.error)
    .flatMap(result => result.data || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const readingList = readingListResult.data || [];

  if (!refresh) {
    cache.set(RECENT_CACHE_KEYS.RECENT_PAPERS, papers);
    cache.set(RECENT_CACHE_KEYS.ANNOTATIONS, annotations);
    cache.set(RECENT_CACHE_KEYS.READING_LIST, readingList);
  }

  return { papers, annotations, readingList };
}

// Helper function to transform DB paper to UI paper
function transformPaper(paper: DbPaper, readingList: ReadingListItem[]): Paper {
  return {
    ...paper,
    citations: paper.citations || 0,
    impact: paper.impact || "low",
    url: paper.url || "",
    topics: paper.topics || [],
    in_reading_list: readingList.some(item => item.paper_id === paper.id)
  } as Paper;
}

export default function RecentPage() {
  const router = useRouter();
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [papers, setPapers] = useState<DbPaper[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paperToDelete, setPaperToDelete] = useState<DbPaper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (refresh = false) => {
    try {
      setIsLoading(true);
      const { papers, annotations, readingList } = await preloadData(refresh);
      setPapers(papers);
      setAnnotations(annotations);
      setReadingList(readingList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to load from cache first
    const cachedPapers = cache.get<DbPaper[]>(RECENT_CACHE_KEYS.RECENT_PAPERS);
    const cachedAnnotations = cache.get<Annotation[]>(RECENT_CACHE_KEYS.ANNOTATIONS);
    const cachedReadingList = cache.get<ReadingListItem[]>(RECENT_CACHE_KEYS.READING_LIST);
    
    if (cachedPapers && cachedAnnotations && cachedReadingList) {
      setPapers(cachedPapers);
      setAnnotations(cachedAnnotations);
      setReadingList(cachedReadingList);
      setIsLoading(false);
    } else {
      loadData(false);
    }
  }, []);

  const handlePaperClick = (paper: DbPaper) => {
    // Pre-fetch the paper page for instant navigation
    router.prefetch(`/paper/${paper.id}`);
    router.push(`/paper/${paper.id}`);
  };

  const handleDeletePaper = async (paper: DbPaper) => {
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
      toast.success("Paper deleted successfully");
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to delete paper");
    } finally {
      setIsDeleting(false);
      setPaperToDelete(null);
    }
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-3 bg-[#2a2a2a] border-[#333]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <div className="flex items-center justify-between pt-2 border-t border-[#333]">
              <div className="flex items-center gap-1">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <motion.div 
        className="h-full bg-[#030014]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 border-b border-[#1a1f2e]">
          <motion.div 
            className="w-full"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-[#eee]">Recent</h1>
              <Button 
                onClick={() => setIsAddPaperOpen(true)}
                className="h-8 px-3 text-[11px] bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add paper
              </Button>
            </div>
            <p className="max-w-3xl text-[11px] leading-relaxed text-[#4a5578]">
              Recently viewed and modified papers.
            </p>
          </motion.div>
        </div>

        <div className="p-6">
          <div className="w-full">
            <Tabs defaultValue="grid" className="w-full">
              <motion.div 
                className="flex items-center justify-between mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-[11px] text-[#4a5578]">
                  {papers.length} papers
                </div>
                <TabsList className="h-7 bg-[#1a1f2e] p-0.5 gap-0.5">
                  <TabsTrigger 
                    value="grid" 
                    className="h-6 w-6 p-0 data-[state=active]:bg-[#2a3142]"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="h-6 w-6 p-0 data-[state=active]:bg-[#2a3142]"
                  >
                    <List className="h-3.5 w-3.5" />
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {papers.map((paper) => (
                    <motion.div 
                      key={paper.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-full"
                    >
                      <PaperCard
                        paper={transformPaper(paper, readingList)}
                        onAddToList={async () => {
                          const result = await addToReadingList(paper.id);
                          if (!result.error) {
                            setReadingList(prev => [...prev, result.data!]);
                          }
                        }}
                        onDelete={() => handleDeletePaper(paper)}
                        isLoading={isLoading}
                        context="main"
                        showScheduleButton={!readingList.some(item => item.paper_id === paper.id)}
                        showAddToListButton={!readingList.some(item => item.paper_id === paper.id)}
                        variant="default"
                        className="h-full"
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="p-3 bg-[#2a2a2a] border-[#333]">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-3" />
                              <Skeleton className="h-3 w-8" />
                            </div>
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-6 w-6 rounded" />
                            <Skeleton className="h-6 w-6 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    className="space-y-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {papers.map((paper) => (
                      <motion.div
                        key={paper.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <PaperCard
                          paper={transformPaper(paper, readingList)}
                          onAddToList={async () => {
                            const result = await addToReadingList(paper.id);
                            if (!result.error) {
                              setReadingList(prev => [...prev, result.data!]);
                            }
                          }}
                          onDelete={() => handleDeletePaper(paper)}
                          isLoading={isLoading}
                          context="main"
                          showScheduleButton={!readingList.some(item => item.paper_id === paper.id)}
                          showAddToListButton={!readingList.some(item => item.paper_id === paper.id)}
                          variant="default"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>

      <AddPaperDialog 
        open={isAddPaperOpen} 
        onOpenChange={setIsAddPaperOpen} 
      />

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