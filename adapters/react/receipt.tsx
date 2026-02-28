import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Receipt component
 */
export interface ReceiptProps extends SniceBaseProps {
  receiptNumber?: any;
  date?: any;
  currency?: any;
  merchant?: any;
  items?: any;
  tax?: any;
  subtotal?: any;
  total?: any;
  paymentMethod?: any;
  variant?: any;

}

/**
 * Receipt - React adapter for snice-receipt
 *
 * This is an auto-generated React wrapper for the Snice receipt component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/receipt';
 * import { Receipt } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Receipt />;
 * }
 * ```
 */
export const Receipt = createReactAdapter<ReceiptProps>({
  tagName: 'snice-receipt',
  properties: ["receiptNumber","date","currency","merchant","items","tax","subtotal","total","paymentMethod","variant"],
  events: {},
  formAssociated: false
});
