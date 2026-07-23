// GENERATED FILE — DO NOT EDIT.
// Source: components/tabs/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the TabPanel component
 */
export interface TabPanelProps extends SniceBaseProps {
  name?: any;
  transitionIn?: any;
  transitionOut?: any;
  transitioning?: any;
  transitionDuration?: any;

}

/**
 * TabPanel - React adapter for snice-tab-panel
 *
 * This is an auto-generated React wrapper for the Snice tab-panel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tabs/snice-tab-panel';
 * import { TabPanel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TabPanel />;
 * }
 * ```
 */
export const TabPanel: SniceReactComponent<TabPanelProps, SniceComponentRef> = createReactAdapter<TabPanelProps, false>({
  tagName: 'snice-tab-panel',
  properties: ["name","transitionIn","transitionOut","transitioning","transitionDuration"],
  events: {},
  formAssociated: false
});
