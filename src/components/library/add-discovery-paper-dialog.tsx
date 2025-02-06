"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addPaperFromDiscovery } from "@/lib/supabase/db";
import { getCategories } from "@/lib/supabase/db";
import { Category } from "@/lib/types";

interface AddDiscoveryPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: {
    title: string;
    authors: string[];
    year: number;
    abstract?: string;
    url: string;
    citations?: number;
    impact?: 'high' | 'low';
    topics?: string[];
  };
  onPaperAdded?: (paper: any) => void;
}

export function AddDiscoveryPaperDialog({ open, onOpenChange, paper, onPaperAdded }: AddDiscoveryPaperDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  // Load categories when dialog opens
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await getCategories();
      if (data) {
        setCategories(data);
      }
    };
    if (open) {
      loadCategories();
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      setIsLoading(true);

      const result = await addPaperFromDiscovery(paper, selectedCategory || undefined);
      
      if (result.error) {
        throw result.error;
      }

      toast.success("Paper added successfully");
      if (onPaperAdded && result.data) {
        onPaperAdded(result.data);
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding paper:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add paper');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1c1c1c] border-[#2a2a2a]">
        {isLoading && <LoadingOverlay message="Adding paper to your library..." />}
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Add to Library</DialogTitle>
            <DialogDescription className="text-[#888]">
              Add this paper to your library and reading list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-[11px] text-[#888]">Category (optional)</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] text-[#888]">Paper Details</Label>
              <div className="rounded-md bg-[#2a2a2a] p-3 space-y-2">
                <p className="text-[11px] text-white font-medium">{paper.title}</p>
                <p className="text-[10px] text-[#888]">{paper.authors.join(", ")}</p>
                <p className="text-[10px] text-[#666]">{paper.year}</p>
                {paper.abstract && (
                  <p className="text-[10px] text-[#888] line-clamp-3">{paper.abstract}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {paper.citations !== undefined && (
                    <span className="text-[10px] text-[#666]">
                      Citations: {paper.citations}
                    </span>
                  )}
                  {paper.impact && (
                    <span className="text-[10px] text-[#666]">
                      Impact: {paper.impact}
                    </span>
                  )}
                </div>
                {paper.topics && paper.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {paper.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 rounded-full bg-[#333] text-[9px] text-[#888]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit"
              disabled={isLoading}
              className="h-7 px-3 mt-5 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
            >
              Add to Library
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 