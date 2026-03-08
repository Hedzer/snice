import type { SniceBaseProps } from './types';
/**
 * Props for the Paint component
 */
export interface PaintProps extends SniceBaseProps {
    color?: any;
    strokeWidth?: any;
    minStrokeWidth?: any;
    maxStrokeWidth?: any;
    controls?: any;
    backgroundColor?: any;
    colorSelects?: any;
    disabled?: any;
}
/**
 * Paint - React adapter for snice-paint
 *
 * This is an auto-generated React wrapper for the Snice paint component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/paint';
 * import { Paint } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Paint />;
 * }
 * ```
 */
export declare const Paint: import("react").ForwardRefExoticComponent<Omit<PaintProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=paint.d.ts.map