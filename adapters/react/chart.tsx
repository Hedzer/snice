// GENERATED FILE — DO NOT EDIT.
// Source: components/chart/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
 * import 'snice/components/chart';
 * import { Chart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chart />;
 * }
 * ```
 */
export const Chart = createReactAdapter<ChartProps>({
  tagName: 'snice-chart',
  properties: ["type","datasets","labels","options","width","height"],
  events: {},
  formAssociated: false
});
