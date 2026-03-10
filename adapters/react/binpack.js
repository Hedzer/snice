import { createReactAdapter } from './wrapper';
/**
 * Binpack - React adapter for snice-binpack
 *
 * This is an auto-generated React wrapper for the Snice binpack component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/binpack';
 * import { Binpack } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Binpack />;
 * }
 * ```
 */
export const Binpack = createReactAdapter({
    tagName: 'snice-binpack',
    properties: ["gap", "columnWidth", "rowHeight", "horizontal", "originLeft", "originTop", "transitionDuration", "stagger", "resize", "draggable", "dragThrottle"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=binpack.js.map