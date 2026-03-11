import { createReactAdapter } from './wrapper';
/**
 * Grid - React adapter for snice-grid
 *
 * This is an auto-generated React wrapper for the Snice grid component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/grid';
 * import { Grid } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Grid />;
 * }
 * ```
 */
export const Grid = createReactAdapter({
    tagName: 'snice-grid',
    properties: ["gap", "columnWidth", "rowHeight", "columns", "rows", "originLeft", "originTop", "transitionDuration", "stagger", "resize", "draggable", "dragThrottle"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=grid.js.map