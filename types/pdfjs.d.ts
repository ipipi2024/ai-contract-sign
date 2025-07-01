// types/pdfjs.d.ts
declare module 'pdfjs-dist' {
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number }): PDFPageViewport;
    getTextContent(): Promise<TextContent>;
    render(params: RenderParameters): RenderTask;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
    scale: number;
  }

  export interface TextContent {
    items: TextItem[];
  }

  export interface TextItem {
    str: string;
    transform: number[];
    width?: number;
    height?: number;
  }

  export interface RenderParameters {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFPageViewport;
  }

  export interface RenderTask {
    promise: Promise<void>;
  }

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(params: { data: ArrayBuffer | Uint8Array; url?: string }): {
    promise: Promise<PDFDocumentProxy>;
  };

  export const version: string;
}