// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutSidebar component
 */
export interface LayoutSidebarProps extends SniceBaseProps {
  collapsed?: any;
  contained?: any;
  collapseMode?: any;
  mobileOpen?: any;

}

/**
 * LayoutSidebar - React adapter for snice-layout-sidebar
 *
 * This is an auto-generated React wrapper for the Snice layout-sidebar component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-sidebar';
 * import { LayoutSidebar } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutSidebar />;
 * }
 * ```
 */
export const LayoutSidebar: SniceReactComponent<LayoutSidebarProps, SniceComponentRef> = createReactAdapter<LayoutSidebarProps, false>({
  tagName: 'snice-layout-sidebar',
  properties: ["collapsed","contained","collapseMode","mobileOpen"],
  events: {},
  formAssociated: false
});
