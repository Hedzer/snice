import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Sankey component
 */
export interface SankeyProps extends SniceBaseProps {
  data?: any;
  nodeWidth?: any;
  nodePadding?: any;
  alignment?: any;
  showLabels?: any;
  showValues?: any;
  animation?: any;
  renderTrigger?: any;

}

/**
 * Sankey - React adapter for snice-sankey
 *
 * This is an auto-generated React wrapper for the Snice sankey component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sankey';
 * import { Sankey } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sankey />;
 * }
 * ```
 */
export const Sankey = createReactAdapter<SankeyProps>({
  tagName: 'snice-sankey',
  properties: ["data","nodeWidth","nodePadding","alignment","showLabels","showValues","animation","renderTrigger"],
  events: {},
  formAssociated: false
});
