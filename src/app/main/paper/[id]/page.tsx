"use client";

import { use } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, MessageSquare, Plus } from "lucide-react";

interface PaperPageProps {
  params: Promise<{ id: string }>;
}

export default function PaperPage({ params }: PaperPageProps) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("notes");
  const [annotations] = useState([
    {
      id: 1,
      text: "This is an interesting point about neural networks",
      page: 4,
      createdAt: "2 days ago",
    },
  ]);

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Machine Learning</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">2023</span>
          </div>
          <h1 className="text-sm font-medium">
            Deep Learning: A Comprehensive Survey
          </h1>
          <p className="text-xs text-muted-foreground">John Doe, Jane Smith</p>
        </div>
        <div className="h-[calc(100vh-8rem)] bg-muted/10">
          {/* PDF Viewer will be integrated here */}
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            PDF Viewer Coming Soon
          </div>
        </div>
      </div>
      <div className="w-80 flex flex-col h-full">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="h-8 w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="notes"
              className="h-8 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="annotations"
              className="h-8 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Annotations
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="h-8 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Ask AI
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="flex-1 p-3">
            <Button size="sm" className="w-full h-8 mb-3">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Note
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              No notes yet
            </div>
          </TabsContent>
          <TabsContent value="annotations" className="flex-1 p-3">
            <div className="space-y-3">
              {annotations.map((annotation) => (
                <Card key={annotation.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">{annotation.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          Page {annotation.page}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">
                          {annotation.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="ai" className="flex-1 p-3">
            <div className="space-y-3">
              <Button size="sm" className="w-full h-8">
                <Brain className="mr-1.5 h-3.5 w-3.5" />
                Generate Summary
              </Button>
              <Button size="sm" className="w-full h-8">
                <Brain className="mr-1.5 h-3.5 w-3.5" />
                Explain Concepts
              </Button>
              <Button size="sm" className="w-full h-8">
                <Brain className="mr-1.5 h-3.5 w-3.5" />
                Find Related Papers
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 