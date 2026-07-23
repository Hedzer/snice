import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the LeaderboardEntry component
 */
export interface LeaderboardEntryProps extends SniceBaseProps {
    rank?: any;
    name?: any;
    score?: any;
    avatar?: any;
    change?: any;
    highlighted?: any;
}
/**
 * LeaderboardEntry - React adapter for snice-leaderboard-entry
 *
 * This is an auto-generated React wrapper for the Snice leaderboard-entry component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/leaderboard/snice-leaderboard-entry';
 * import { LeaderboardEntry } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LeaderboardEntry />;
 * }
 * ```
 */
export declare const LeaderboardEntry: SniceReactComponent<LeaderboardEntryProps, SniceComponentRef>;
//# sourceMappingURL=leaderboard-entry.d.ts.map