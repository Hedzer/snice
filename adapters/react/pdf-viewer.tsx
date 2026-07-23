// GENERATED FILE — DO NOT EDIT.
// Source: components/pdf-viewer/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const PdfViewer: SniceReactComponent<PdfViewerProps, SniceComponentRef> = createReactAdapter<PdfViewerProps, false>({
  tagName: 'snice-pdf-viewer',
  properties: ["src","page","zoom","fit"],
  events: {"page-change":"onPageChange","pdf-loaded":"onPdfLoaded","pdf-error":"onPdfError"},
  formAssociated: false
});
