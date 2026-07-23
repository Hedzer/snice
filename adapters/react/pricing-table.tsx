// GENERATED FILE — DO NOT EDIT.
// Source: components/pricing-table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the PricingTable component
 */
export interface PricingTableProps extends SniceBaseProps {
  plans?: any;
  variant?: any;
  annual?: any;
  onPlanSelect?: (event: any) => void;
}

/**
 * PricingTable - React adapter for snice-pricing-table
 *
 * This is an auto-generated React wrapper for the Snice pricing-table component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pricing-table/snice-pricing-table';
 * import { PricingTable } from 'snice/react';
 *
 * function MyComponent() {
 *   return <PricingTable />;
 * }
 * ```
 */
export const PricingTable: SniceReactComponent<PricingTableProps, SniceComponentRef> = createReactAdapter<PricingTableProps, false>({
  tagName: 'snice-pricing-table',
  properties: ["plans","variant","annual"],
  events: {"plan-select":"onPlanSelect"},
  formAssociated: false
});
