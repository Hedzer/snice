import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Spinner component
 */
export interface SpinnerProps extends SniceBaseProps {
    size?: any;
    color?: any;
    label?: any;
    thickness?: any;
    variant?: any;
}
/**
 * Spinner - React adapter for snice-spinner
 *
 * This is an auto-generated React wrapper for the Snice spinner component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spinner/snice-spinner';
 * import { Spinner } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spinner />;
 * }
 * ```
 */
export declare const Spinner: SniceReactComponent<SpinnerProps, SniceComponentRef>;
//# sourceMappingURL=spinner.d.ts.map