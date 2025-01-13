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
  const { refreshCategories } = useCategories();
  const supabase = createClient();

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await deleteCategory(categoryId, session?.access_token);
      
      if (error) throw error;
      toast.success("Category deleted successfully");
      setIsOpen(false);
      refreshCategories();
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
          className="h-5 w-5 hover:bg-[#2a2a2a]"
          disabled={isLoading}
        >
          <Trash className="h-3.5 w-3.5 text-[#888]" />
          <span className="sr-only">Delete category</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c1c1c] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription className="text-[#888]">
            Are you sure you want to delete the category "{categoryName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="hover:bg-[#2a2a2a]"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 