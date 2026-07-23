import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the PdfViewer component
 */
export interface PdfViewerProps extends SniceBaseProps {
    src?: any;
    page?: any;
    zoom?: any;
    fit?: any;
    onPageChange?: (event: any) => void;
    onPdfLoaded?: (event: any) => void;
    onPdfError?: (event: any) => void;
}
/**
 * PdfViewer - React adapter for snice-pdf-viewer
 *
 * This is an auto-generated React wrapper for the Snice pdf-viewer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pdf-viewer/snice-pdf-viewer';
 * import { PdfViewer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <PdfViewer />;
 * }
 * ```
 */
export declare const PdfViewer: SniceReactComponent<PdfViewerProps, SniceComponentRef>;
//# sourceMappingURL=pdf-viewer.d.ts.map