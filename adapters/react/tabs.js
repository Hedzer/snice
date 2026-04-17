// GENERATED FILE — DO NOT EDIT.
// Source: components/tabs/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Tabs - React adapter for snice-tabs
 *
 * This is an auto-generated React wrapper for the Snice tabs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tabs';
 * import { Tabs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tabs />;
 * }
 * ```
 */
export const Tabs = createReactAdapter({
    tagName: 'snice-tabs',
    properties: ["placement", "selected", "noScrollControls", "transition"],
    events: { "tab-change": "onTabChange" },
    formAssociated: false
});
//# sourceMappingURL=tabs.js.map