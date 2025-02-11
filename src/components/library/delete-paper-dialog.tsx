import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { deletePaper } from "@/lib/supabase/db";
import { toast } from "sonner";
import { cache, CACHE_KEYS } from "@/lib/cache";

interface DeletePaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  paperTitle: string;
  onSuccess?: () => void;
}

export function DeletePaperDialog({
  open,
  onOpenChange,
  paperId,
  paperTitle,
  onSuccess
}: DeletePaperDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!paperId) return;

    try {
      setIsDeleting(true);
      const result = await deletePaper(paperId);
      
      if (result.error) {
        throw result.error;
      }

      // Clear all relevant caches
      cache.delete(CACHE_KEYS.PAPERS);
      cache.delete(CACHE_KEYS.READING_LIST);
      cache.delete(CACHE_KEYS.RECENT_PAPERS);
      cache.delete(CACHE_KEYS.ANNOTATIONS(paperId));
      
      onSuccess?.();
      toast.success("Paper deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast.error("Failed to delete paper");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (isDeleting) return; // Prevent closing while deleting
        if (!newOpen && open) {
          // Dialog is being closed by user action
          onOpenChange(false);
        } else {
          onOpenChange(newOpen);
        }
      }}
    >
      <AlertDialogContent className="bg-[#030014] border-[#2a2a2a]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Paper</AlertDialogTitle>
          <AlertDialogDescription className="text-[#888]">
            Are you sure you want to delete "{paperTitle}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-[#2a2a2a] text-white hover:bg-[#333] border-0"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 