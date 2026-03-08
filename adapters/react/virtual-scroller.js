import { createReactAdapter } from './wrapper';
/**
 * VirtualScroller - React adapter for snice-virtual-scroller
 *
 * This is an auto-generated React wrapper for the Snice virtual-scroller component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/virtual-scroller';
 * import { VirtualScroller } from 'snice/react';
 *
 * function MyComponent() {
 *   return <VirtualScroller />;
 * }
 * ```
 */
export const VirtualScroller = createReactAdapter({
    tagName: 'snice-virtual-scroller',
    properties: ["items", "itemHeight", "bufferSize", "estimatedItemHeight", "renderItem", "_scrollTick"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=virtual-scroller.js.map