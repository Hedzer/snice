// GENERATED FILE — DO NOT EDIT.
// Source: components/qr-reader/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    events: { "qr-scan": "onQrScan", "qr-error": "onQrError", "camera-ready": "onCameraReady", "camera-error": "onCameraError" },
    formAssociated: false
});
//# sourceMappingURL=qr-reader.js.map