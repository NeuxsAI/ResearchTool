"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Pencil, LayoutGrid, List } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers, getCategories } from "@/lib/supabase/db";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { PaperCard } from "@/components/paper-card";
import { cache, CACHE_KEYS } from '@/lib/cache';

interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category?: string;
  category_id?: string;
  category_color?: string;
  annotations_count?: number;
  url?: string;
  created_at?: string;
  updated_at?: string;
  abstract?: string;
  citations?: number;
  institution?: string;
  impact?: "high" | "low";
  topics?: string[];
  scheduled_date?: string;
  estimated_time?: number;
  repeat?: "daily" | "weekly" | "monthly" | "none";
  in_reading_list?: boolean;
}

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

// Preload function for parallel data fetching
async function preloadData() {
  const [papersResult, categoriesResult] = await Promise.all([
    getPapers(),
    getCategories()
  ]);

  // Sort and process papers
  const sortedPapers = (papersResult.data || [])
    .map(paper => {
      const category = categoriesResult.data?.find(c => c.id === paper.category_id);
      return {
        ...paper,
        category: category?.name,
        category_color: category?.color
      };
    })
    .sort((a, b) => {
      const aDate = new Date(a.updated_at || a.created_at || "").getTime();
      const bDate = new Date(b.updated_at || b.created_at || "").getTime();
      return bDate - aDate;
    })
    .slice(0, 10);

  cache.set(CACHE_KEYS.RECENT_PAPERS, sortedPapers);
  return { papers: sortedPapers, categories: categoriesResult.data };
}

export default function RecentPage() {
  const router = useRouter();
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [recentPapers, setRecentPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPapers() {
      try {
        setIsLoading(true);
        
        // Try to get from cache first
        const cachedPapers = cache.get(CACHE_KEYS.RECENT_PAPERS);
        if (cachedPapers && mounted) {
          setRecentPapers(cachedPapers);
          setIsLoading(false);
          return;
        }

        const { papers } = await preloadData();
        if (mounted) {
          setRecentPapers(papers);
        }
      } catch (error) {
        console.error("Error loading recent papers:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadPapers();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePaperClick = (paper: Paper) => {
    // Pre-fetch the paper page for instant navigation
    router.prefetch(`/paper/${paper.id}`);
    router.push(`/paper/${paper.id}`);
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
        className="h-full bg-[#1c1c1c]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 border-b border-[#2a2a2a]">
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
                className="h-8 px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add paper
              </Button>
            </div>
            <p className="max-w-3xl text-[11px] leading-relaxed text-[#888]">
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
                <div className="text-[11px] text-[#666]">
                  {recentPapers.length} papers
                </div>
                <TabsList className="h-7 bg-[#2a2a2a] p-0.5 gap-0.5">
                  <TabsTrigger 
                    value="grid" 
                    className="h-6 w-6 p-0 data-[state=active]:bg-[#333]"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="h-6 w-6 p-0 data-[state=active]:bg-[#333]"
                  >
                    <List className="h-3.5 w-3.5" />
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="grid">
                {isLoading ? (
                  renderSkeletons()
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {recentPapers.map((paper) => (
                      <motion.div 
                        key={paper.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <PaperCard
                          paper={{
                            ...paper,
                            citations: paper.citations || 0,
                            impact: paper.impact || "low",
                            topics: paper.topics || [],
                            url: paper.url || "",
                            scheduled_date: paper.scheduled_date,
                            estimated_time: paper.estimated_time,
                            repeat: paper.repeat,
                            in_reading_list: paper.in_reading_list,
                            category: paper.category_id ? {
                              id: paper.category_id,
                              name: paper.category || "",
                              color: paper.category_color
                            } : undefined
                          }}
                          onSchedule={(date, time, repeat) => {}}
                          isLoading={isLoading}
                          context="recent"
                          showAddToListButton={false}
                          variant="compact"
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
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
                    {recentPapers.map((paper) => (
                      <motion.div
                        key={paper.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <PaperCard
                          paper={{
                            ...paper,
                            citations: paper.citations || 0,
                            impact: paper.impact || "low",
                            topics: paper.topics || [],
                            url: paper.url || "",
                            scheduled_date: paper.scheduled_date,
                            estimated_time: paper.estimated_time,
                            repeat: paper.repeat,
                            in_reading_list: paper.in_reading_list,
                            category: paper.category_id ? {
                              id: paper.category_id,
                              name: paper.category || "",
                              color: paper.category_color
                            } : undefined
                          }}
                          onSchedule={(date, time, repeat) => {}}
                          isLoading={isLoading}
                          context="recent"
                          showAddToListButton={false}
                          variant="compact"
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
    </MainLayout>
  );
} 