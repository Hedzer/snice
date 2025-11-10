import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Tabs component
 */
export interface TabsProps extends SniceBaseProps {
  placement?: any;
  selected?: any;
  noScrollControls?: any;
  transition?: any;

}

/**
 * Tabs - React adapter for snice-tabs
 *
 * This is an auto-generated React wrapper for the Snice tabs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tabs';
 * import { Tabs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tabs />;
 * }
 * ```
 */
export const Tabs = createReactAdapter<TabsProps>({
  tagName: 'snice-tabs',
  properties: ["placement","selected","noScrollControls","transition"],
  events: {},
  formAssociated: false
});
