// GENERATED FILE — DO NOT EDIT.
// Source: components/org-chart/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * OrgChart - React adapter for snice-org-chart
 *
 * This is an auto-generated React wrapper for the Snice org-chart component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/org-chart/snice-org-chart';
 * import { OrgChart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <OrgChart />;
 * }
 * ```
 */
export const OrgChart = createReactAdapter({
    tagName: 'snice-org-chart',
    properties: ["data", "direction", "compact"],
    events: { "node-click": "onNodeClick", "node-expand": "onNodeExpand", "node-collapse": "onNodeCollapse" },
    formAssociated: false
});
//# sourceMappingURL=org-chart.js.map