"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash } from "lucide-react";
import { deleteCategory } from "@/lib/supabase/db";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCategories } from "@/lib/context/categories-context";

interface DeleteCategoryDialogProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryDialog({ categoryId, categoryName }: DeleteCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshCategories } = useCategories();

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const { error } = await deleteCategory(categoryId);
      if (error) throw error;
      
      await refreshCategories();
      toast.success("Category deleted successfully");
      setOpen(false);
      router.push('/');
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-[#333] transition-opacity"
        >
          <Trash className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1c1c1c] border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-white">Delete Category</DialogTitle>
          <DialogDescription className="text-[#888]">
            Are you sure you want to delete "{categoryName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-7 px-3 text-[11px] text-[#888] hover:text-[#888] hover:bg-[#2a2a2a]"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            disabled={isLoading}
            onClick={handleDelete}
            className="h-7 px-3 text-[11px] bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-400"
          >
            Delete Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 