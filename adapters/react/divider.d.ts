import type { SniceBaseProps } from './types';
/**
 * Props for the Divider component
 */
export interface DividerProps extends SniceBaseProps {
    orientation?: any;
    variant?: any;
    spacing?: any;
    align?: any;
    text?: any;
    textBackground?: any;
    color?: any;
    capped?: any;
}
/**
 * Divider - React adapter for snice-divider
 *
 * This is an auto-generated React wrapper for the Snice divider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/divider';
 * import { Divider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Divider />;
 * }
 * ```
 */
export declare const Divider: import("react").ForwardRefExoticComponent<Omit<DividerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=divider.d.ts.map