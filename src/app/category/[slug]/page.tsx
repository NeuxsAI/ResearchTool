"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, MessageSquare, Pencil, LayoutGrid, List, Settings2, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getCategoryById, getPapersByCategory, getReadingList, updatePaper, updateCategory, deletePaper } from "@/lib/supabase/db";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { EditPaperDialog } from "@/components/library/edit-paper-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaperCard } from "@/components/paper-card";
import { DeletePaperDialog } from "@/components/library/delete-paper-dialog";
import { cache, CACHE_KEYS } from "@/lib/cache";
import type { Paper, Category, ReadingListItem } from "@/lib/types";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

// Preload function for parallel data fetching
async function preloadData(categoryId: string, refresh = false) {
  const cachedPapers = !refresh && cache.get(`category_papers_${categoryId}`);
  const cachedReadingList = !refresh && cache.get(CACHE_KEYS.READING_LIST);

  if (cachedPapers && cachedReadingList) {
    return {
      papers: cachedPapers,
      readingList: cachedReadingList
    };
  }

  // Load papers and reading list in parallel
  const [papersResult, readingListResult] = await Promise.all([
    getPapersByCategory(categoryId),
    getReadingList()
  ]);

  const papers = papersResult.data || [];
  const readingList = readingListResult.data || [];

  if (!refresh) {
    cache.set(`category_papers_${categoryId}`, papers);
    cache.set(CACHE_KEYS.READING_LIST, readingList);
  }

  return { papers, readingList };
}

// Add container variants at the top with other interfaces
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isEditPaperOpen, setIsEditPaperOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editedCategory, setEditedCategory] = useState<Category | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadData = async (refresh = false) => {
    try {
      if (!refresh) {
        // Check cache first
        const cachedPapers = cache.get(`category_papers_${params.slug}`);
        const cachedReadingList = cache.get(CACHE_KEYS.READING_LIST);
        const cachedCategory = cache.get(`category_${params.slug}`);
        
        if (cachedPapers && cachedReadingList && cachedCategory) {
          setPapers(cachedPapers as Paper[]);
          setReadingList(cachedReadingList as ReadingListItem[]);
          setCategory(cachedCategory as Category);
          return;
        }
      }

      setIsLoading(true);
      const categoryId = Array.isArray(params.slug) ? params.slug[0] : params.slug;
      
      if (!categoryId) {
        setError("Invalid category ID");
        return;
      }

      // Load everything in parallel
      const [{ papers, readingList }, categoryResult] = await Promise.all([
        preloadData(categoryId, refresh),
        getCategoryById(categoryId)
      ]);

      if (categoryResult.error) {
        console.error("Error loading category:", categoryResult.error);
        setError("Failed to load category");
        return;
      }

      if (!categoryResult.data) {
        setError("Category not found");
        return;
      }

      setPapers(papers as Paper[]);
      setReadingList(readingList as ReadingListItem[]);
      setCategory(categoryResult.data as Category);

      // Cache the results
      if (!refresh) {
        cache.set(`category_papers_${params.slug}`, papers);
        cache.set(CACHE_KEYS.READING_LIST, readingList);
        cache.set(`category_${params.slug}`, categoryResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [params.slug]);

  const handlePaperClick = (paper: Paper) => {
    router.push(`/paper/${paper.id}`);
  };

  const handleEditClick = (e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation(); // Prevent card click
    setSelectedPaper(paper);
    setIsEditPaperOpen(true);
  };

  const handleUpdatePaper = async (paperDetails: { title: string; authors: string[]; year: number }) => {
    if (!selectedPaper) return;
    
    const { error } = await updatePaper(selectedPaper.id, paperDetails);
    if (error) throw error;

    // Update papers list
    setPapers(papers.map(p => 
      p.id === selectedPaper.id 
        ? { ...p, ...paperDetails }
        : p
    ));
  };

  const handlePaperAdded = (newPaper: Paper) => {
    if (!newPaper?.id) {
      console.error('Invalid paper data received:', newPaper);
      toast.error('Failed to add paper: Invalid data received');
      return;
    }

    // Ensure the paper has all required properties
    const paperWithDefaults: Paper = {
      id: newPaper.id,
      title: newPaper.title,
      authors: newPaper.authors || [],
      year: newPaper.year,
      abstract: newPaper.abstract || '',
      url: newPaper.url || '',
      citations: newPaper.citations || 0,
      impact: newPaper.impact || 'low',
      topics: newPaper.topics || [],
      category: category ? { 
        id: category.id, 
        name: category.name, 
        color: category.color 
      } : undefined,
      in_reading_list: true,
      created_at: newPaper.created_at || new Date().toISOString(),
      user_id: newPaper.user_id
    };

    setPapers(prevPapers => [...prevPapers, paperWithDefaults]);
    toast.success('Paper added successfully');
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedCategory || !category) return;

    try {
      const { error } = await updateCategory(category.id, editedCategory);
      if (error) throw error;

      setCategory(editedCategory);
      setIsEditCategoryOpen(false);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
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

      // Update UI state first
      setPapers(prevPapers => prevPapers.filter(p => p.id !== paperToDelete.id));
      
      // Clean up dialog state
      setPaperToDelete(null);
      setIsDeleting(false);
      
      // Clear cache
      cache.delete(`category_papers_${params.slug}`);
      
      toast.success("Paper deleted successfully");
    } catch (error) {
      console.error("Error deleting paper:", error);
      // Clean up dialog state even on error
      setPaperToDelete(null);
      setIsDeleting(false);
      toast.error("Failed to delete paper");
    }
  };

  // Update the paper card rendering to use safe property access
  const renderPaperCard = (paper: Paper) => (
    <motion.div key={paper.id} variants={itemVariants}>
      <PaperCard
        paper={{
          id: paper.id,
          title: paper.title,
          authors: paper.authors || [],
          year: paper.year,
          abstract: paper.abstract || '',
          url: paper.url || '',
          citations: paper.citations || 0,
          impact: paper.impact || 'low',
          topics: paper.topics || [],
          category: category ? {
            id: category.id,
            name: category.name,
            color: category.color
          } : undefined,
          in_reading_list: true,
          created_at: paper.created_at,
          user_id: paper.user_id
        }}
        onSchedule={() => {}}
        onDelete={() => handleDeletePaper(paper)}
        isLoading={isLoading}
        context="category"
        showAddToListButton={false}
        variant="compact"
      />
    </motion.div>
  );

  if (isLoading) {
    return <MainLayout>
      <motion.div 
        className="h-full bg-[#030014]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="p-6 border-b border-[#1a1f2e]">
          <div className="max-w-3xl">
            <Skeleton className="h-7 w-48 bg-[#1a1f2e]" />
            <Skeleton className="h-4 w-96 mt-2 bg-[#1a1f2e]" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4 bg-[#1a1f2e] border-[#2a3142]">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded bg-[#2a3142]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-24 bg-[#2a3142]" />
                      <Skeleton className="h-4 w-4 rounded-full bg-[#2a3142]" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2 bg-[#2a3142]" />
                    <Skeleton className="h-4 w-2/3 bg-[#2a3142]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>
    </MainLayout>;
  }

  if (error || !category) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#eee] mb-2">Category not found</h1>
          <p className="text-[#888]">{error || "The category you're looking for doesn't exist."}</p>
        </div>
      </div>
    </MainLayout>;
  }

  const isEmpty = papers.length === 0;

  const content = (
    <div className="flex flex-col h-full bg-[#030014]">
      {/* Header */}
      <div className="border-b border-[#1a1f2e] bg-[#030014]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-sm font-medium text-white">{category?.name}</h1>
              <p className="text-xs text-[#4a5578]">
                {category?.description || `${category?.name}'s papers`}
              </p>
            </div>
            {papers.length > 0 && (
              <Button
                onClick={() => setIsAddPaperOpen(true)}
                className="h-8 px-3 text-xs bg-[#1a1f2e] hover:bg-[#2a3142]"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Paper
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 p-6">
        {papers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="flex flex-col items-center max-w-md text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#2a2a2a] mb-6 text-[11px] text-[#888]">
                <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                {category.name}
              </div>
              <p className="text-[11px] text-[#666] mb-4">
                This category is empty. Start by importing an item.
              </p>
              <Button
                onClick={() => setIsAddPaperOpen(true)}
                className="h-8 px-3 text-[11px] bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Paper
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Tabs defaultValue="grid" className="w-full">
              <TabsContent value="grid">
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {papers.map((paper) => paper?.id ? renderPaperCard(paper) : null)}
                </motion.div>
              </TabsContent>

              <TabsContent value="list">
                <motion.div 
                  className="space-y-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {papers.map((paper) => (
                    <motion.div key={paper.id} variants={itemVariants}>
                      <PaperCard
                        paper={{
                          ...paper,
                          citations: 0,
                          impact: "low",
                          url: "",
                          topics: [],
                          category: category,
                          in_reading_list: true
                        }}
                        onSchedule={() => {}}
                        onDelete={() => handleDeletePaper(paper)}
                        isLoading={isLoading}
                        context="category"
                        showAddToListButton={false}
                        variant="compact"
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );

  return <MainLayout>
    {content}
    <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
      <DialogContent className="sm:max-w-[425px] bg-[#030014] border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEditCategory} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[11px] text-[#888]">Name</Label>
            <Input
              id="name"
              value={editedCategory?.name || ""}
              onChange={(e) => setEditedCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="h-8 text-[11px] bg-[#2a2a2a] border-[#333] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[11px] text-[#888]">Description</Label>
            <Input
              id="description"
              value={editedCategory?.description || ""}
              onChange={(e) => setEditedCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
              className="h-8 text-[11px] bg-[#2a2a2a] border-[#333] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color" className="text-[11px] text-[#888]">Color</Label>
            <Input
              id="color"
              type="color"
              value={editedCategory?.color || "#000000"}
              onChange={(e) => setEditedCategory(prev => prev ? { ...prev, color: e.target.value } : null)}
              className="h-8 w-16 text-[11px] bg-[#2a2a2a] border-[#333] text-white"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="h-8 px-4 text-[11px] bg-[#1a1f2e] hover:bg-[#2a3142] text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AddPaperDialog
      open={isAddPaperOpen}
      onOpenChange={setIsAddPaperOpen}
      categoryId={params.slug as string}
      onPaperAdded={handlePaperAdded}
    />

    {selectedPaper && (
      <EditPaperDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        paper={selectedPaper}
        onSuccess={handleUpdatePaper}
      />
    )}

    {paperToDelete && (
      <DeletePaperDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        paper={paperToDelete}
        onSuccess={handleConfirmDelete}
      />
    )}
  </MainLayout>;
} 