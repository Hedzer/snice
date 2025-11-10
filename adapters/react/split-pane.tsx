import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the SplitPane component
 */
export interface SplitPaneProps extends SniceBaseProps {
  direction?: any;
  primarySize?: any;
  minPrimarySize?: any;
  minSecondarySize?: any;
  snapSize?: any;
  disabled?: any;

}

/**
 * SplitPane - React adapter for snice-split-pane
 *
 * This is an auto-generated React wrapper for the Snice split-pane component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/split-pane';
 * import { SplitPane } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SplitPane />;
 * }
 * ```
 */
export const SplitPane = createReactAdapter<SplitPaneProps>({
  tagName: 'snice-split-pane',
  properties: ["direction","primarySize","minPrimarySize","minSecondarySize","snapSize","disabled"],
  events: {},
  formAssociated: false
});
