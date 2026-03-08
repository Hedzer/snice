import { createReactAdapter } from './wrapper';
/**
 * Map - React adapter for snice-map
 *
 * This is an auto-generated React wrapper for the Snice map component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/map';
 * import { Map } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Map />;
 * }
 * ```
 */
export const Map = createReactAdapter({
    tagName: 'snice-map',
    properties: ["center", "zoom", "minZoom", "maxZoom", "markers", "tileUrl"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=map.js.map