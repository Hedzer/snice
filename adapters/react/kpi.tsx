import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Kpi component
 */
export interface KpiProps extends SniceBaseProps {
  label?: any;
  value?: any;
  trendValue?: any;
  trendData?: any;
  sentiment?: any;
  size?: any;
  showSparkline?: any;
  colorValue?: any;

}

/**
 * Kpi - React adapter for snice-kpi
 *
 * This is an auto-generated React wrapper for the Snice kpi component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/kpi';
 * import { Kpi } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Kpi />;
 * }
 * ```
 */
export const Kpi = createReactAdapter<KpiProps>({
  tagName: 'snice-kpi',
  properties: ["label","value","trendValue","trendData","sentiment","size","showSparkline","colorValue"],
  events: {},
  formAssociated: false
});
