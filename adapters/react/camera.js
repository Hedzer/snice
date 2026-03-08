import { createReactAdapter } from './wrapper';
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
export const Camera = createReactAdapter({
    tagName: 'snice-camera',
    properties: ["autoStart", "facingMode", "mirror", "controlsPosition", "showControls", "width", "height", "aspectRatio", "objectFit"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=camera.js.map