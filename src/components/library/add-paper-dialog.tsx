"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractTextFromPDF } from "@/lib/pdf/extract-text";
import { parsePaperContent } from "@/lib/ai/paper-parser";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/lib/context/categories-context";

interface AddPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  onPaperAdded?: (paper: any) => void;
}

export function AddPaperDialog({ open, onOpenChange, categoryId, onPaperAdded }: AddPaperDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [abstract, setAbstract] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || "");
  const { categories } = useCategories();
  const router = useRouter();

  const processFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const text = await extractTextFromPDF(buffer);
      const metadata = await parsePaperContent(text);
      
      setTitle(metadata.title);
      setAuthors(metadata.authors.join(", "));
      setYear(metadata.year.toString());
      setAbstract(metadata.abstract);
      
      toast.success("Paper metadata extracted successfully");
    } catch (error) {
      console.error("Error processing paper:", error);
      toast.error("Failed to extract paper metadata");
      throw error; // Re-throw to be handled by caller
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setIsLoading(true);
    
    try {
      await processFile(file);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) return;
    
    setIsLoading(true);
    try {
      // Fetch the PDF
      const pdfResponse = await fetch(`/api/fetch-pdf?url=${encodeURIComponent(url)}`);
      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF from URL');
      }

      // Convert to File object
      const pdfBlob = await pdfResponse.blob();
      const pdfFile = new File([pdfBlob], 'paper.pdf', { type: 'application/pdf' });
      
      // Set the file and process it like a normal file upload
      setFile(pdfFile);
      await processFile(pdfFile);
      
    } catch (error) {
      console.error("Error processing PDF from URL:", error);
      toast.error("Failed to process PDF from URL");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setUrl("");
    setTitle("");
    setAuthors("");
    setYear("");
    setAbstract("");
    setActiveTab("upload");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      setIsLoading(true);

      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Parse authors string into array
      const authorsList = authors.split(',').map(author => author.trim()).filter(Boolean);
      
      // Create form data
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (url) {
        formData.append('url', url);
      }
      formData.append('title', title);
      formData.append('authors', JSON.stringify(authorsList));
      formData.append('year', year.toString());
      if (abstract) {
        formData.append('abstract', abstract);
      }
      if (categoryId || selectedCategory) {
        formData.append('categoryId', categoryId || selectedCategory);
      }

      // Log the data being sent
      console.log('Form data being sent:', {
        title,
        authors: authorsList,
        year,
        abstract,
        categoryId: categoryId || selectedCategory,
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        url
      });

      // Submit the form
      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Response from server:', data);
      
      if (!response.ok) {
        console.error('Failed to create paper:', data);
        throw new Error(data.error || 'Failed to create paper');
      }

      toast.success("Paper added successfully");
      if (onPaperAdded) {
        onPaperAdded(data.paper);
      }
      resetForm();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding paper:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add paper');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[600px] bg-[#1c1c1c] border-[#2a2a2a]">
        {isLoading && <LoadingOverlay message="Processing your paper..." />}
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Paper</DialogTitle>
            <DialogDescription className="text-[#888]">
              Import a paper from a PDF file or URL{categoryId ? " to this category" : ""}.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="mt-4" onValueChange={(v) => setActiveTab(v as "upload" | "url")}>
            <TabsList className="h-8 bg-[#2a2a2a] p-0.5 gap-0.5">
              <TabsTrigger 
                value="upload" 
                className="h-7 data-[state=active]:bg-[#333]"
              >
                <Upload className="h-3 w-3 mr-2" />
                Upload PDF
              </TabsTrigger>
              <TabsTrigger 
                value="url" 
                className="h-7 data-[state=active]:bg-[#333]"
              >
                <LinkIcon className="h-3 w-3 mr-2" />
                Import from URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div className="grid gap-4">
                <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-4 text-center cursor-pointer hover:border-[#333] transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-[#666]" />
                    <p className="text-[11px] text-[#888] mb-1">
                      {file ? file.name : "Upload PDF"}
                    </p>
                    <p className="text-[11px] text-[#666]">
                      or drag and drop
                    </p>
                  </label>
                </div>

                {file && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[11px] text-[#888]">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authors" className="text-[11px] text-[#888]">Authors</Label>
                      <Input
                        id="authors"
                        value={authors}
                        onChange={(e) => setAuthors(e.target.value)}
                        placeholder="Comma-separated list of authors"
                        className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-[11px] text-[#888]">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="abstract" className="text-[11px] text-[#888]">Abstract</Label>
                      <Textarea
                        id="abstract"
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                        className="h-20 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666] resize-none"
                      />
                    </div>
                    {!categoryId && (
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-[11px] text-[#888]">Category (optional)</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="my-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="url" className="text-[11px] text-[#888]">URL</Label>
                  <div className="relative">
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://arxiv.org/pdf/..."
                      className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666] pr-24"
                    />
                    <Button
                      type="button"
                      onClick={handleUrlSubmit}
                      disabled={!url || isLoading}
                      className="h-[calc(100%-2px)] px-3 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white absolute right-[1px] top-[1px] rounded-l-none"
                    >
                      {isLoading ? "Processing..." : "Process"}
                    </Button>
                  </div>
                </div>

                {(file || url) && (
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[11px] text-[#888]">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authors" className="text-[11px] text-[#888]">Authors</Label>
                      <Input
                        id="authors"
                        value={authors}
                        onChange={(e) => setAuthors(e.target.value)}
                        placeholder="Comma-separated list of authors"
                        className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-[11px] text-[#888]">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="abstract" className="text-[11px] text-[#888]">Abstract</Label>
                      <Textarea
                        id="abstract"
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                        className="h-20 text-[11px] bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666] resize-none"
                      />
                    </div>
                    {!categoryId && (
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-[11px] text-[#888]">Category (optional)</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-7 text-[11px] bg-[#2a2a2a] border-[#333] text-white">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              type="submit"
              disabled={isLoading || (activeTab === "upload" && !file) || (activeTab === "url" && !url)}
              className="h-7 px-3 mt-5 text-[11px] bg-[#2a2a2a] hover:bg-[#333] text-white"
            >
              Add paper
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 