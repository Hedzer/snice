import { createReactAdapter } from './wrapper';
/**
 * Heatmap - React adapter for snice-heatmap
 *
 * This is an auto-generated React wrapper for the Snice heatmap component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/heatmap';
 * import { Heatmap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Heatmap />;
 * }
 * ```
 */
export const Heatmap = createReactAdapter({
    tagName: 'snice-heatmap',
    properties: ["data", "colorScheme", "showLabels", "cellSize", "cellGap", "showTooltip", "weeks", "tooltipText", "tooltipX", "tooltipY", "tooltipVisible"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=heatmap.js.map