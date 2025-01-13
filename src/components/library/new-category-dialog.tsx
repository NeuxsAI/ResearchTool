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

export function NewCategoryDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start h-6 px-2 text-[11px] font-normal text-[#888] hover:bg-[#2a2a2a] hover:text-[#888]"
        >
          <Plus className="mr-2 h-3 w-3" />
          New category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your papers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] text-[#888]">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Machine Learning"
                className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] placeholder:text-[#666]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[11px] text-[#888]">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of this category..."
                className="h-20 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] placeholder:text-[#666] resize-none"
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
            Create category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 