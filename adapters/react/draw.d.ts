import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Draw component
 */
export interface DrawProps extends SniceBaseProps {
    width?: any;
    height?: any;
    tool?: any;
    color?: any;
    strokeWidth?: any;
    backgroundColor?: any;
    lazy?: any;
    lazyRadius?: any;
    friction?: any;
    smoothing?: any;
    autoPolygon?: any;
    polygonCurvePoints?: any;
    autoCircle?: any;
    circlePoints?: any;
    disabled?: any;
    onDrawStart?: (event: any) => void;
    onDrawEnd?: (event: any) => void;
    onDrawClear?: (event: any) => void;
    onDrawUndo?: (event: any) => void;
    onDrawRedo?: (event: any) => void;
}
/**
 * Draw - React adapter for snice-draw
 *
 * This is an auto-generated React wrapper for the Snice draw component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/draw/snice-draw';
 * import { Draw } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Draw />;
 * }
 * ```
 */
export declare const Draw: SniceReactComponent<DrawProps, SniceComponentRef>;
//# sourceMappingURL=draw.d.ts.map