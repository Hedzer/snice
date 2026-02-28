import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Estimate component
 */
export interface EstimateProps extends SniceBaseProps {
  estimateNumber?: any;
  date?: any;
  expiryDate?: any;
  status?: any;
  from?: any;
  to?: any;
  items?: any;
  currency?: any;
  taxRate?: any;
  discount?: any;
  notes?: any;
  variant?: any;

}

/**
 * Estimate - React adapter for snice-estimate
 *
 * This is an auto-generated React wrapper for the Snice estimate component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/estimate';
 * import { Estimate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Estimate />;
 * }
 * ```
 */
export const Estimate = createReactAdapter<EstimateProps>({
  tagName: 'snice-estimate',
  properties: ["estimateNumber","date","expiryDate","status","from","to","items","currency","taxRate","discount","notes","variant"],
  events: {},
  formAssociated: false
});
