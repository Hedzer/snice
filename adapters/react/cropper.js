import { createReactAdapter } from './wrapper';
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
export const Cropper = createReactAdapter({
    tagName: 'snice-cropper',
    properties: ["src", "aspectRatio", "minWidth", "minHeight", "outputType"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=cropper.js.map