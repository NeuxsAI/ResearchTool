import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { LoadingOverlay } from "@/components/ui/loading-overlay"


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
}

.text-layer .highlight {
  background: rgb(255, 255, 0, 0.4) !important;
  border-radius: 2px;
  padding: 0 1px;
  margin: 0 -1px;
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
        console.log('Loading PDF:', url);
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (!mounted) return;
        
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setIsLoading(false);
        console.log('PDF loaded, pages:', pdf.numPages);

        // Load and render each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (!mounted) break;
          
          console.log('Rendering page:', pageNum);
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
      if (!canvas) {
        console.error('Canvas not found for page:', pageNum);
        return;
      }

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
      if (!textLayerDiv) {
        console.error('Text layer div not found for page:', pageNum);
        return;
      }

      // Clear any existing content
      textLayerDiv.innerHTML = '';

      // Set text layer dimensions
      textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
      textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

      // Get text content
      const textContent = await page.getTextContent();
      console.log(`Page ${pageNum} text content items:`, textContent.items.length);

      // Render text layer
      const textLayer = await pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
        textDivs: []
      });
      await textLayer.promise;

      console.log('Annotations to process:', annotations.length);
      // Add highlights for annotations
      annotations.forEach(annotation => {
        highlightAnnotations(textLayerDiv, annotation);
      });
    }

    const highlightAnnotations = (textLayerDiv: HTMLElement, annotation: {
      id: string;
      highlight_text?: string;
    }) => {
      if (!annotation.highlight_text) {
        console.log('Annotation has no highlight text:', annotation);
        return;
      }
      
      console.log('Looking for text to highlight:', annotation.highlight_text);
      const spans = Array.from(textLayerDiv.getElementsByTagName('span'));
      console.log(`Found ${spans.length} spans in text layer`);

      // Get all text content first
      const pageText = spans.map(span => span.textContent || '').join('');
      console.log('Page text:', pageText);
      
      // Normalize both texts by removing extra whitespace but keeping single spaces
      const searchText = annotation.highlight_text
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      console.log('Normalized search text:', searchText);

      let foundSpans: HTMLElement[] = [];
      let currentText = '';

      for (const span of spans) {
        const spanText = span.textContent || '';
        foundSpans.push(span);
        currentText += spanText;

        // Normalize the current text the same way
        const normalizedText = currentText
          .replace(/[\n\r]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();

        if (normalizedText.includes(searchText)) {
          // Found our text! Now only highlight the spans that contain our text
          const startIndex = normalizedText.indexOf(searchText);
          let textSoFar = '';
          let highlightSpans: HTMLElement[] = [];

          for (const span of foundSpans) {
            const text = span.textContent || '';
            const prevLength = textSoFar.length;
            textSoFar += text;

            if (textSoFar.length > startIndex && 
                prevLength < startIndex + searchText.length) {
              highlightSpans.push(span);
            }
          }

          // Highlight only the relevant spans
          highlightSpans.forEach(span => span.classList.add('highlight'));
          break;
        }

        // If we've collected too much text, remove spans from the start
        while (currentText.length > searchText.length * 2) {
          const firstSpan = foundSpans.shift();
          if (firstSpan) {
            currentText = currentText.slice((firstSpan.textContent || '').length);
          }
        }
      }
    };

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
  }, [url, annotations]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onSelection?.(selection.toString().trim());
    }
  };

  return (
    <div className="relative flex flex-col items-center p-4 overflow-auto bg-[#1c1c1c] min-h-full">
    {isLoading && <LoadingOverlay message="Processing PDF..." />}
    {!isLoading && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
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
    ))}
  </div>
);
} 