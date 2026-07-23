// GENERATED FILE — DO NOT EDIT.
// Source: components/treemap/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Treemap component
 */
export interface TreemapProps extends SniceBaseProps {
  data?: any;
  showLabels?: any;
  showValues?: any;
  colorScheme?: any;
  padding?: any;
  animation?: any;
  onTreemapClick?: (event: any) => void;
  onTreemapHover?: (event: any) => void;
  onTreemapDrill?: (event: any) => void;
}

/**
 * Treemap - React adapter for snice-treemap
 *
 * This is an auto-generated React wrapper for the Snice treemap component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/treemap/snice-treemap';
 * import { Treemap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Treemap />;
 * }
 * ```
 */
export const Treemap: SniceReactComponent<TreemapProps, SniceComponentRef> = createReactAdapter<TreemapProps, false>({
  tagName: 'snice-treemap',
  properties: ["data","showLabels","showValues","colorScheme","padding","animation"],
  events: {"treemap-click":"onTreemapClick","treemap-hover":"onTreemapHover","treemap-drill":"onTreemapDrill"},
  formAssociated: false
});
