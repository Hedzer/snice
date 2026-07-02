// GENERATED FILE — DO NOT EDIT.
// Source: components/org-chart/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the OrgChart component
 */
export interface OrgChartProps extends SniceBaseProps {
  data?: any;
  direction?: any;
  compact?: any;
  onNodeClick?: (event: any) => void;
  onNodeExpand?: (event: any) => void;
  onNodeCollapse?: (event: any) => void;
}

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
export const OrgChart = createReactAdapter<OrgChartProps>({
  tagName: 'snice-org-chart',
  properties: ["data","direction","compact"],
  events: {"node-click":"onNodeClick","node-expand":"onNodeExpand","node-collapse":"onNodeCollapse"},
  formAssociated: false
});
