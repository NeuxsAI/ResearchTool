"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Link as LinkIcon } from "lucide-react";

interface ImportPaperDialogProps {
  onImport?: (file: File | string) => void;
}

export function ImportPaperDialog({ onImport }: ImportPaperDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        try {
          onImport?.(acceptedFiles[0]);
          setIsOpen(false);
        } catch (error) {
          console.error("Error importing file:", error);
        }
      }
    },
  });

  const handleUrlImport = async () => {
    if (!url) return;
    try {
      onImport?.(url);
      setIsOpen(false);
    } catch (error) {
      console.error("Error importing URL:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-center h-8 text-xs hover:bg-muted/50"
        >
          <Plus className="mr-2 h-3 w-3" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-muted/30 border-muted">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Adds item to New category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-xs text-muted-foreground mb-4">
              At the moment you can add research as .PDFs or webpages. Links from popular research sharing sites are automatically downloaded as PDFs.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://arxiv.org/abs/1304.0445"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-8 text-xs"
              />
              <Button 
                onClick={handleUrlImport} 
                disabled={!url}
                className="h-8 px-3 text-xs"
              >
                Add link
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-gradient-to-b from-background to-muted/30 px-2 text-muted-foreground">
                or import a .pdf file from your computer
              </span>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`
              border border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors hover:bg-muted/5
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted"}
            `}
          >
            <input {...getInputProps()} />
            <p className="text-xs text-muted-foreground">
              Drag & drop .pdf files to add
            </p>
            <Button 
              variant="outline" 
              className="mt-4 h-7 text-xs hover:bg-muted/50"
            >
              Click to select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 