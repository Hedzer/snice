// GENERATED FILE — DO NOT EDIT.
// Source: components/leaderboard/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const Leaderboard = createReactAdapter({
    tagName: 'snice-leaderboard',
    properties: ["variant", "size", "title", "entries"],
    events: { "entry-click": "onEntryClick" },
    formAssociated: false
});
//# sourceMappingURL=leaderboard.js.map