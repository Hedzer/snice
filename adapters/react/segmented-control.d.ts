import type { SniceBaseProps } from './types';
/**
 * Props for the SegmentedControl component
 */
export interface SegmentedControlProps extends SniceBaseProps {
    value?: any;
    options?: any;
    size?: any;
    disabled?: any;
}
/**
 * SegmentedControl - React adapter for snice-segmented-control
 *
 * This is an auto-generated React wrapper for the Snice segmented-control component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/segmented-control';
 * import { SegmentedControl } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SegmentedControl />;
 * }
 * ```
 */
export declare const SegmentedControl: import("react").ForwardRefExoticComponent<Omit<SegmentedControlProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=segmented-control.d.ts.map