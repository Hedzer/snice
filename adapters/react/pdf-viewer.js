import { createReactAdapter } from './wrapper';
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
export const PdfViewer = createReactAdapter({
    tagName: 'snice-pdf-viewer',
    properties: ["src", "page", "zoom", "fit"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=pdf-viewer.js.map