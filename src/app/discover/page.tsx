"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, Loader2, BookOpen, FileText, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Paper } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { addToReadingList } from "@/lib/supabase/db";
import { cache, CACHE_KEYS } from '@/lib/cache';
import { PaperCard } from "@/components/paper-card";
import { createClient } from "@/lib/supabase/client";

// Preload function for parallel data fetching
async function preloadPapers(refresh = false) {
  const cachedRecommended = !refresh && cache.get(CACHE_KEYS.RECOMMENDED_PAPERS);
  const cachedTrending = !refresh && cache.get(CACHE_KEYS.TRENDING_PAPERS);

  if (cachedRecommended && cachedTrending) {
    return {
      recommended: cachedRecommended,
      trending: cachedTrending
    };
  }

  const [recommendedResponse, trendingResponse] = await Promise.all([
    fetch(`/api/papers/discover${refresh ? '?refresh=true' : ''}`).then(r => r.json()),
    fetch(`/api/papers/trending${refresh ? '?refresh=true' : ''}`).then(r => r.json())
  ]);

  const recommended = recommendedResponse.papers || [];
  const trending = trendingResponse.papers || [];

  if (!refresh) {
    cache.set(CACHE_KEYS.RECOMMENDED_PAPERS, recommended);
    cache.set(CACHE_KEYS.TRENDING_PAPERS, trending);
  }

  return {
    recommended,
    trending
  };
}

export default function DiscoverPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [trendingPapers, setTrendingPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingPaperId, setAddingPaperId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('recommended');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const loadPapers = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const { recommended, trending } = await preloadPapers(refresh);
      setPapers(recommended);
      setTrendingPapers(trending);
    } catch (error) {
      console.error('Error loading papers:', error);
      toast.error('Failed to load papers');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Try to load from cache first
    const cachedRecommended = cache.get<Paper[]>(CACHE_KEYS.RECOMMENDED_PAPERS);
    const cachedTrending = cache.get<Paper[]>(CACHE_KEYS.TRENDING_PAPERS);
    
    if (cachedRecommended && cachedTrending) {
      setPapers(cachedRecommended);
      setTrendingPapers(cachedTrending);
      setIsLoading(false);
    } else {
      loadPapers(false);
    }
  }, []);

  const handleRefresh = async () => {
    await loadPapers(true);
  };

  const handleAddPaper = async (paper: Paper) => {
    setAddingPaperId(paper.id);
    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Create form data - same as add-paper-dialog
      const formData = new FormData();
      formData.append('title', paper.title);
      formData.append('authors', JSON.stringify(paper.authors));
      formData.append('year', paper.year.toString());
      formData.append('abstract', paper.abstract || '');
      formData.append('url', paper.url || '');
      if (paper.arxiv_id) {
        formData.append('arxiv_id', paper.arxiv_id);
      }

      // Submit to API route - same as add-paper-dialog
      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to create paper:', data);
        throw new Error(data.error || 'Failed to create paper');
      }

      const data = await response.json();

      // Then add it to the reading list
      const result = await addToReadingList(data.paper.id);

      if (!result.data) {
        throw new Error('Failed to add paper to reading list');
      }

      toast.success('Paper added to library');
      router.push(`/paper/${data.paper.id}`);
    } catch (error) {
      console.error('Error adding paper:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add paper');
    } finally {
      setAddingPaperId(null);
    }
  };

  const paginate = (newDirection: number) => {
    const currentPapers = activeTab === 'recommended' ? papers : trendingPapers;
    setDirection(newDirection);
    
    if (newDirection === 1) { // Next
      setCurrentIndex((prev) => (prev + 1) % currentPapers.length);
    } else { // Previous
      setCurrentIndex((prev) => (prev - 1 + currentPapers.length) % currentPapers.length);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const renderPaperCard = (paper: Paper) => (
    <motion.div
      className="absolute w-full h-full p-10"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
    >
      <PaperCard
        paper={paper}
        onAddToLibrary={() => handleAddPaper(paper)}
        isAdding={addingPaperId === paper.id}
        context="discover"
        variant="default"
        showScheduleButton={false}
        showCategoryButton={false}
        className="max-h-[500px]"
      />
    </motion.div>
  );

  return (
    <MainLayout>
      <div className="h-full bg-[#030014]">
        <div className="p-6 border-b border-[#1a1f2e]">
          <div className="max-w-3xl">
            <h1 className="text-xl font-semibold text-white mb-2">Discover</h1>
            <p className="text-sm text-[#4a5578]">
              Discover trending and recommended papers based on your interests.
            </p>
          </div>
        </div>

        <div className="p-6">
          <Tabs 
            defaultValue="recommended" 
            className="w-full mx-auto relative"
            onValueChange={(value) => {
              setActiveTab(value);
              setCurrentIndex(0);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList className="h-9 bg-[#030014] border border-[#1a1f2e] p-1 items-center mx-auto">
                <TabsTrigger 
                  value="recommended" 
                  className="h-7 px-4 text-xs data-[state=active]:bg-[#1a1f2e]"
                >
                  <Star className="h-3.5 w-3.5 mr-2" />
                  Recommended
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="h-7 px-4 text-xs data-[state=active]:bg-[#1a1f2e]"
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                  Trending
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-[#1a1f2e] hover:bg-[#2a3142] shrink-0 mr-4"
                onClick={() => paginate(-1)}
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </Button>

              <div className="relative h-[400px] flex-1">
                {isLoading ? (
                  <Card className="h-full bg-[#030014] border-[#2a2a2a] animate-pulse p-4">
                    <div className="p-4">
                      <div className="h-4 bg-[#2a2a2a] rounded w-1/4 mb-2" />
                      <div className="h-6 bg-[#2a2a2a] rounded w-3/4 mb-2" />
                      <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
                    </div>
                  </Card>
                ) : (
                  <AnimatePresence initial={false} custom={direction}>
                    {activeTab === 'recommended' && papers.length > 0 ? 
                      renderPaperCard(papers[currentIndex]) :
                      trendingPapers.length > 0 ? 
                      renderPaperCard(trendingPapers[currentIndex]) :
                      null
                    }
                  </AnimatePresence>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-[#1a1f2e] hover:bg-[#2a3142] shrink-0 ml-4"
                onClick={() => paginate(1)}
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
} 