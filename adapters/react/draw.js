import { createReactAdapter } from './wrapper';
/**
 * Draw - React adapter for snice-draw
 *
 * This is an auto-generated React wrapper for the Snice draw component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/draw';
 * import { Draw } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Draw />;
 * }
 * ```
 */
export const Draw = createReactAdapter({
    tagName: 'snice-draw',
    properties: ["width", "height", "tool", "color", "strokeWidth", "backgroundColor", "lazy", "lazyRadius", "friction", "smoothing", "autoPolygon", "polygonCurvePoints", "autoCircle", "circlePoints", "disabled"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=draw.js.map