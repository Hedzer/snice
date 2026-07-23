// GENERATED FILE — DO NOT EDIT.
// Source: components/stat-group/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * StatGroup - React adapter for snice-stat-group
 *
 * This is an auto-generated React wrapper for the Snice stat-group component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/stat-group/snice-stat-group';
 * import { StatGroup } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StatGroup />;
 * }
 * ```
 */
export const StatGroup = createReactAdapter({
    tagName: 'snice-stat-group',
    properties: ["stats", "columns", "variant"],
    events: { "stat-click": "onStatClick" },
    formAssociated: false
});
//# sourceMappingURL=stat-group.js.map