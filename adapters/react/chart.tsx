// GENERATED FILE — DO NOT EDIT.
// Source: components/chart/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Chart component
 */
export interface ChartProps extends SniceBaseProps {
  type?: any;
  datasets?: any;
  labels?: any;
  options?: any;
  width?: any;
  height?: any;

}

/**
 * Chart - React adapter for snice-chart
 *
 * This is an auto-generated React wrapper for the Snice chart component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chart/snice-chart';
 * import { Chart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chart />;
 * }
 * ```
 */
export const Chart: SniceReactComponent<ChartProps, SniceComponentRef> = createReactAdapter<ChartProps, false>({
  tagName: 'snice-chart',
  properties: ["type","datasets","labels","options","width","height"],
  events: {},
  formAssociated: false
});
