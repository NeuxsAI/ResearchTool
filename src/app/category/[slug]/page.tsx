"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, MessageSquare, Pencil, LayoutGrid, List } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";
import { getCategoryById, getPapersByCategory } from "@/lib/supabase/db";
import { toast } from "sonner";
import { useParams } from "next/navigation";

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

interface RawPaper extends Omit<Paper, 'annotations_count'> {
  annotations_count?: number;
}

export default function CategoryPage() {
  const params = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);

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
        setPapers(papersResult.data?.map((paper: RawPaper) => ({
          ...paper,
          annotations_count: paper.annotations_count || 0
        })) || []);
      } catch (error) {
        console.error("Error loading category data:", error);
        setError("Failed to load category data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params?.slug]);

  if (isLoading) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-[#888]">Loading...</div>
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
            <h1 className="text-xl font-semibold text-[#eee]">{category.name}</h1>
            {!isEmpty && (
              <>
                <Button 
                  onClick={() => setIsAddPaperOpen(true)}
                  className="h-7 px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add paper
                </Button>
                <AddPaperDialog open={isAddPaperOpen} onOpenChange={setIsAddPaperOpen} categoryId={category.id} />
              </>
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
              <AddPaperDialog open={isAddPaperOpen} onOpenChange={setIsAddPaperOpen} categoryId={category.id} />
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
                    <Card key={paper.id} className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors">
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

  return <MainLayout>{content}</MainLayout>;
} 