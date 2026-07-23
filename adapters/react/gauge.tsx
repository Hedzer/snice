// GENERATED FILE — DO NOT EDIT.
// Source: components/gauge/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Gauge component
 */
export interface GaugeProps extends SniceBaseProps {
  value?: any;
  min?: any;
  max?: any;
  label?: any;
  variant?: any;
  size?: any;
  showValue?: any;
  thickness?: any;

}

/**
 * Gauge - React adapter for snice-gauge
 *
 * This is an auto-generated React wrapper for the Snice gauge component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/gauge/snice-gauge';
 * import { Gauge } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Gauge />;
 * }
 * ```
 */
export const Gauge: SniceReactComponent<GaugeProps, SniceComponentRef> = createReactAdapter<GaugeProps, false>({
  tagName: 'snice-gauge',
  properties: ["value","min","max","label","variant","size","showValue","thickness"],
  events: {},
  formAssociated: false
});
