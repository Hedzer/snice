import type { SniceBaseProps } from './types';
/**
 * Props for the Binpack component
 */
export interface BinpackProps extends SniceBaseProps {
    gap?: any;
    columnWidth?: any;
    rowHeight?: any;
    horizontal?: any;
    originLeft?: any;
    originTop?: any;
    transitionDuration?: any;
    stagger?: any;
    resize?: any;
    draggable?: any;
    dragThrottle?: any;
}
/**
 * Binpack - React adapter for snice-binpack
 *
 * This is an auto-generated React wrapper for the Snice binpack component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/binpack';
 * import { Binpack } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Binpack />;
 * }
 * ```
 */
export declare const Binpack: import("react").ForwardRefExoticComponent<Omit<BinpackProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=binpack.d.ts.map