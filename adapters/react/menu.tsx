import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Menu component
 */
export interface MenuProps extends SniceBaseProps {
  open?: any;
  placement?: any;
  trigger?: any;
  closeOnSelect?: any;
  distance?: any;

}

/**
 * Menu - React adapter for snice-menu
 *
 * This is an auto-generated React wrapper for the Snice menu component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/menu';
 * import { Menu } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Menu />;
 * }
 * ```
 */
export const Menu = createReactAdapter<MenuProps>({
  tagName: 'snice-menu',
  properties: ["open","placement","trigger","closeOnSelect","distance"],
  events: {},
  formAssociated: false
});
