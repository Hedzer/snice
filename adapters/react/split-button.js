// GENERATED FILE — DO NOT EDIT.
// Source: components/split-button/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * SplitButton - React adapter for snice-split-button
 *
 * This is an auto-generated React wrapper for the Snice split-button component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/split-button';
 * import { SplitButton } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SplitButton />;
 * }
 * ```
 */
export const SplitButton = createReactAdapter({
    tagName: 'snice-split-button',
    properties: ["label", "actions", "variant", "size", "disabled", "loading", "outline", "pill", "icon", "iconPlacement"],
    events: { "primary-click": "onPrimaryClick", "action-click": "onActionClick" },
    formAssociated: false
});
//# sourceMappingURL=split-button.js.map