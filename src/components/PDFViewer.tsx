interface PDFViewerProps extends IntrinsicAttributes {
  url: string;
  onSelection?: (text: string) => void;
  annotations?: { id: string; content: string; highlight_text?: string }[];
  onAnnotationClick?: (annotation: { id: string; content: string; highlight_text?: string }) => void;
} 