import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Cropper component
 */
export interface CropperProps extends SniceBaseProps {
  src?: any;
  aspectRatio?: any;
  minWidth?: any;
  minHeight?: any;
  outputType?: any;

}

/**
 * Cropper - React adapter for snice-cropper
 *
 * This is an auto-generated React wrapper for the Snice cropper component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/cropper';
 * import { Cropper } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Cropper />;
 * }
 * ```
 */
export const Cropper = createReactAdapter<CropperProps>({
  tagName: 'snice-cropper',
  properties: ["src","aspectRatio","minWidth","minHeight","outputType"],
  events: {},
  formAssociated: false
});
