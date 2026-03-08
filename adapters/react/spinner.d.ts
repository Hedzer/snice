import type { SniceBaseProps } from './types';
/**
 * Props for the Spinner component
 */
export interface SpinnerProps extends SniceBaseProps {
    size?: any;
    color?: any;
    label?: any;
    thickness?: any;
}
/**
 * Spinner - React adapter for snice-spinner
 *
 * This is an auto-generated React wrapper for the Snice spinner component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spinner';
 * import { Spinner } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spinner />;
 * }
 * ```
 */
export declare const Spinner: import("react").ForwardRefExoticComponent<Omit<SpinnerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=spinner.d.ts.map