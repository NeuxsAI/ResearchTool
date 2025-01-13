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
import { createCategory } from "@/lib/supabase/db";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCategories } from "@/lib/context/categories-context";

export function NewCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const { refreshCategories } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setIsLoading(true);
      const { error } = await createCategory({
        name,
        description,
        color: "#" + Math.floor(Math.random()*16777215).toString(16), // Random color
      });

      if (error) throw error;
      
      await refreshCategories();
      toast.success("Category created successfully");
      setOpen(false);
      setName("");
      setDescription("");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start h-6 px-2 text-[11px] font-normal text-[#888] hover:bg-[#2a2a2a] hover:text-[#888]"
        >
          <Plus className="mr-2 h-3 w-3" />
          New category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1c1c1c] border-[#2a2a2a]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">New Category</DialogTitle>
            <DialogDescription className="text-[#888]">
              Create a new category to organize your papers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[11px] text-[#888]">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Machine Learning"
                  className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[11px] text-[#888]">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of this category..."
                  className="h-20 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666] resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={isLoading || !name}
              className="h-7 px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
            >
              Create category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 