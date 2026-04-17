// GENERATED FILE — DO NOT EDIT.
// Source: components/waterfall/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Waterfall - React adapter for snice-waterfall
 *
 * This is an auto-generated React wrapper for the Snice waterfall component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/waterfall';
 * import { Waterfall } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Waterfall />;
 * }
 * ```
 */
export const Waterfall = createReactAdapter({
    tagName: 'snice-waterfall',
    properties: ["data", "orientation", "showValues", "showConnectors", "animated"],
    events: { "bar-click": "onBarClick", "bar-hover": "onBarHover" },
    formAssociated: false
});
//# sourceMappingURL=waterfall.js.map