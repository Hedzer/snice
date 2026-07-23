import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Timer component
 */
export interface TimerProps extends SniceBaseProps {
    mode?: any;
    initialTime?: any;
    running?: any;
    onTimerStart?: (event: any) => void;
    onTimerStop?: (event: any) => void;
    onTimerReset?: (event: any) => void;
    onTimerComplete?: (event: any) => void;
}
/**
 * Timer - React adapter for snice-timer
 *
 * This is an auto-generated React wrapper for the Snice timer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/timer/snice-timer';
 * import { Timer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Timer />;
 * }
 * ```
 */
export declare const Timer: SniceReactComponent<TimerProps, SniceComponentRef>;
//# sourceMappingURL=timer.d.ts.map