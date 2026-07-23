import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
    onGridLayoutComplete?: (event: any) => void;
    onGridDragItemPositioned?: (event: any) => void;
}
/**
 * Grid - React adapter for snice-grid
 *
 * This is an auto-generated React wrapper for the Snice grid component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/grid/snice-grid';
 * import { Grid } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Grid />;
 * }
 * ```
 */
export declare const Grid: SniceReactComponent<GridProps, SniceComponentRef>;
//# sourceMappingURL=grid.d.ts.map