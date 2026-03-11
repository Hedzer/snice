import type { SniceBaseProps } from './types';
/**
 * Props for the Grid component
 */
export interface GridProps extends SniceBaseProps {
    gap?: any;
    columnWidth?: any;
    rowHeight?: any;
    columns?: any;
    rows?: any;
    originLeft?: any;
    originTop?: any;
    transitionDuration?: any;
    stagger?: any;
    resize?: any;
    draggable?: any;
    dragThrottle?: any;
}
/**
 * Grid - React adapter for snice-grid
 *
 * This is an auto-generated React wrapper for the Snice grid component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/grid';
 * import { Grid } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Grid />;
 * }
 * ```
 */
export declare const Grid: import("react").ForwardRefExoticComponent<Omit<GridProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=grid.d.ts.map