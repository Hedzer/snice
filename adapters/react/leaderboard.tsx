import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Leaderboard component
 */
export interface LeaderboardProps extends SniceBaseProps {
  entries?: any;
  variant?: any;
  metricLabel?: any;

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
export const Leaderboard = createReactAdapter<LeaderboardProps>({
  tagName: 'snice-leaderboard',
  properties: ["entries","variant","metricLabel"],
  events: {},
  formAssociated: false
});
