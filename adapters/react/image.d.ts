import { type SniceReactComponent } from './wrapper';
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
export declare const Image: SniceReactComponent<ImageProps, SniceComponentRef>;
//# sourceMappingURL=image.d.ts.map