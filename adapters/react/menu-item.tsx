// GENERATED FILE — DO NOT EDIT.
// Source: components/menu/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the MenuItem component
 */
export interface MenuItemProps extends SniceBaseProps {
  disabled?: any;
  value?: any;
  selected?: any;
  onMenuItemSelect?: (event: any) => void;
}

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
export const MenuItem: SniceReactComponent<MenuItemProps, SniceComponentRef> = createReactAdapter<MenuItemProps, false>({
  tagName: 'snice-menu-item',
  properties: ["disabled","value","selected"],
  events: {"menu-item-select":"onMenuItemSelect"},
  formAssociated: false
});
