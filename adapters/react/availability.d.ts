import type { SniceBaseProps } from './types';
/**
 * Props for the Availability component
 */
export interface AvailabilityProps extends SniceBaseProps {
    value?: any;
    granularity?: any;
    startHour?: any;
    endHour?: any;
    format?: any;
    readonly?: any;
}
/**
 * Availability - React adapter for snice-availability
 *
 * This is an auto-generated React wrapper for the Snice availability component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/availability';
 * import { Availability } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Availability />;
 * }
 * ```
 */
export declare const Availability: import("react").ForwardRefExoticComponent<Omit<AvailabilityProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=availability.d.ts.map