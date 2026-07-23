import { type SniceReactComponent } from './wrapper';
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
export declare const QrReader: SniceReactComponent<QrReaderProps, SniceComponentRef>;
//# sourceMappingURL=qr-reader.d.ts.map