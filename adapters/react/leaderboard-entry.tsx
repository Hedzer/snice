// GENERATED FILE — DO NOT EDIT.
// Source: components/leaderboard/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const LeaderboardEntry: SniceReactComponent<LeaderboardEntryProps, SniceComponentRef> = createReactAdapter<LeaderboardEntryProps, false>({
  tagName: 'snice-leaderboard-entry',
  properties: ["rank","name","score","avatar","change","highlighted"],
  events: {},
  formAssociated: false
});
