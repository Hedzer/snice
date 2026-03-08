import type { SniceBaseProps } from './types';
/**
 * Props for the CameraAnnotate component
 */
export interface CameraAnnotateProps extends SniceBaseProps {
    mode?: any;
    autoRotateColors?: any;
    showLabelsPanel?: any;
}
/**
 * CameraAnnotate - React adapter for snice-camera-annotate
 *
 * This is an auto-generated React wrapper for the Snice camera-annotate component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/camera-annotate';
 * import { CameraAnnotate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CameraAnnotate />;
 * }
 * ```
 */
export declare const CameraAnnotate: import("react").ForwardRefExoticComponent<Omit<CameraAnnotateProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=camera-annotate.d.ts.map