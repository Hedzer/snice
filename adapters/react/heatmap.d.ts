import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
    onCellClick?: (event: any) => void;
}
/**
 * Heatmap - React adapter for snice-heatmap
 *
 * This is an auto-generated React wrapper for the Snice heatmap component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/heatmap/snice-heatmap';
 * import { Heatmap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Heatmap />;
 * }
 * ```
 */
export declare const Heatmap: SniceReactComponent<HeatmapProps, SniceComponentRef>;
//# sourceMappingURL=heatmap.d.ts.map