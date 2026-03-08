import type { SniceBaseProps } from './types';
/**
 * Props for the OrgChart component
 */
export interface OrgChartProps extends SniceBaseProps {
    data?: any;
    direction?: any;
    compact?: any;
    renderVersion?: any;
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
export declare const OrgChart: import("react").ForwardRefExoticComponent<Omit<OrgChartProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=org-chart.d.ts.map