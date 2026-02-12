import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the QrReader component
 */
export interface QrReaderProps extends SniceBaseProps {
  autoStart?: boolean;
  camera?: 'front' | 'back';
  pickFirst?: boolean;
  manualSnap?: boolean;
  scanSpeed?: number;
  tapStart?: boolean;
  onQrScan?: (event: CustomEvent) => void;
  onQrError?: (event: CustomEvent) => void;
  onCameraReady?: (event: CustomEvent) => void;
  onCameraError?: (event: CustomEvent) => void;
}

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
export const QrReader = createReactAdapter<QrReaderProps>({
  tagName: 'snice-qr-reader',
  properties: ["autoStart", "camera", "pickFirst", "manualSnap", "scanSpeed", "tapStart"],
  events: {
    'qr-scan': 'onQrScan',
    'qr-error': 'onQrError',
    'camera-ready': 'onCameraReady',
    'camera-error': 'onCameraError'
  },
  formAssociated: false
});
