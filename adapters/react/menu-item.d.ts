import { type SniceReactComponent } from './wrapper';
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
export declare const MenuItem: SniceReactComponent<MenuItemProps, SniceComponentRef>;
//# sourceMappingURL=menu-item.d.ts.map