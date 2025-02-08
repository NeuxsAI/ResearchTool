"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, Loader2, BookOpen, FileText, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { toast } from "sonner";
import { addPaperFromDiscovery } from "@/lib/supabase/db";
import { useRouter } from "next/navigation";
import { Paper } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { addToReadingList } from "@/lib/supabase/db";
import { cache, CACHE_KEYS } from '@/lib/cache';

// Preload function for parallel data fetching
async function preloadPapers(refresh = false) {
  const cachedRecommended = !refresh && cache.get(CACHE_KEYS.RECOMMENDED_PAPERS);
  const cachedTrending = !refresh && cache.get(CACHE_KEYS.TRENDING_PAPERS);

  const [recommendedResponse, trendingResponse] = await Promise.all([
    cachedRecommended ? 
      { ok: true, papers: cachedRecommended } : 
      fetch(`/api/papers/discover${refresh ? '?refresh=true' : ''}`).then(r => r.json()),
    cachedTrending ? 
      { ok: true, papers: cachedTrending } : 
      fetch(`/api/papers/trending${refresh ? '?refresh=true' : ''}`).then(r => r.json())
  ]);

  if (recommendedResponse.papers) {
    cache.set(CACHE_KEYS.RECOMMENDED_PAPERS, recommendedResponse.papers);
  }
  if (trendingResponse.papers) {
    cache.set(CACHE_KEYS.TRENDING_PAPERS, trendingResponse.papers);
  }

  return {
    recommended: recommendedResponse.papers || [],
    trending: trendingResponse.papers || []
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
    loadPapers(false);
  }, []);

  const handleRefresh = async () => {
    await loadPapers(true);
  };

  const handleAddPaper = async (paper: Paper) => {
    setAddingPaperId(paper.id);
    try {
      const result = await addToReadingList(paper.id, {
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        abstract: paper.abstract,
        url: paper.url,
        citations: paper.citations,
        impact: paper.impact,
        topics: paper.topics
      });
      
      if (result.error) {
        throw result.error;
      }
      
      // Show success message
      toast.success("Paper has been added to your library");

      // Update the paper's state in the appropriate list
      const updatePaperList = (papers: Paper[]) => 
        papers.map(p => p.id === paper.id ? { ...p, in_reading_list: true } : p);

      if (activeTab === "recommended") {
        setPapers(updatePaperList);
      } else {
        setTrendingPapers(updatePaperList);
      }

      // Navigate to the paper page
      router.push(`/paper/${paper.id}`);
    } catch (error) {
      console.error('Error adding paper:', error);
      toast.error("Failed to add paper to library");
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
      className="absolute w-full h-full"
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
      <Card 
        className="max-h-[500px] bg-[#1c1c1c] border-[#2a2a2a] overflow-auto cursor-pointer hover:border-[#3a3a3a] transition-colors"
        onClick={() => router.push(`/paper/${paper.id}`)}
      >
        <div className="sticky top-0 z-10 bg-[#1c1c1c] p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[11px] text-[#666]">{paper.year}</span>
            <span className="text-[11px] text-[#666]">•</span>
            <span className="text-[11px] text-[#666]">{paper.citations} citations</span>
            <Badge 
              variant="secondary" 
              className={
                paper.impact === "high"
                  ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20"
                  : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
              }
            >
              {paper.impact === "high" ? "High Impact" : "Low Impact"}
            </Badge>
          </div>
          
          <h3 className="text-lg font-medium text-white mb-2">
            {paper.title}
          </h3>
          
          <p className="text-sm text-[#888]">
            {paper.authors.join(", ")}
          </p>
        </div>
        
        <div className="p-4">
          {paper.abstract && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-1.5">Abstract</h4>
              <p className="text-sm text-[#888] leading-relaxed mb-16">
                {paper.abstract}
              </p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-white mb-1.5">Topics</h4>
            <div className="flex flex-wrap gap-1">
              {paper.topics.map((topic, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-[#2a2a2a] text-[#888] text-xs px-2 py-0.5"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1c1c1c] border-t border-[#2a2a2a] p-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-[#888] hover:text-white hover:bg-[#333]"
            onClick={() => handleAddPaper(paper)}
            disabled={addingPaperId === paper.id || paper.in_reading_list}
          >
            {addingPaperId === paper.id ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Adding to Library...
              </>
            ) : paper.in_reading_list ? (
              <>
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                In Library
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Add to Library
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <MainLayout>
      <div className="h-full bg-[#1c1c1c]">
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="max-w-3xl">
            <h1 className="text-xl font-semibold text-white mb-2">Discover</h1>
            <p className="text-sm text-[#888]">
              Discover trending and recommended papers based on your interests.
            </p>
          </div>
        </div>

        <div className="p-6">
          <Tabs 
            defaultValue="recommended" 
            className="w-full max-w-2xl mx-auto relative"
            onValueChange={(value) => {
              setActiveTab(value);
              setCurrentIndex(0);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList className="h-9 bg-[#1c1c1c] border border-[#2a2a2a] p-1">
                <TabsTrigger 
                  value="recommended" 
                  className="h-7 px-4 text-xs data-[state=active]:bg-[#2a2a2a]"
                >
                  <Star className="h-3.5 w-3.5 mr-2" />
                  Recommended
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="h-7 px-4 text-xs data-[state=active]:bg-[#2a2a2a]"
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                  Trending
                </TabsTrigger>
              </TabsList>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs text-[#888] hover:text-white hover:bg-[#2a2a2a]"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-[#2a2a2a] hover:bg-[#333] shrink-0 mr-4"
                onClick={() => paginate(-1)}
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </Button>

              <div className="relative h-[400px] flex-1">
                {isLoading ? (
                  <Card className="h-full bg-[#1c1c1c] border-[#2a2a2a] animate-pulse">
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
                className="h-8 w-8 rounded-full bg-[#2a2a2a] hover:bg-[#333] shrink-0 ml-4"
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