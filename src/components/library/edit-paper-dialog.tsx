import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

interface EditPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: {
    id: string;
    title?: string;
    authors?: string[];
    year?: number;
  };
  onSave: (paperDetails: { title: string; authors: string[]; year: number }) => Promise<void>;
}

export function EditPaperDialog({
  open,
  onOpenChange,
  paper,
  onSave,
}: EditPaperDialogProps) {
  const [title, setTitle] = useState(paper.title || "");
  const [authors, setAuthors] = useState(paper.authors?.join(", ") || "");
  const [year, setYear] = useState(paper.year?.toString() || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !authors || !year) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await onSave({
        title,
        authors: authors.split(",").map(a => a.trim()),
        year: parseInt(year),
      });
      onOpenChange(false);
      toast.success("Paper updated successfully");
    } catch (error) {
      console.error("Error updating paper:", error);
      toast.error("Failed to update paper");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#1c1c1c] text-white border-[#333]">
        <DialogHeader>
          <DialogTitle>Edit Paper Details</DialogTitle>
          <DialogDescription className="text-[#888]">
            Make changes to the paper details here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#2a2a2a] border-[#333] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="authors">Authors (comma-separated)</Label>
              <Input
                id="authors"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className="bg-[#2a2a2a] border-[#333] text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                type="number"
                className="bg-[#2a2a2a] border-[#333] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#2a2a2a] hover:bg-[#333] text-white"
            >
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 