// GENERATED FILE — DO NOT EDIT.
// Source: components/heatmap/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Heatmap component
 */
export interface HeatmapProps extends SniceBaseProps {
  data?: any;
  colorScheme?: any;
  showLabels?: any;
  cellSize?: any;
  cellGap?: any;
  showTooltip?: any;
  weeks?: any;
  onCellClick?: (event: any) => void;
}

/**
 * Heatmap - React adapter for snice-heatmap
 *
 * This is an auto-generated React wrapper for the Snice heatmap component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/heatmap/snice-heatmap';
 * import { Heatmap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Heatmap />;
 * }
 * ```
 */
export const Heatmap: SniceReactComponent<HeatmapProps, SniceComponentRef> = createReactAdapter<HeatmapProps, false>({
  tagName: 'snice-heatmap',
  properties: ["data","colorScheme","showLabels","cellSize","cellGap","showTooltip","weeks"],
  events: {"cell-click":"onCellClick"},
  formAssociated: false
});
