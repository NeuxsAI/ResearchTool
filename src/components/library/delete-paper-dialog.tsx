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

interface DeletePaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  paperTitle: string;
  isDeleting: boolean;
}

export function DeletePaperDialog({
  open,
  onOpenChange,
  onConfirm,
  paperTitle,
  isDeleting
}: DeletePaperDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1c1c1c] border-[#2a2a2a]">
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
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            disabled={isDeleting}
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