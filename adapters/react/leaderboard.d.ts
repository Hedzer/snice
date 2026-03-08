import type { SniceBaseProps } from './types';
/**
 * Props for the Leaderboard component
 */
export interface LeaderboardProps extends SniceBaseProps {
    variant?: any;
    size?: any;
    title?: any;
    entries?: any;
}
/**
 * Leaderboard - React adapter for snice-leaderboard
 *
 * This is an auto-generated React wrapper for the Snice leaderboard component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/leaderboard';
 * import { Leaderboard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Leaderboard />;
 * }
 * ```
 */
export declare const Leaderboard: import("react").ForwardRefExoticComponent<Omit<LeaderboardProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=leaderboard.d.ts.map