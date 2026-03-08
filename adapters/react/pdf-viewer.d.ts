import type { SniceBaseProps } from './types';
/**
 * Props for the PdfViewer component
 */
export interface PdfViewerProps extends SniceBaseProps {
    src?: any;
    page?: any;
    zoom?: any;
    fit?: any;
}
/**
 * PdfViewer - React adapter for snice-pdf-viewer
 *
 * This is an auto-generated React wrapper for the Snice pdf-viewer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pdf-viewer';
 * import { PdfViewer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <PdfViewer />;
 * }
 * ```
 */
export declare const PdfViewer: import("react").ForwardRefExoticComponent<Omit<PdfViewerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=pdf-viewer.d.ts.map