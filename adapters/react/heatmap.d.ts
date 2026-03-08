import type { SniceBaseProps } from './types';
/**
 * Props for the Heatmap component
 */
export interface HeatmapProps extends SniceBaseProps {
    data?: any;
    colorScheme?: any;
    showLabels?: any;
    cellSize?: any;
    cellGap?: any;
    showTooltip?: any;
    weeks?: any;
    tooltipText?: any;
    tooltipX?: any;
    tooltipY?: any;
    tooltipVisible?: any;
}
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
export declare const Heatmap: import("react").ForwardRefExoticComponent<Omit<HeatmapProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=heatmap.d.ts.map