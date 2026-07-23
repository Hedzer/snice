// GENERATED FILE — DO NOT EDIT.
// Source: components/camera-annotate/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * CameraAnnotate - React adapter for snice-camera-annotate
 *
 * This is an auto-generated React wrapper for the Snice camera-annotate component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/camera-annotate/snice-camera-annotate';
 * import { CameraAnnotate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CameraAnnotate />;
 * }
 * ```
 */
export const CameraAnnotate = createReactAdapter({
    tagName: 'snice-camera-annotate',
    properties: ["mode", "autoStart", "autoRotateColors", "showLabelsPanel"],
    events: { "capture": "onCapture", "annotate": "onAnnotate", "annotation-change": "onAnnotationChange" },
    formAssociated: false
});
//# sourceMappingURL=camera-annotate.js.map