"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function NewBoardDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="h-7 px-3 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] hover:bg-[#333] hover:text-[#888]"
        >
          <Plus className="mr-2 h-3 w-3" />
          New Board
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Board</DialogTitle>
          <DialogDescription>
            Create a new board to organize your ideas and connections.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] text-[#888]">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Research Ideas"
                className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] placeholder:text-[#666]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[11px] text-[#888]">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of this board..."
                className="h-20 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] placeholder:text-[#666] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-[11px] text-[#888]">Category</Label>
              <Input
                id="category"
                placeholder="Select a category..."
                className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] placeholder:text-[#666]"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit"
            size="sm"
            className="h-7 px-3 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] hover:bg-[#333] hover:text-[#888]"
          >
            Create board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 