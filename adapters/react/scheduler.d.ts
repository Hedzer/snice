import type { SniceBaseProps } from './types';
/**
 * Props for the Scheduler component
 */
export interface SchedulerProps extends SniceBaseProps {
    resources?: any;
    events?: any;
    view?: any;
    date?: any;
    granularity?: any;
    startHour?: any;
    endHour?: any;
}
/**
 * Scheduler - React adapter for snice-scheduler
 *
 * This is an auto-generated React wrapper for the Snice scheduler component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/scheduler';
 * import { Scheduler } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Scheduler />;
 * }
 * ```
 */
export declare const Scheduler: import("react").ForwardRefExoticComponent<Omit<SchedulerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=scheduler.d.ts.map