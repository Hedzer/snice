// GENERATED FILE — DO NOT EDIT.
// Source: components/invoice/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
  onInvoiceItemChange?: (event: any) => void;
  onInvoiceStatusChange?: (event: any) => void;
}

/**
 * Invoice - React adapter for snice-invoice
 *
 * This is an auto-generated React wrapper for the Snice invoice component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/invoice/snice-invoice';
 * import { Invoice } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Invoice />;
 * }
 * ```
 */
export const Invoice: SniceReactComponent<InvoiceProps, SniceComponentRef> = createReactAdapter<InvoiceProps, false>({
  tagName: 'snice-invoice',
  properties: ["invoiceNumber","date","dueDate","status","currency","taxRate","discount","from","to","items","notes","variant","showQr","qrData","qrPosition"],
  events: {"invoice-item-change":"onInvoiceItemChange","invoice-status-change":"onInvoiceStatusChange"},
  formAssociated: false
});
