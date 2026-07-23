import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CameraAnnotate component
 */
export interface CameraAnnotateProps extends SniceBaseProps {
    mode?: any;
    autoStart?: any;
    autoRotateColors?: any;
    showLabelsPanel?: any;
    onCapture?: (event: any) => void;
    onAnnotate?: (event: any) => void;
    onAnnotationChange?: (event: any) => void;
}
/**
 * CameraAnnotate - React adapter for snice-camera-annotate
 *
 * This is an auto-generated React wrapper for the Snice camera-annotate component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/camera-annotate/snice-camera-annotate';
 * import { CameraAnnotate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CameraAnnotate />;
 * }
 * ```
 */
export declare const CameraAnnotate: SniceReactComponent<CameraAnnotateProps, SniceComponentRef>;
//# sourceMappingURL=camera-annotate.d.ts.map