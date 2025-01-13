"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Pencil, LayoutGrid, List, Star, TrendingUp } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";

export default function DiscoverPage() {
  const recommendedPapers = [
    {
      id: "1",
      title: "Constitutional AI: A Framework for Machine Learning Systems That Respect Human Values",
      authors: ["Anthropic Research Team"],
      year: "2023",
      category: "AI Ethics",
      citations: 156,
      trending: true,
    },
    {
      id: "2",
      title: "PaLM 2 Technical Report",
      authors: ["Google Research Team"],
      year: "2023",
      category: "Machine Learning",
      citations: 245,
      trending: true,
    },
  ];

  const content = (
    <div className="h-full bg-[#1c1c1c]">
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-[#eee]">Discover</h1>
            <AddPaperDialog />
          </div>
          <p className="text-[11px] leading-relaxed text-[#888]">
            Discover trending and recommended papers based on your interests.
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-5xl">
          <Tabs defaultValue="recommended" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="h-7 bg-[#2a2a2a] p-0.5 gap-0.5">
                <TabsTrigger 
                  value="recommended" 
                  className="h-6 px-3 text-[11px] data-[state=active]:bg-[#333]"
                >
                  <Star className="h-3 w-3 mr-1.5" />
                  Recommended
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="h-6 px-3 text-[11px] data-[state=active]:bg-[#333]"
                >
                  <TrendingUp className="h-3 w-3 mr-1.5" />
                  Trending
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recommended">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedPapers.map((paper) => (
                  <Card key={paper.id} className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                        <span>{paper.category}</span>
                        <span>•</span>
                        <span>{paper.year}</span>
                        {paper.trending && (
                          <>
                            <span>•</span>
                            <span className="flex items-center text-emerald-500">
                              <TrendingUp className="h-3 w-3 mr-0.5" />
                              Trending
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-[11px] font-medium text-[#eee] mb-1 line-clamp-2">{paper.title}</h3>
                      <p className="text-[11px] text-[#888] truncate mb-3">{paper.authors.join(", ")}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="text-[11px] text-[#666]">{paper.citations} citations</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedPapers.filter(p => p.trending).map((paper) => (
                  <Card key={paper.id} className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                        <span>{paper.category}</span>
                        <span>•</span>
                        <span>{paper.year}</span>
                        <span>•</span>
                        <span className="flex items-center text-emerald-500">
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                          Trending
                        </span>
                      </div>
                      <h3 className="text-[11px] font-medium text-[#eee] mb-1 line-clamp-2">{paper.title}</h3>
                      <p className="text-[11px] text-[#888] truncate mb-3">{paper.authors.join(", ")}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="text-[11px] text-[#666]">{paper.citations} citations</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  return <MainLayout>{content}</MainLayout>;
} 