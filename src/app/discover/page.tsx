"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, Loader2, BookOpen, FileText, ChevronLeft, ChevronRight, RefreshCw, Search, Sparkles, Brain, Filter, X, AlertCircle, List, Grid2x2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchViewMode, setSearchViewMode] = useState<'normal' | 'grid'>('normal');
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all-time");
  const [selectedImpact, setSelectedImpact] = useState<string>("any-impact");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTopics, setEditingTopics] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const router = useRouter();

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

  const exampleQueries = [
    { text: "Attention mechanisms", icon: Sparkles },
    { text: "Geoffrey Hinton", icon: BookOpen },
    { text: "Large language models", icon: Brain }
  ];

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

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setSearchError(null);
    setHasSearched(true);
    
    try {
      const response = await fetch('/api/papers/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          dateRange: selectedDateRange,
          impact: selectedImpact,
          topics: selectedTopics,
          page: 1,
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search papers');
      }

      const data = await response.json();
      
      const mappedPapers = (data.papers || []).map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors || [],
        year: paper.year || new Date().getFullYear(),
        citations: paper.citations || 0,
        impact: paper.impact || "low",
        url: paper.url,
        topics: paper.topics || [],
        institution: paper.institution,
        in_reading_list: paper.in_reading_list
      }));
      
      setSearchResults(mappedPapers);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search papers');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuery = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
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
            defaultValue="search" 
            className="w-full mx-auto relative"
            onValueChange={(value) => {
              setActiveTab(value);
              setCurrentIndex(0);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList className="h-9 bg-[#030014] border border-[#1a1f2e] p-1 items-center mx-auto">
                <TabsTrigger 
                  value="search" 
                  className="h-7 px-4 text-xs data-[state=active]:bg-[#1a1f2e]"
                >
                  <Search className="h-3.5 w-3.5 mr-2" />
                  Search
                </TabsTrigger>
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

            <TabsContent value="search" className="mt-0">
              <div className="flex-1 min-w-0">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        handleSearch(searchQuery); 
                      }}>
                        <div className="relative">
                          <Input
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              if (e.target.value === "") {
                                setHasSearched(false);
                                setSearchResults([]);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSearch(searchQuery);
                              }
                            }}
                            placeholder="Search papers, authors, or topics..."
                            className="h-10 pl-10 pr-4 text-sm bg-[#1a1f2e] border-[#2a3142] focus:ring-2 focus:ring-violet-500/30 rounded-xl shadow-lg"
                          />
                          <Search className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                            isLoading ? "text-violet-500" : "text-[#666]"
                          )} />
                          {searchQuery && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSearchQuery("");
                                setHasSearched(false);
                                setSearchResults([]);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-[#2a3142] rounded-full"
                            >
                              <X className="h-3.5 w-3.5 text-[#666]" />
                            </Button>
                          )}
                        </div>
                      </form>
                    </div>
                    {hasSearched && searchResults.length > 0 && (
                      <div className="bg-[#1a1f2e] rounded-md p-0.5 flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchViewMode('normal')}
                          className={cn(
                            "h-7 px-2.5 text-[11px]",
                            searchViewMode === 'normal' ? "bg-[#2a3142] text-white" : "text-[#4a5578] hover:text-white hover:bg-[#2a3142]"
                          )}
                        >
                          <List className="h-3.5 w-3.5 mr-1.5" />
                          Normal
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchViewMode('grid')}
                          className={cn(
                            "h-7 px-2.5 text-[11px]",
                            searchViewMode === 'grid' ? "bg-[#2a3142] text-white" : "text-[#4a5578] hover:text-white hover:bg-[#2a3142]"
                          )}
                        >
                          <Grid2x2 className="h-3.5 w-3.5 mr-1.5" />
                          Grid
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="h-[calc(100vh-16rem)] overflow-hidden">
                    {!hasSearched && !isLoading && (
                      <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="p-3 rounded-full bg-[#1a1f2e]">
                            <Search className="h-5 w-5 text-[#4a5578]" />
                          </div>
                          <div>
                            <h3 className="text-base font-medium text-white mb-1.5">Search Research Papers</h3>
                            <p className="text-sm text-[#4a5578] max-w-md mx-auto">
                              Enter a topic, author name, or research interest to discover relevant papers
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-2">
                            {exampleQueries.map(({ text, icon: Icon }) => (
                              <Button
                                key={text}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExampleQuery(text)}
                                className="h-8 px-3 text-xs bg-[#1a1f2e] hover:bg-[#2a3142] text-[#4a5578] hover:text-white"
                              >
                                <Icon className="h-3.5 w-3.5 mr-2" />
                                {text}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin">
                          <Loader2 className="h-6 w-6 text-violet-500" />
                        </div>
                      </div>
                    ) : searchError ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="p-4 rounded-full bg-red-500/10 inline-block">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                          </div>
                          <p className="mt-4 text-sm text-red-500">{searchError}</p>
                        </div>
                      </div>
                    ) : hasSearched && searchResults.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="p-4 rounded-full bg-[#1a1f2e] inline-block">
                            <Search className="h-6 w-6 text-[#4a5578]" />
                          </div>
                          <p className="mt-4 text-sm text-[#4a5578]">No papers found matching your search.</p>
                        </div>
                      </div>
                    ) : hasSearched && (
                      <motion.div 
                        className="h-full overflow-y-auto"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {searchViewMode === 'normal' ? (
                          <div className="space-y-4 pr-4">
                            {searchResults.map((paper) => (
                              <motion.div key={paper.id} variants={itemVariants}>
                                <PaperCard
                                  paper={paper}
                                  onAddToLibrary={() => handleAddPaper(paper)}
                                  isAdding={addingPaperId === paper.id}
                                  context="discover"
                                  variant="compact"
                                  showScheduleButton={false}
                                  showCategoryButton={false}
                                />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 pr-4">
                            {searchResults.map((paper) => (
                              <motion.div key={paper.id} variants={itemVariants}>
                                <PaperCard
                                  paper={paper}
                                  onAddToLibrary={() => handleAddPaper(paper)}
                                  isAdding={addingPaperId === paper.id}
                                  context="discover"
                                  variant="default"
                                  showScheduleButton={false}
                                  showCategoryButton={false}
                                />
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommended">
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
                      {papers.length > 0 && renderPaperCard(papers[currentIndex])}
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
            </TabsContent>

            <TabsContent value="trending">
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
                      {trendingPapers.length > 0 && renderPaperCard(trendingPapers[currentIndex])}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
} 