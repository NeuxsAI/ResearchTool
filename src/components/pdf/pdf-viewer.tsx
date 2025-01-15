import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const textLayerStyles = `
.text-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
  text-align: initial;
  user-select: text;
  pointer-events: auto;
  transform-origin: 0 0;
}

.text-layer > span {
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
  color: transparent;
  background: none;
}

.text-layer ::selection {
  background: rgb(0, 0, 255, 0.2);
}`;

interface PDFViewerProps {
  url: string;
  onSelection?: (text: string) => void;
  annotations?: Array<{
    id: string;
    highlight_text?: string;
  }>;
}

export function PDFViewer({ url, onSelection, annotations = [] }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const pageRefs = useRef<Map<number, pdfjsLib.PDFPageProxy>>(new Map());

  // Add styles to document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = textLayerStyles;
    document.head.append(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPDF() {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (!mounted) return;
        
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setIsLoading(false);

        // Load and render each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (!mounted) break;
          
          const page = await pdf.getPage(pageNum);
          pageRefs.current.set(pageNum, page);
          await renderPage(page, pageNum);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    }

    async function renderPage(page: pdfjsLib.PDFPageProxy, pageNum: number) {
      if (!mounted) return;

      const scale = 1.5;
      const viewport = page.getViewport({ scale, rotation: 0 });
      
      // Setup canvas
      const canvas = document.getElementById(`page-${pageNum}`) as HTMLCanvasElement;
      if (!canvas) return;

      // Set canvas dimensions with device pixel ratio
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";

      // Render PDF page into canvas context
      const context = canvas.getContext('2d')!;
      const transform = outputScale !== 1 
        ? [outputScale, 0, 0, outputScale, 0, 0] as [number, number, number, number, number, number]
        : undefined;

      await page.render({
        canvasContext: context,
        viewport,
        transform,
      }).promise;

      // Create text layer div
      const textLayerDiv = document.getElementById(`text-layer-${pageNum}`);
      if (!textLayerDiv) return;

      // Clear any existing content
      textLayerDiv.innerHTML = '';

      // Set text layer dimensions
      textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
      textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

      // Get text content
      const textContent = await page.getTextContent();

      // Render text layer
      const textLayer = await pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
        textDivs: []
      });
      await textLayer.promise;
    }

    loadPDF();
    return () => { 
      mounted = false;
      // Cleanup page references
      pageRefs.current.clear();
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      }
    };
  }, [url]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onSelection?.(selection.toString().trim());
    }
  };

  return (
    <div className="flex flex-col items-center p-4 overflow-auto bg-[#1c1c1c] min-h-full">
      {isLoading ? (
        <div className="text-white">Loading PDF...</div>
      ) : (
        Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <div 
            key={pageNum} 
            className="relative mb-4 select-none" 
            onMouseUp={handleTextSelection}
          >
            <canvas
              id={`page-${pageNum}`}
              className="bg-white shadow-lg"
            />
            <div
              id={`text-layer-${pageNum}`}
              className="absolute top-0 left-0 text-layer select-text"
            />
          </div>
        ))
      )}
    </div>
  );
} 