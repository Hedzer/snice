import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
 * import 'snice/components/org-chart/snice-org-chart';
 * import { OrgChart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <OrgChart />;
 * }
 * ```
 */
export declare const OrgChart: SniceReactComponent<OrgChartProps, SniceComponentRef>;
//# sourceMappingURL=org-chart.d.ts.map