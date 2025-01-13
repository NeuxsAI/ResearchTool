"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Link as LinkIcon, Settings, Download, Share2 } from "lucide-react";

export default function CanvasPage({ params }: { params: { id: string } }) {
  const [nodes] = useState([
    {
      id: 1,
      title: "Statistical Modeling: The Two Cultures",
      excerpt: "There are two cultures in the use of statistical modeling to reach conclusions from data...",
      position: { x: 100, y: 100 },
    },
    {
      id: 2,
      title: "The neural basis of loss aversion",
      excerpt: "Loss aversion has been studied in both psychology and neuroscience...",
      position: { x: 400, y: 200 },
    }
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Programming GPUs</h1>
          <p className="text-sm text-muted-foreground">8 nodes • Last edited 11 days ago</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add node
          </Button>
          <Button variant="outline" size="sm">
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect
          </Button>
          <Button variant="outline" size="icon" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative bg-muted/20 overflow-auto">
        {nodes.map((node) => (
          <Card
            key={node.id}
            className="absolute p-4 w-80 cursor-move hover:shadow-lg transition-shadow"
            style={{
              left: node.position.x,
              top: node.position.y,
            }}
          >
            <h3 className="font-semibold mb-2">{node.title}</h3>
            <p className="text-sm text-muted-foreground">{node.excerpt}</p>
          </Card>
        ))}
      </div>
    </div>
  );
} 