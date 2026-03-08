import { createReactAdapter } from './wrapper';
/**
 * QrReader - React adapter for snice-qr-reader
 *
 * This is an auto-generated React wrapper for the Snice qr-reader component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/qr-reader';
 * import { QrReader } from 'snice/react';
 *
 * function MyComponent() {
 *   return <QrReader />;
 * }
 * ```
 */
export const QrReader = createReactAdapter({
    tagName: 'snice-qr-reader',
    properties: ["autoStart", "camera", "pickFirst", "manualSnap", "scanSpeed", "tapStart", "scanning", "lastScan", "errorMessage", "showSnapshot"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=qr-reader.js.map