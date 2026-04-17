// GENERATED FILE — DO NOT EDIT.
// Source: components/heatmap/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
  tooltipText?: any;
  tooltipX?: any;
  tooltipY?: any;
  tooltipVisible?: any;
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
 * import 'snice/components/heatmap';
 * import { Heatmap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Heatmap />;
 * }
 * ```
 */
export const Heatmap = createReactAdapter<HeatmapProps>({
  tagName: 'snice-heatmap',
  properties: ["data","colorScheme","showLabels","cellSize","cellGap","showTooltip","weeks","tooltipText","tooltipX","tooltipY","tooltipVisible"],
  events: {"cell-click":"onCellClick"},
  formAssociated: false
});
