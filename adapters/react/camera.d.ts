import type { SniceBaseProps } from './types';
/**
 * Props for the Camera component
 */
export interface CameraProps extends SniceBaseProps {
    autoStart?: any;
    facingMode?: any;
    mirror?: any;
    controlsPosition?: any;
    showControls?: any;
    width?: any;
    height?: any;
    aspectRatio?: any;
    objectFit?: any;
    onCameraStart?: (event: any) => void;
    onCameraError?: (event: any) => void;
    onCameraStop?: (event: any) => void;
    onCameraCapture?: (event: any) => void;
}
/**
 * Camera - React adapter for snice-camera
 *
 * This is an auto-generated React wrapper for the Snice camera component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/camera';
 * import { Camera } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Camera />;
 * }
 * ```
 */
export declare const Camera: import("react").ForwardRefExoticComponent<Omit<CameraProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=camera.d.ts.map