import { createReactAdapter } from './wrapper';
/**
 * Chart - React adapter for snice-chart
 *
 * This is an auto-generated React wrapper for the Snice chart component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chart';
 * import { Chart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chart />;
 * }
 * ```
 */
export const Chart = createReactAdapter({
    tagName: 'snice-chart',
    properties: ["type", "datasets", "labels", "options", "width", "height", "renderTrigger", "tooltipVisible", "tooltipContent", "tooltipX", "tooltipY"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=chart.js.map