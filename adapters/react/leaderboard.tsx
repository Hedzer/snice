// GENERATED FILE — DO NOT EDIT.
// Source: components/leaderboard/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const Leaderboard: SniceReactComponent<LeaderboardProps, SniceComponentRef> = createReactAdapter<LeaderboardProps, false>({
  tagName: 'snice-leaderboard',
  properties: ["variant","size","title"],
  events: {"entry-click":"onEntryClick"},
  formAssociated: false
});
