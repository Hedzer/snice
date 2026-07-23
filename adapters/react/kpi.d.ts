import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Kpi component
 */
export interface KpiProps extends SniceBaseProps {
    label?: any;
    value?: any;
    trendValue?: any;
    trendData?: any;
    sentiment?: any;
    size?: any;
    showSparkline?: any;
    colorValue?: any;
}
/**
 * Kpi - React adapter for snice-kpi
 *
 * This is an auto-generated React wrapper for the Snice kpi component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/kpi/snice-kpi';
 * import { Kpi } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Kpi />;
 * }
 * ```
 */
export declare const Kpi: SniceReactComponent<KpiProps, SniceComponentRef>;
//# sourceMappingURL=kpi.d.ts.map