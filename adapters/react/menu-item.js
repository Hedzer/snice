// GENERATED FILE — DO NOT EDIT.
// Source: components/menu/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * MenuItem - React adapter for snice-menu-item
 *
 * This is an auto-generated React wrapper for the Snice menu-item component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/menu/snice-menu-item';
 * import { MenuItem } from 'snice/react';
 *
 * function MyComponent() {
 *   return <MenuItem />;
 * }
 * ```
 */
export const MenuItem = createReactAdapter({
    tagName: 'snice-menu-item',
    properties: ["disabled", "value", "selected"],
    events: { "menu-item-select": "onMenuItemSelect" },
    formAssociated: false
});
//# sourceMappingURL=menu-item.js.map