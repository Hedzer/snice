// GENERATED FILE — DO NOT EDIT.
// Source: components/drawer/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the DrawerTarget component
 */
export interface DrawerTargetProps extends SniceBaseProps {
  for?: any;
  push?: any;

}

/**
 * DrawerTarget - React adapter for snice-drawer-target
 *
 * This is an auto-generated React wrapper for the Snice drawer-target component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/drawer/snice-drawer-target';
 * import { DrawerTarget } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DrawerTarget />;
 * }
 * ```
 */
export const DrawerTarget: SniceReactComponent<DrawerTargetProps, SniceComponentRef> = createReactAdapter<DrawerTargetProps, false>({
  tagName: 'snice-drawer-target',
  properties: ["for","push"],
  events: {},
  formAssociated: false
});
