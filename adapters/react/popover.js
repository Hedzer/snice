// GENERATED FILE — DO NOT EDIT.
// Source: components/popover/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Popover - React adapter for snice-popover
 *
 * This is an auto-generated React wrapper for the Snice popover component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/popover';
 * import { Popover } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Popover />;
 * }
 * ```
 */
export const Popover = createReactAdapter({
    tagName: 'snice-popover',
    properties: ["open", "placement", "distance", "noOutsideDismiss", "noEscapeDismiss"],
    events: { "popover-open": "onPopoverOpen", "popover-close": "onPopoverClose" },
    formAssociated: false
});
//# sourceMappingURL=popover.js.map