import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Invoice component
 */
export interface InvoiceProps extends SniceBaseProps {
  invoiceNumber?: any;
  date?: any;
  dueDate?: any;
  status?: any;
  currency?: any;
  taxRate?: any;
  discount?: any;
  from?: any;
  to?: any;
  items?: any;
  notes?: any;
  variant?: any;
  showQr?: any;
  qrData?: any;
  qrPosition?: any;

}

/**
 * Invoice - React adapter for snice-invoice
 *
 * This is an auto-generated React wrapper for the Snice invoice component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/invoice';
 * import { Invoice } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Invoice />;
 * }
 * ```
 */
export const Invoice = createReactAdapter<InvoiceProps>({
  tagName: 'snice-invoice',
  properties: ["invoiceNumber","date","dueDate","status","currency","taxRate","discount","from","to","items","notes","variant","showQr","qrData","qrPosition"],
  events: {},
  formAssociated: false
});
