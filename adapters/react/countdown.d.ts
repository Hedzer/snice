import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Countdown component
 */
export interface CountdownProps extends SniceBaseProps {
    target?: any;
    format?: any;
    variant?: any;
    onCountdownComplete?: (event: any) => void;
    onCountdownTick?: (event: any) => void;
}
/**
 * Countdown - React adapter for snice-countdown
 *
 * This is an auto-generated React wrapper for the Snice countdown component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/countdown/snice-countdown';
 * import { Countdown } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Countdown />;
 * }
 * ```
 */
export declare const Countdown: SniceReactComponent<CountdownProps, SniceComponentRef>;
//# sourceMappingURL=countdown.d.ts.map