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
export declare const Invoice: import("react").ForwardRefExoticComponent<Omit<InvoiceProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=invoice.d.ts.map