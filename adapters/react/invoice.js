// GENERATED FILE — DO NOT EDIT.
// Source: components/invoice/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const Invoice = createReactAdapter({
    tagName: 'snice-invoice',
    properties: ["invoiceNumber", "date", "dueDate", "status", "currency", "taxRate", "discount", "from", "to", "items", "notes", "variant", "showQr", "qrData", "qrPosition"],
    events: { "invoice-item-change": "onInvoiceItemChange", "invoice-status-change": "onInvoiceStatusChange" },
    formAssociated: false
});
//# sourceMappingURL=invoice.js.map