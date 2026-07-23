// GENERATED FILE — DO NOT EDIT.
// Source: components/menu/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Menu component
 */
export interface MenuProps extends SniceBaseProps {
  open?: any;
  placement?: any;
  trigger?: any;
  closeOnSelect?: any;
  distance?: any;
  onMenuOpen?: (event: any) => void;
  onMenuClose?: (event: any) => void;
}

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
export const Menu: SniceReactComponent<MenuProps, SniceComponentRef> = createReactAdapter<MenuProps, false>({
  tagName: 'snice-menu',
  properties: ["open","placement","trigger","closeOnSelect","distance"],
  events: {"menu-open":"onMenuOpen","menu-close":"onMenuClose"},
  formAssociated: false
});
