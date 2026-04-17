// GENERATED FILE — DO NOT EDIT.
// Source: components/treemap/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
 * import 'snice/components/treemap';
 * import { Treemap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Treemap />;
 * }
 * ```
 */
export const Treemap = createReactAdapter<TreemapProps>({
  tagName: 'snice-treemap',
  properties: ["data","showLabels","showValues","colorScheme","padding","animation"],
  events: {"treemap-click":"onTreemapClick","treemap-hover":"onTreemapHover","treemap-drill":"onTreemapDrill"},
  formAssociated: false
});
