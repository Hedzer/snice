import { createReactAdapter } from './wrapper';
/**
 * OrgChart - React adapter for snice-org-chart
 *
 * This is an auto-generated React wrapper for the Snice org-chart component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/org-chart';
 * import { OrgChart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <OrgChart />;
 * }
 * ```
 */
export const OrgChart = createReactAdapter({
    tagName: 'snice-org-chart',
    properties: ["data", "direction", "compact", "renderVersion"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=org-chart.js.map