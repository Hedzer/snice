import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
  imageError?: any;
  imageLoaded?: any;

}

/**
 * Image - React adapter for snice-image
 *
 * This is an auto-generated React wrapper for the Snice image component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/image';
 * import { Image } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Image />;
 * }
 * ```
 */
export const Image = createReactAdapter<ImageProps>({
  tagName: 'snice-image',
  properties: ["src","alt","fallback","placeholder","srcset","sizes","variant","size","lazy","fit","width","height","imageError","imageLoaded"],
  events: {},
  formAssociated: false
});
