"use client";

import { useState, useEffect, useRef } from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  Popup,
  type IHighlight,
  Tip,
} from "react-pdf-highlighter";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type { Annotation } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

interface PDFViewerProps {
  url: string;
  onSelection?: (highlight: IHighlight, openChat?: boolean) => void;
  annotations?: Array<IHighlight>;
  onAnnotationClick?: (annotationId: string) => void;
}

const defaultHighlight: IHighlight = {
  id: "",
  position: {
    boundingRect: {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      width: 0,
      height: 0,
      pageNumber: 1,
    },
    rects: [],
    pageNumber: 1,
  },
  content: { text: "" },
  comment: { text: "", emoji: "" },
};

export function PDFViewer({
  url,
  onSelection,
  annotations = [],
  onAnnotationClick,
}: PDFViewerProps) {
  const proxyUrl = `/api/pdf?url=${encodeURIComponent(url)}`;
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [currentSelection, setCurrentSelection] =
    useState<{ position: any; content: any } | null>(null);
  const selectionRef = useRef<{
    position: any;
    content: any;
    hideTip: () => void;
  } | null>(null);
  const [scale, setScale] = useState(1.0);

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3)); // Limit zoom in to 3x
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5)); // Limit zoom out to 0.5x
  };

  // Set highlights from annotations
  useEffect(() => {
    if (annotations && Array.isArray(annotations)) {
      setHighlights(annotations);
    }
  }, [annotations]);

  // Track previous annotations length to detect new additions
  const prevAnnotationsLength = useRef(annotations.length);

  // Clear selection only when a new highlight is added
  useEffect(() => {
    if (annotations.length > prevAnnotationsLength.current) {
      if (selectionRef.current?.hideTip) {
        selectionRef.current.hideTip();
      }
      setCurrentSelection(null);
    }
    prevAnnotationsLength.current = annotations.length;
  }, [annotations]);

  // Add keyboard shortcut functionality
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Check if we have a valid selection
      if (!currentSelection || !currentSelection.content?.text) return;

      const { position, content } = currentSelection;
      const text = content.text.trim();

      // Return if no text is selected
      if (!text) return;

      const createHighlight = (openChat: boolean = false) => {
        const newHighlight: IHighlight = {
          ...defaultHighlight,
          id: `hl-${Date.now()}`,
          position,
          content: { text },
          comment: { text: "", emoji: "" },
        };

        // Clear the selection after creating highlight
        if (selectionRef.current?.hideTip) {
          selectionRef.current.hideTip();
        }
        setCurrentSelection(null);

        // Trigger the selection handler with the openChat flag
        onSelection?.(newHighlight, openChat);
      };

      const key = e.key.toLowerCase();

      // Command/Ctrl + L for chat
      if ((e.metaKey || e.ctrlKey) && key === "l") {
        e.preventDefault();
        e.stopPropagation();
        createHighlight(true);
      }
      // Command/Ctrl + K for annotation
      else if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        e.stopPropagation();
        createHighlight(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSelection, onSelection]);

  const handleAddHighlight = () => {
    if (!currentSelection || !currentSelection.content?.text) return;

    const { position, content } = currentSelection;
    const text = content.text.trim();

    if (!text) return;

    const newHighlight: IHighlight = {
      ...defaultHighlight,
      id: `hl-${Date.now()}`,
      position,
      content: { text },
      comment: { text: "", emoji: "" },
    };

    // Clear the selection after creating highlight
    if (selectionRef.current?.hideTip) {
      selectionRef.current.hideTip();
    }
    setCurrentSelection(null);

    onSelection?.(newHighlight, false);
  };

  return (
    <div className="absolute inset-0">
      <PdfLoader
        url={proxyUrl}
        beforeLoad={<LoadingOverlay message="Loading PDF..." />}
      >
        {(pdfDocument) => (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div className="absolute bottom-2 right-5 z-10 flex bg-gray-900/60 p-2 rounded-md space-x-2">
              <Button variant="outline" size="icon" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="py-8 h-full overflow-hidden bg-emerald-900/20">
              <div style={{ transform: `scale(${scale})`, height: '100%' }}>
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  enableAreaSelection={(event) => event.altKey}
                  scrollRef={() => {}}
                  pdfScaleValue={scale.toString()}
                  highlights={highlights}
                  onScrollChange={() => {}}
                  onSelectionFinished={(position, content, hideTipAndSelection) => {
                    const text = content?.text?.trim();
                    if (!text) {
                      hideTipAndSelection();
                      return null;
                    }

                    setCurrentSelection({ position, content });
                    selectionRef.current = {
                      position,
                      content,
                      hideTip: hideTipAndSelection,
                    };

                    const highlight = {
                      ...defaultHighlight,
                      id: `hl-${Date.now()}`,
                      position,
                      content: { text },
                      comment: { text: "", emoji: "" },
                    };

                    return (
                      <div className="flex gap-1 p-2 bg-slate-800/90 rounded-md shadow-lg border border-[#2a2a2a]">
                        <button
                          onClick={handleAddHighlight}
                          className="px-2 py-1 text-[9px] text-white bg-violet-600 opacity-80 hover:opacity-100 rounded"
                        >
                          Add Highlight
                        </button>
                        <button
                          onClick={() => {
                            const newHighlight: IHighlight = {
                              ...highlight,
                              comment: { text: "", emoji: "" },
                            };
                            onSelection?.(newHighlight, true);
                            hideTipAndSelection();
                          }}
                          className="px-2 py-1 text-[9px] text-white bg-violet-600 opacity-80 hover:opacity-100 rounded"
                        >
                          Add to Chat
                        </button>
                      </div>
                    );
                  }}
                  highlightTransform={(highlight, index, setTip, hideTip) => (
                    <Popup
                      popupContent={
                        <div className="px-3 py-2 text-xs text-white bg-[#1a1f2e] rounded-md shadow-lg border border-[#2a2a2a]">
                          {highlight.comment?.text || ""}
                        </div>
                      }
                      onMouseOver={(popupContent) => {
                        // Only set tip if we have valid positioning
                        if (
                          highlight.position &&
                          highlight.position.boundingRect
                        ) {
                          setTip(highlight, () => popupContent);
                        }
                      }}
                      onMouseOut={hideTip}
                      key={highlight.id} // FIX 1: Add key to Popup
                    >
                      <div
                        onClick={() => onAnnotationClick?.(highlight.id)}
                        className="absolute"
                        style={{
                          top: highlight.position?.boundingRect?.y1?.toFixed(2)
                            ? Number(highlight.position.boundingRect.y1.toFixed(2))
                            : 0,
                          left: highlight.position?.boundingRect?.x1?.toFixed(2)
                            ? Number(highlight.position.boundingRect.x1.toFixed(2))
                            : 0,
                        }}
                      >
                        <Highlight
                          isScrolledTo={false}
                          position={highlight.position}
                          comment={highlight.comment}
                        />
                      </div>
                    </Popup>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </PdfLoader>
    </div>
  );
}
