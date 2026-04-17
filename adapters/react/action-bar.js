// GENERATED FILE — DO NOT EDIT.
// Source: components/action-bar/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * ActionBar - React adapter for snice-action-bar
 *
 * This is an auto-generated React wrapper for the Snice action-bar component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/action-bar';
 * import { ActionBar } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ActionBar />;
 * }
 * ```
 */
export const ActionBar = createReactAdapter({
    tagName: 'snice-action-bar',
    properties: ["open", "position", "size", "variant", "noAnimation", "noEscapeDismiss"],
    events: { "action-bar-open": "onActionBarOpen", "action-bar-close": "onActionBarClose" },
    formAssociated: false
});
//# sourceMappingURL=action-bar.js.map