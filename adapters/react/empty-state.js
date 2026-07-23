// GENERATED FILE — DO NOT EDIT.
// Source: components/empty-state/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * EmptyState - React adapter for snice-empty-state
 *
 * This is an auto-generated React wrapper for the Snice empty-state component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/empty-state/snice-empty-state';
 * import { EmptyState } from 'snice/react';
 *
 * function MyComponent() {
 *   return <EmptyState />;
 * }
 * ```
 */
export const EmptyState = createReactAdapter({
    tagName: 'snice-empty-state',
    properties: ["size", "icon", "title", "description", "actionText", "actionHref"],
    events: { "empty-state-action": "onEmptyStateAction" },
    formAssociated: false
});
//# sourceMappingURL=empty-state.js.map