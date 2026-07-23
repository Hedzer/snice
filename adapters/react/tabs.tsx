// GENERATED FILE — DO NOT EDIT.
// Source: components/tabs/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Tabs component
 */
export interface TabsProps extends SniceBaseProps {
  placement?: any;
  selected?: any;
  noScrollControls?: any;
  transition?: any;
  onTabChange?: (event: any) => void;
}

/**
 * Tabs - React adapter for snice-tabs
 *
 * This is an auto-generated React wrapper for the Snice tabs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tabs/snice-tabs';
 * import { Tabs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tabs />;
 * }
 * ```
 */
export const Tabs: SniceReactComponent<TabsProps, SniceComponentRef> = createReactAdapter<TabsProps, false>({
  tagName: 'snice-tabs',
  properties: ["placement","selected","noScrollControls","transition"],
  events: {"tab-change":"onTabChange"},
  formAssociated: false
});
