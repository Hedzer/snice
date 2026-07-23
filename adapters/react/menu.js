// GENERATED FILE — DO NOT EDIT.
// Source: components/menu/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Menu - React adapter for snice-menu
 *
 * This is an auto-generated React wrapper for the Snice menu component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/menu/snice-menu';
 * import { Menu } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Menu />;
 * }
 * ```
 */
export const Menu = createReactAdapter({
    tagName: 'snice-menu',
    properties: ["open", "placement", "trigger", "closeOnSelect", "distance"],
    events: { "menu-open": "onMenuOpen", "menu-close": "onMenuClose" },
    formAssociated: false
});
//# sourceMappingURL=menu.js.map