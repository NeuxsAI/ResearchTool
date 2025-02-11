"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCategory } from "@/lib/supabase/db";
import { useCategories } from "@/lib/context/categories-context";

interface EditCategoryDialogProps {
  categoryId: string;
  initialName: string;
  initialSummary?: string;
  trigger?: React.ReactNode;
}

export function EditCategoryDialog({ categoryId, initialName, initialSummary = "", trigger }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [summary, setSummary] = useState(initialSummary);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshCategories } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const result = await updateCategory(categoryId, { name: name.trim(), summary: summary.trim() });
      if (result.error) throw result.error;
      
      await refreshCategories();
      toast.success("Category updated successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[11px] text-[#4a5578] hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[400px] bg-[#030014] border-[#1a1f2e] text-white p-4 rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm font-medium">Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#4a5578]">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 bg-[#1a1f2e] border-[#2a3142] text-xs rounded"
              placeholder="Enter category name"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#4a5578]">Summary</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="bg-[#1a1f2e] border-[#2a3142] text-xs min-h-[60px] rounded resize-none"
              placeholder="Enter category summary (optional)"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="h-6 px-2.5 text-[11px] hover:bg-[#1a1f2e] text-[#4a5578] hover:text-white rounded"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !name.trim()}
              className="h-6 px-2.5 text-[11px] bg-violet-500 hover:bg-violet-600 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 