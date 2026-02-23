import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the NetworkGraph component
 */
export interface NetworkGraphProps extends SniceBaseProps {
  data?: any;
  layout?: any;
  chargeStrength?: any;
  linkDistance?: any;
  zoomEnabled?: any;
  dragEnabled?: any;
  showLabels?: any;
  animation?: any;

}

/**
 * NetworkGraph - React adapter for snice-network-graph
 *
 * This is an auto-generated React wrapper for the Snice network-graph component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/network-graph';
 * import { NetworkGraph } from 'snice/react';
 *
 * function MyComponent() {
 *   return <NetworkGraph />;
 * }
 * ```
 */
export const NetworkGraph = createReactAdapter<NetworkGraphProps>({
  tagName: 'snice-network-graph',
  properties: ["data","layout","chargeStrength","linkDistance","zoomEnabled","dragEnabled","showLabels","animation"],
  events: {},
  formAssociated: false
});
