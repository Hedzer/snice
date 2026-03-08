import { createReactAdapter } from './wrapper';
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
export const Image = createReactAdapter({
    tagName: 'snice-image',
    properties: ["src", "alt", "fallback", "placeholder", "srcset", "sizes", "variant", "size", "lazy", "fit", "width", "height", "imageError", "imageLoaded"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=image.js.map