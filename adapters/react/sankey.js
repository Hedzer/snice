import { createReactAdapter } from './wrapper';
/**
 * Sankey - React adapter for snice-sankey
 *
 * This is an auto-generated React wrapper for the Snice sankey component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sankey';
 * import { Sankey } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sankey />;
 * }
 * ```
 */
export const Sankey = createReactAdapter({
    tagName: 'snice-sankey',
    properties: ["data", "nodeWidth", "nodePadding", "alignment", "showLabels", "showValues", "animation"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=sankey.js.map