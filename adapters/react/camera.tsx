// GENERATED FILE — DO NOT EDIT.
// Source: components/camera/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
 * import 'snice/components/camera/snice-camera';
 * import { Camera } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Camera />;
 * }
 * ```
 */
export const Camera: SniceReactComponent<CameraProps, SniceComponentRef> = createReactAdapter<CameraProps, false>({
  tagName: 'snice-camera',
  properties: ["autoStart","facingMode","mirror","controlsPosition","showControls","width","height","aspectRatio","objectFit"],
  events: {"camera-start":"onCameraStart","camera-error":"onCameraError","camera-stop":"onCameraStop","camera-capture":"onCameraCapture"},
  formAssociated: false
});
