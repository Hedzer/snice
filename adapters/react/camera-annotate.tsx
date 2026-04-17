// GENERATED FILE — DO NOT EDIT.
// Source: components/camera-annotate/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the CameraAnnotate component
 */
export interface CameraAnnotateProps extends SniceBaseProps {
  mode?: any;
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
 * import 'snice/components/camera-annotate';
 * import { CameraAnnotate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CameraAnnotate />;
 * }
 * ```
 */
export const CameraAnnotate = createReactAdapter<CameraAnnotateProps>({
  tagName: 'snice-camera-annotate',
  properties: ["mode","autoRotateColors","showLabelsPanel"],
  events: {"capture":"onCapture","annotate":"onAnnotate","annotation-change":"onAnnotationChange"},
  formAssociated: false
});
