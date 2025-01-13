"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Upload, Link as LinkIcon } from "lucide-react";

export function AddPaperDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="h-7 px-3 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] hover:bg-[#333] hover:text-[#888]"
        >
          <Plus className="mr-2 h-3 w-3" />
          Add Paper
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Paper</DialogTitle>
          <DialogDescription>
            Import a paper from a PDF file or URL.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4">
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full justify-start h-24 border-dashed border-[#2a2a2a] hover:border-[#333] hover:bg-[#2a2a2a] text-[#888]"
              >
                <div className="flex flex-col items-center justify-center w-full gap-1">
                  <Upload className="h-4 w-4" />
                  <span className="text-[11px]">Upload PDF</span>
                  <span className="text-[11px] text-[#666]">or drag and drop</span>
                </div>
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#2a2a2a]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1c1c1c] px-2 text-[11px] text-[#666]">or</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url" className="text-[11px] text-[#888]">Import from URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#666]" />
                    <Input
                      id="url"
                      placeholder="https://arxiv.org/pdf/..."
                      className="pl-7 h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] placeholder:text-[#666]"
                    />
                  </div>
                  <Button 
                    size="sm"
                    className="h-7 px-3 text-[11px] bg-[#2a2a2a] border-[#333] text-[#888] hover:bg-[#333] hover:text-[#888]"
                  >
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 