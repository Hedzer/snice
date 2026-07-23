// GENERATED FILE — DO NOT EDIT.
// Source: components/image/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Image component
 */
export interface ImageProps extends SniceBaseProps {
  src?: any;
  alt?: any;
  fallback?: any;
  placeholder?: any;
  srcset?: any;
  sizes?: any;
  variant?: any;
  size?: any;
  lazy?: any;
  fit?: any;
  width?: any;
  height?: any;

}

/**
 * Image - React adapter for snice-image
 *
 * This is an auto-generated React wrapper for the Snice image component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/image/snice-image';
 * import { Image } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Image />;
 * }
 * ```
 */
export const Image: SniceReactComponent<ImageProps, SniceComponentRef> = createReactAdapter<ImageProps, false>({
  tagName: 'snice-image',
  properties: ["src","alt","fallback","placeholder","srcset","sizes","variant","size","lazy","fit","width","height"],
  events: {},
  formAssociated: false
});
