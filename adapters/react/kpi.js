import { createReactAdapter } from './wrapper';
/**
 * Kpi - React adapter for snice-kpi
 *
 * This is an auto-generated React wrapper for the Snice kpi component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/kpi';
 * import { Kpi } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Kpi />;
 * }
 * ```
 */
export const Kpi = createReactAdapter({
    tagName: 'snice-kpi',
    properties: ["label", "value", "trendValue", "trendData", "sentiment", "size", "showSparkline", "colorValue"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=kpi.js.map