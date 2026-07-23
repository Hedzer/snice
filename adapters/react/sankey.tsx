// GENERATED FILE — DO NOT EDIT.
// Source: components/sankey/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
  onSankeyNodeClick?: (event: any) => void;
  onSankeyLinkClick?: (event: any) => void;
  onSankeyHover?: (event: any) => void;
}

/**
 * Sankey - React adapter for snice-sankey
 *
 * This is an auto-generated React wrapper for the Snice sankey component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sankey/snice-sankey';
 * import { Sankey } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sankey />;
 * }
 * ```
 */
export const Sankey: SniceReactComponent<SankeyProps, SniceComponentRef> = createReactAdapter<SankeyProps, false>({
  tagName: 'snice-sankey',
  properties: ["data","nodeWidth","nodePadding","alignment","showLabels","showValues","animation"],
  events: {"sankey-node-click":"onSankeyNodeClick","sankey-link-click":"onSankeyLinkClick","sankey-hover":"onSankeyHover"},
  formAssociated: false
});
