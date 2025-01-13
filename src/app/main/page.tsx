"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Grid2x2 } from "lucide-react";

export default function LibraryPage() {
  const [papers, setPapers] = useState([
    {
      id: "1",
      title: "Deep Learning: A Comprehensive Survey",
      authors: "John Doe, Jane Smith",
      year: 2023,
      category: "Machine Learning",
    },
    {
      id: "2",
      title: "The Future of AI in Healthcare",
      authors: "Alice Johnson",
      year: 2023,
      category: "Healthcare",
    },
  ]);

  const [canvases, setCanvases] = useState([
    {
      id: "1",
      title: "Research Ideas",
      description: "Collection of research ideas and connections",
      lastEdited: "2 days ago",
    },
    {
      id: "2",
      title: "Literature Review",
      description: "Literature review for ML paper",
      lastEdited: "1 week ago",
    },
  ]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">My Library</h1>
          <p className="text-xs text-muted-foreground">
            Browse and manage your research papers and ideas
          </p>
        </div>
        <Button size="sm" className="h-8">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Paper
        </Button>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="h-8 w-fit">
          <TabsTrigger value="items" className="text-xs px-3">
            Items
          </TabsTrigger>
          <TabsTrigger value="boards" className="text-xs px-3">
            Boards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-3">
          <div className="flex flex-col gap-3">
            {papers.map((paper) => (
              <Card key={paper.id} className="flex items-center gap-3 p-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {paper.category}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {paper.year}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium truncate">{paper.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {paper.authors}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  View
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="boards" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {canvases.map((canvas) => (
              <Card key={canvas.id} className="p-3">
                <div className="flex items-start gap-3">
                  <Grid2x2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {canvas.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {canvas.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last edited {canvas.lastEdited}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            <Card className="p-3 border-dashed">
              <Button
                variant="ghost"
                className="h-full w-full flex flex-col items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">New Board</span>
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 