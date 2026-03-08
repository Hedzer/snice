import type { SniceBaseProps } from './types';
/**
 * Props for the Timer component
 */
export interface TimerProps extends SniceBaseProps {
    mode?: any;
    initialTime?: any;
    running?: any;
    time?: any;
}
/**
 * Timer - React adapter for snice-timer
 *
 * This is an auto-generated React wrapper for the Snice timer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/timer';
 * import { Timer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Timer />;
 * }
 * ```
 */
export declare const Timer: import("react").ForwardRefExoticComponent<Omit<TimerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=timer.d.ts.map