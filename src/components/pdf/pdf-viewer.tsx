import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  onSelection?: (text: string) => void;
  highlights?: Array<{ text: string; color?: string }>;
}

interface RenderingError extends Error {
  name: string;
}

export function PDFViewer({ url, onSelection, highlights = [] }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const renderTask = useRef<any>(null);
  const currentPageRef = useRef(currentPage);

  // Update currentPageRef when currentPage changes
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Load PDF document
  useEffect(() => {
    let mounted = true;
    let pdfDoc: PDFDocumentProxy | null = null;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;
        if (mounted) {
          setPdf(pdfDoc);
          setNumPages(pdfDoc.numPages);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      mounted = false;
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [url]);

  // Render current page
  useEffect(() => {
    let mounted = true;

    const renderPage = async () => {
      if (!pdf || !canvasRef.current || !textLayerRef.current) return;

      // Cancel any ongoing render task
      if (renderTask.current) {
        renderTask.current.cancel();
        renderTask.current = null;
      }

      try {
        setIsLoading(true);
        const page = await pdf.getPage(currentPage);
        if (!mounted) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const textLayer = textLayerRef.current;

        if (!context) return;

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        textLayer.style.height = `${viewport.height}px`;
        textLayer.style.width = `${viewport.width}px`;

        // Clear previous content
        textLayer.innerHTML = '';

        // Render PDF page
        renderTask.current = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.current.promise;
        if (!mounted) return;

        // Get text content and render text layer
        const textContent = await page.getTextContent();
        if (!mounted) return;

        // Create text elements with proper scaling
        textContent.items.forEach((item: any, index: number) => {
          const tx = pdfjsLib.Util.transform(
            viewport.transform,
            item.transform
          );

          const textDiv = document.createElement('div');
          textDiv.setAttribute('data-index', index.toString());
          textDiv.style.position = 'absolute';
          textDiv.style.left = `${tx[4]}px`;
          textDiv.style.top = `${tx[5]}px`;
          textDiv.style.fontSize = `${Math.floor(tx[0])}px`;
          textDiv.style.transform = `scaleX(${tx[0] / Math.floor(tx[0])})`;
          textDiv.style.transformOrigin = 'left bottom';
          textDiv.style.color = 'transparent';
          textDiv.style.pointerEvents = 'all';
          textDiv.style.userSelect = 'text';
          textDiv.style.whiteSpace = 'pre';
          textDiv.textContent = item.str;

          // Apply highlight if text matches
          const matchingHighlight = highlights.find(h => item.str.includes(h.text));
          if (matchingHighlight) {
            textDiv.style.backgroundColor = matchingHighlight.color || 'rgba(255, 255, 0, 0.3)';
          }

          textLayer.appendChild(textDiv);
        });

        // Cleanup
        page.cleanup();

      } catch (error) {
        const renderError = error as RenderingError;
        if (renderError.name !== 'RenderingCancelled') {
          console.error('Error rendering page:', error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      mounted = false;
      if (renderTask.current) {
        renderTask.current.cancel();
        renderTask.current = null;
      }
    };
  }, [pdf, currentPage, scale, highlights]);

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      
      if (selectedText && onSelection) {
        onSelection(selectedText);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleMouseUp);
      return () => container.removeEventListener('mouseup', handleMouseUp);
    }
  }, [onSelection]);

  return (
    <div className="flex flex-col h-full bg-[#1c1c1c]">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || isLoading}
            className="px-2 py-1 text-sm bg-[#2a2a2a] text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-[#888]">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages || isLoading}
            className="px-2 py-1 text-sm bg-[#2a2a2a] text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            disabled={isLoading}
            className="px-2 py-1 text-sm bg-[#2a2a2a] text-white rounded hover:bg-[#3a3a3a] disabled:opacity-50"
          >
            -
          </button>
          <span className="text-sm text-[#888] min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
            disabled={isLoading}
            className="px-2 py-1 text-sm bg-[#2a2a2a] text-white rounded hover:bg-[#3a3a3a] disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center p-4"
      >
        <div className="relative">
          <canvas ref={canvasRef} className="shadow-lg" />
          <div 
            ref={textLayerRef}
            className="absolute top-0 left-0 right-0 bottom-0"
            style={{ 
              userSelect: 'text',
              cursor: 'text',
              pointerEvents: 'none'
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1c1c1c] bg-opacity-50">
              <div className="text-white">Loading...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 