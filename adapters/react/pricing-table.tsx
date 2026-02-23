import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the PricingTable component
 */
export interface PricingTableProps extends SniceBaseProps {
  plans?: any;
  variant?: any;
  annual?: any;

}

/**
 * PricingTable - React adapter for snice-pricing-table
 *
 * This is an auto-generated React wrapper for the Snice pricing-table component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pricing-table';
 * import { PricingTable } from 'snice/react';
 *
 * function MyComponent() {
 *   return <PricingTable />;
 * }
 * ```
 */
export const PricingTable = createReactAdapter<PricingTableProps>({
  tagName: 'snice-pricing-table',
  properties: ["plans","variant","annual"],
  events: {},
  formAssociated: false
});
