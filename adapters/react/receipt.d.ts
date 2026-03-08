import type { SniceBaseProps } from './types';
/**
 * Props for the Receipt component
 */
export interface ReceiptProps extends SniceBaseProps {
    receiptNumber?: any;
    date?: any;
    currency?: any;
    locale?: any;
    merchant?: any;
    items?: any;
    tax?: any;
    taxes?: any;
    subtotal?: any;
    total?: any;
    tip?: any;
    discount?: any;
    discountLabel?: any;
    paymentMethod?: any;
    paymentDetails?: any;
    variant?: any;
    showQr?: any;
    qrData?: any;
    qrPosition?: any;
    thankYou?: any;
    cashier?: any;
    terminalId?: any;
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
export declare const Receipt: import("react").ForwardRefExoticComponent<Omit<ReceiptProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=receipt.d.ts.map