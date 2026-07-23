// GENERATED FILE — DO NOT EDIT.
// Source: components/qr-reader/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the QrReader component
 */
export interface QrReaderProps extends SniceBaseProps {
  autoStart?: any;
  camera?: any;
  pickFirst?: any;
  manualSnap?: any;
  scanSpeed?: any;
  tapStart?: any;
  onQrScan?: (event: any) => void;
  onQrError?: (event: any) => void;
  onCameraReady?: (event: any) => void;
  onCameraError?: (event: any) => void;
}

/**
 * QrReader - React adapter for snice-qr-reader
 *
 * This is an auto-generated React wrapper for the Snice qr-reader component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/qr-reader/snice-qr-reader';
 * import { QrReader } from 'snice/react';
 *
 * function MyComponent() {
 *   return <QrReader />;
 * }
 * ```
 */
export const QrReader: SniceReactComponent<QrReaderProps, SniceComponentRef> = createReactAdapter<QrReaderProps, false>({
  tagName: 'snice-qr-reader',
  properties: ["autoStart","camera","pickFirst","manualSnap","scanSpeed","tapStart"],
  events: {"qr-scan":"onQrScan","qr-error":"onQrError","camera-ready":"onCameraReady","camera-error":"onCameraError"},
  formAssociated: false
});
