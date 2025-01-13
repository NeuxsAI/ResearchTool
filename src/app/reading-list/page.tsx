"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Pencil, LayoutGrid, List, Clock } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { AddPaperDialog } from "@/components/library/add-paper-dialog";

export default function ReadingListPage() {
  const readingList = [
    {
      id: "1",
      title: "Language Models are Few-Shot Learners",
      authors: ["Tom B. Brown", "Benjamin Mann", "Nick Ryder"],
      year: "2020",
      category: "Machine Learning",
      annotations: 0,
      addedDate: "2024-01-10",
    },
    {
      id: "2",
      title: "High-Resolution Image Synthesis with Latent Diffusion Models",
      authors: ["Robin Rombach", "Andreas Blattmann"],
      year: "2022",
      category: "Computer Vision",
      annotations: 2,
      addedDate: "2024-01-09",
    },
  ];

  const content = (
    <div className="h-full bg-[#1c1c1c]">
      <div className="p-6 border-b border-[#2a2a2a]">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-[#eee]">Reading List</h1>
            <AddPaperDialog />
          </div>
          <p className="text-[11px] leading-relaxed text-[#888]">
            Papers you want to read later.
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-5xl">
          <Tabs defaultValue="grid" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] text-[#666]">
                {readingList.length} papers
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
                {readingList.map((paper) => (
                  <Card key={paper.id} className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                        <span>{paper.category}</span>
                        <span>•</span>
                        <span>{paper.year}</span>
                      </div>
                      <h3 className="text-[11px] font-medium text-[#eee] mb-1 line-clamp-2">{paper.title}</h3>
                      <p className="text-[11px] text-[#888] truncate mb-3">{paper.authors.join(", ")}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                            <Clock className="h-3 w-3" />
                            <span className="sr-only">Added on {paper.addedDate}</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                            <MessageSquare className="h-3 w-3" />
                            {paper.annotations > 0 && (
                              <span className="absolute top-0.5 right-0.5 text-[10px] text-[#888]">{paper.annotations}</span>
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
                {readingList.map((paper) => (
                  <Card key={paper.id} className="p-3 bg-[#2a2a2a] border-[#333] hover:bg-[#333] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#666] mb-1">
                          <span>{paper.category}</span>
                          <span>•</span>
                          <span>{paper.year}</span>
                        </div>
                        <h3 className="text-[11px] font-medium text-[#eee] mb-1 truncate">{paper.title}</h3>
                        <p className="text-[11px] text-[#888] truncate">{paper.authors.join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                          <Clock className="h-3 w-3" />
                          <span className="sr-only">Added on {paper.addedDate}</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-[#888] hover:bg-[#333]">
                          <MessageSquare className="h-3 w-3" />
                          {paper.annotations > 0 && (
                            <span className="absolute top-0.5 right-0.5 text-[10px] text-[#888]">{paper.annotations}</span>
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
    </div>
  );

  return <MainLayout>{content}</MainLayout>;
} 