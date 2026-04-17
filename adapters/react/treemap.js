// GENERATED FILE — DO NOT EDIT.
// Source: components/treemap/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Treemap - React adapter for snice-treemap
 *
 * This is an auto-generated React wrapper for the Snice treemap component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/treemap';
 * import { Treemap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Treemap />;
 * }
 * ```
 */
export const Treemap = createReactAdapter({
    tagName: 'snice-treemap',
    properties: ["data", "showLabels", "showValues", "colorScheme", "padding", "animation"],
    events: { "treemap-click": "onTreemapClick", "treemap-hover": "onTreemapHover", "treemap-drill": "onTreemapDrill" },
    formAssociated: false
});
//# sourceMappingURL=treemap.js.map