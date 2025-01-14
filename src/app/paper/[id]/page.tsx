"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import { getPaperById } from "@/lib/supabase/db";
import { MainLayout } from "@/components/layout/main-layout";
import { EditPaperDialog } from "@/components/library/edit-paper-dialog";
import { PDFViewer } from '@/components/pdf/pdf-viewer';
import { AnnotationSidebar } from "@/components/annotations/annotation-sidebar";
import { createAnnotation, getAnnotationsByPaper } from "@/lib/supabase/db";
import { toast } from "sonner";

interface Paper {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  category_id?: string;
  annotations_count?: number;
  url?: string;
}

interface Selection {
  text: string;
  position: { x: number; y: number };
}

export default function PaperPage() {
  const params = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditPaperOpen, setIsEditPaperOpen] = useState(false);
  const [isAnnotationSidebarOpen, setIsAnnotationSidebarOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    content: string;
    created_at: string;
  }>>([]);
  const [highlightedText, setHighlightedText] = useState<string | undefined>();

  useEffect(() => {
    async function loadPaper() {
      if (!params?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const paperId = Array.isArray(params.id) ? params.id[0] : params.id;
        const { data, error: paperError } = await getPaperById(paperId);

        if (paperError) {
          console.error("Error loading paper:", paperError);
          setError("Failed to load paper");
          return;
        }

        if (!data) {
          setError("Paper not found");
          return;
        }

        setPaper(data);
      } catch (error) {
        console.error("Error loading paper data:", error);
        setError("Failed to load paper data");
      } finally {
        setIsLoading(false);
      }
    }
    loadPaper();
  }, [params?.id]);

  useEffect(() => {
    async function loadAnnotations() {
      if (!paper?.id) return;
      
      try {
        const { data, error } = await getAnnotationsByPaper(paper.id);
        if (error) throw error;
        setAnnotations(data || []);
      } catch (error) {
        console.error("Error loading annotations:", error);
        toast.error("Failed to load annotations");
      }
    }
    loadAnnotations();
  }, [paper?.id]);

  const handleSaveAnnotation = async (content: string, highlightText?: string) => {
    if (!paper?.id) return;

    const { error } = await createAnnotation({
      content,
      paper_id: paper.id,
      highlight_text: highlightText
    });

    if (error) throw error;

    // Reset selection
    setHighlightedText(undefined);

    // Reload annotations
    const { data } = await getAnnotationsByPaper(paper.id);
    setAnnotations(data || []);
    toast.success("Annotation saved");
  };

  const handleTextSelection = (text: string) => {
    setHighlightedText(text);
    setIsAnnotationSidebarOpen(true);
  };

  if (isLoading) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-[#888]">Loading...</div>
      </div>
    </MainLayout>;
  }

  if (error || !paper) {
    return <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#eee] mb-2">Paper not found</h1>
          <p className="text-[#888]">{error || "The paper you're looking for doesn't exist."}</p>
        </div>
      </div>
    </MainLayout>;
  }

  const handleUpdatePaper = async (paperDetails: { title: string; authors: string[]; year: number }) => {
    try {
      const { error } = await updatePaper(paper.id, paperDetails);
      if (error) throw error;
      setPaper(prev => prev ? { ...prev, ...paperDetails } : null);
    } catch (error) {
      console.error("Error updating paper:", error);
      throw error;
    }
  };

  return (
    <MainLayout>
      <div className="h-full bg-[#1c1c1c] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <h1 className="text-[#eee] text-sm font-medium">{paper.title}</h1>
            <span className="text-[#666] text-sm">•</span>
            <span className="text-[#666] text-sm">{paper.year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 bg-[#2a2a2a] hover:bg-[#333] text-white"
              onClick={() => setIsEditPaperOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Paper Details
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 bg-[#2a2a2a] hover:bg-[#333] text-white"
              onClick={() => setIsAnnotationSidebarOpen(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Annotation
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1">
          {paper.url ? (
            <PDFViewer 
              url={paper.url} 
              onSelection={handleTextSelection}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[#888]">
              No PDF available for this paper
            </div>
          )}
        </div>
      </div>

      {/* Edit Paper Dialog */}
      <EditPaperDialog
        open={isEditPaperOpen}
        onOpenChange={setIsEditPaperOpen}
        paper={paper}
        onSave={handleUpdatePaper}
      />

      {/* Annotation Sidebar */}
      <AnnotationSidebar
        open={isAnnotationSidebarOpen}
        onClose={() => {
          setIsAnnotationSidebarOpen(false);
          setHighlightedText(undefined);
        }}
        onSave={handleSaveAnnotation}
        annotations={annotations}
        highlightedText={highlightedText}
      />
    </MainLayout>
  );
} 