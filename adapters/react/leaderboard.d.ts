import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Leaderboard component
 */
export interface LeaderboardProps extends SniceBaseProps {
    variant?: any;
    size?: any;
    title?: any;
    onEntryClick?: (event: any) => void;
}
/**
 * Leaderboard - React adapter for snice-leaderboard
 *
 * This is an auto-generated React wrapper for the Snice leaderboard component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/leaderboard/snice-leaderboard';
 * import { Leaderboard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Leaderboard />;
 * }
 * ```
 */
export declare const Leaderboard: SniceReactComponent<LeaderboardProps, SniceComponentRef>;
//# sourceMappingURL=leaderboard.d.ts.map