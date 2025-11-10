import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Drawer component
 */
export interface DrawerProps extends SniceBaseProps {
  open?: any;
  position?: any;
  size?: any;
  noBackdrop?: any;
  noBackdropDismiss?: any;
  noEscapeDismiss?: any;
  noFocusTrap?: any;
  persistent?: any;
  pushContent?: any;
  contained?: any;

}

/**
 * Drawer - React adapter for snice-drawer
 *
 * This is an auto-generated React wrapper for the Snice drawer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/drawer';
 * import { Drawer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Drawer />;
 * }
 * ```
 */
export const Drawer = createReactAdapter<DrawerProps>({
  tagName: 'snice-drawer',
  properties: ["open","position","size","noBackdrop","noBackdropDismiss","noEscapeDismiss","noFocusTrap","persistent","pushContent","contained"],
  events: {},
  formAssociated: false
});
