"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, MessageSquare, Pencil, LayoutGrid, List, Settings2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getCategoryById, getPapersByCategory, updatePaper, updateCategory } from "@/lib/supabase/db";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { EditPaperDialog } from "@/components/library/edit-paper-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Category {
  id: string;
  name?: string;
  description?: string;
  color?: string;
}

interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category_id?: string;
  annotations_count?: number;
}

interface RawPaper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category_id?: string;
  annotations: { count: number } | null;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isEditPaperOpen, setIsEditPaperOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editedCategory, setEditedCategory] = useState<Category | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!params?.slug) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const categoryId = Array.isArray(params.slug) ? params.slug[0] : params.slug;
        const [categoryResult, papersResult] = await Promise.all([
          getCategoryById(categoryId),
          getPapersByCategory(categoryId)
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

        setCategory(categoryResult.data);
        const papers = (papersResult.data as RawPaper[] || []).map(paper => ({
          id: paper.id,
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          category_id: paper.category_id,
          annotations_count: paper.annotations?.count || 0
        }));
        setPapers(papers);
      } catch (error) {
        console.error("Error loading category data:", error);
        setError("Failed to load category data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params?.slug]);

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
    setPapers(prevPapers => [...prevPapers, newPaper]);
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

  if (isLoading) {
    return <MainLayout>
      <div className="h-full bg-[#1c1c1c]">
        {/* Header Skeleton */}
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-[#2a2a2a] rounded animate-pulse" />
                <div className="h-4 w-96 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
              <div className="h-7 w-24 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6">
          <div className="max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 bg-[#2a2a2a] border border-[#333] rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-[#333] rounded animate-pulse" />
                    <div className="h-4 w-48 bg-[#333] rounded animate-pulse" />
                    <div className="h-4 w-36 bg-[#333] rounded animate-pulse" />
                    <div className="h-[1px] bg-[#333] my-3" />
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-[#333] rounded animate-pulse" />
                      <div className="h-6 w-6 bg-[#333] rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
    <div className="h-full bg-[#1c1c1c]">
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-[#eee]">{category.name}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedCategory(category);
                  setIsEditCategoryOpen(true);
                }}
                className="h-7 w-7 p-0"
              >
                <Settings2 className="h-3.5 w-3.5 text-[#666] hover:text-[#888]" />
              </Button>
            </div>
            {!isEmpty && (
              <Button 
                onClick={() => setIsAddPaperOpen(true)}
                className="h-7 px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add paper
              </Button>
            )}
          </div>
          <p className="max-w-3xl text-[11px] leading-relaxed text-[#888]">
            {category.description}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="h-[calc(100vh-8.5rem)] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center max-w-md text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#2a2a2a] mb-6 text-[11px] text-[#888]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="ml-2">{category.name}</span>
            </div>
            <p className="text-[11px] text-[#666] mb-8">
              This category is empty. Start by importing an item.
            </p>
            <div className="flex flex-col w-full gap-2">
              <Button 
                onClick={() => setIsAddPaperOpen(true)}
                className="h-7 px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add paper
              </Button>
              <AddPaperDialog 
                open={isAddPaperOpen} 
                onOpenChange={setIsAddPaperOpen} 
                categoryId={category?.id}
                onPaperAdded={handlePaperAdded}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="max-w-5xl">
            <Tabs defaultValue="grid" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] text-[#666]">
                  {papers.length} papers
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
              </div>

              <TabsContent value="grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {papers.map((paper) => (
                    <Card 
                      key={paper.id} 
                      className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors cursor-pointer"
                      onClick={() => handlePaperClick(paper)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                          <span>{category.name}</span>
                          <span>•</span>
                          <span>{paper.year}</span>
                        </div>
                        <h3 className="text-[11px] font-medium text-[#eee] mb-1 line-clamp-2">{paper.title}</h3>
                        <p className="text-[11px] text-[#888] truncate mb-3">{paper.authors?.join(", ") || "No authors"}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]"
                              onClick={(e) => handleEditClick(e, paper)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                              <MessageSquare className="h-3 w-3" />
                              {(paper.annotations_count || 0) > 0 && (
                                <span className="absolute top-0.5 right-0.5 text-[10px] text-[#888]">
                                  {paper.annotations_count}
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list">
                <div className="space-y-2">
                  {papers.map((paper) => (
                    <Card key={paper.id} className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                            <span>{category.name}</span>
                            <span>•</span>
                            <span>{paper.year}</span>
                          </div>
                          <h3 className="text-[11px] font-medium text-[#eee] mb-1 truncate">{paper.title}</h3>
                          <p className="text-[11px] text-[#888] truncate">{paper.authors?.join(", ") || "No authors"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                            <MessageSquare className="h-3 w-3" />
                            {(paper.annotations_count || 0) > 0 && (
                              <span className="absolute top-0.5 right-0.5 text-[10px] text-[#888]">
                                {paper.annotations_count}
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );

  return <MainLayout>
    {content}
    <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
      <DialogContent className="sm:max-w-[425px] bg-[#1c1c1c] border-[#2a2a2a]">
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
              className="h-8 px-4 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </MainLayout>;
} 