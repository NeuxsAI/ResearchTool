"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory } from "@/lib/supabase/db";
import { useCategories } from "@/lib/context/categories-context";

interface DeleteCategoryDialogProps {
  categoryId: string;
  categoryName: string;
  trigger?: React.ReactNode;
}

export function DeleteCategoryDialog({ categoryId, categoryName, trigger }: DeleteCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshCategories } = useCategories();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteCategory(categoryId);
      if (result.error) throw result.error;
      
      await refreshCategories();
      toast.success("Category deleted successfully");
      setOpen(false);
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
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-[#1a1f2e]"
          >
            <Trash className="h-3 w-3 text-[#4a5578]" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#030014] border-[#1a1f2e] text-white">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription className="text-[#4a5578]">
            Are you sure you want to delete &quot;{categoryName}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 px-3 text-xs hover:bg-[#1a1f2e] text-[#4a5578] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={handleDelete}
            className="h-8 px-3 text-xs bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}