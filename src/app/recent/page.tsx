"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Pencil, LayoutGrid, List } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getPapers } from "@/lib/supabase/db";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category?: string;
  category_id?: string;
  annotations_count?: number;
  url?: string;
  created_at?: string;
  updated_at?: string;
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

export default function RecentPage() {
  const router = useRouter();
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [recentPapers, setRecentPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPapers() {
      try {
        setIsLoading(true);
        const { data, error } = await getPapers();
        
        if (error) throw error;
        
        // Sort by most recently updated/created and take the last 10
        const sortedPapers = (data || [])
          .sort((a, b) => {
            const aDate = new Date(a.updated_at || a.created_at || "").getTime();
            const bDate = new Date(b.updated_at || b.created_at || "").getTime();
            return bDate - aDate;
          })
          .slice(0, 10);
        
        setRecentPapers(sortedPapers);
      } catch (error) {
        console.error("Error loading recent papers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPapers();
  }, []);

  const handlePaperClick = (paper: Paper) => {
    // Pre-fetch the paper page for instant navigation
    router.prefetch(`/paper/${paper.id}`);
    router.push(`/paper/${paper.id}`);
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="p-3 bg-[#2a2a2a] border-[#333]">
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
        </Card>
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
          <div className="max-w-5xl">
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
                        <Card 
                          className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors cursor-pointer"
                          onClick={() => handlePaperClick(paper)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                              <span>{paper.category}</span>
                              <span>•</span>
                              <span>{paper.year}</span>
                            </div>
                            <h3 className="text-[11px] font-medium text-[#eee] mb-1 line-clamp-2">{paper.title}</h3>
                            <p className="text-[11px] text-[#888] truncate mb-3">{paper.authors?.join(", ")}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Add edit functionality
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Add annotation functionality
                                  }}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  {paper.annotations_count > 0 && (
                                    <span className="absolute top-0.5 right-0.5 text-[10px] text-[#888]">
                                      {paper.annotations_count}
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="list">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="p-3 bg-[#2a2a2a] border-[#333]">
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
                      </Card>
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
                        <Card 
                          className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors cursor-pointer"
                          onClick={() => handlePaperClick(paper)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                                <span>{paper.category}</span>
                                <span>•</span>
                                <span>{paper.year}</span>
                              </div>
                              <h3 className="text-[11px] font-medium text-[#eee] mb-1 truncate">{paper.title}</h3>
                              <p className="text-[11px] text-[#888] truncate">{paper.authors?.join(", ")}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Add edit functionality
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Add annotation functionality
                                }}
                              >
                                <MessageSquare className="h-3 w-3" />
                                {paper.annotations_count > 0 && (
                                  <span className="absolute top-0.5 right-0.5 text-[10px] text-[#888]">
                                    {paper.annotations_count}
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
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