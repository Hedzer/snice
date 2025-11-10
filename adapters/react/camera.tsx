import { createReactAdapter } from './wrapper';
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
export const Camera = createReactAdapter<CameraProps>({
  tagName: 'snice-camera',
  properties: ["autoStart","facingMode","mirror","controlsPosition","showControls","width","height","aspectRatio","objectFit"],
  events: {},
  formAssociated: false
});
