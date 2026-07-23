// GENERATED FILE — DO NOT EDIT.
// Source: components/cropper/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Cropper component
 */
export interface CropperProps extends SniceBaseProps {
  src?: any;
  aspectRatio?: any;
  minWidth?: any;
  minHeight?: any;
  outputType?: any;
  onCropChange?: (event: any) => void;
  onCropComplete?: (event: any) => void;
}

/**
 * Cropper - React adapter for snice-cropper
 *
 * This is an auto-generated React wrapper for the Snice cropper component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/cropper/snice-cropper';
 * import { Cropper } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Cropper />;
 * }
 * ```
 */
export const Cropper: SniceReactComponent<CropperProps, SniceComponentRef> = createReactAdapter<CropperProps, false>({
  tagName: 'snice-cropper',
  properties: ["src","aspectRatio","minWidth","minHeight","outputType"],
  events: {"crop-change":"onCropChange","crop-complete":"onCropComplete"},
  formAssociated: false
});
