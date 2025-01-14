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
import { createClient } from "@/lib/supabase/client";

interface DeleteCategoryDialogProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryDialog({ categoryId, categoryName }: DeleteCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const categoriesContext = useCategories();
  const supabase = createClient();

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await deleteCategory(categoryId);
      
      if (error) throw error;
      toast.success("Category deleted successfully");
      setIsOpen(false);
      categoriesContext?.refreshCategories?.();
      router.push("/");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 ml-2 text-gray-700 hover:text-red-500"
          disabled={isLoading}
        >
          <Trash className="h-3.5 w-3.5" />
          <span className="sr-only">Delete category</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Are you sure you want to delete the category "{categoryName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}