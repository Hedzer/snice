// GENERATED FILE — DO NOT EDIT.
// Source: components/receipt/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
 * import 'snice/components/receipt/snice-receipt';
 * import { Receipt } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Receipt />;
 * }
 * ```
 */
export const Receipt: SniceReactComponent<ReceiptProps, SniceComponentRef> = createReactAdapter<ReceiptProps, false>({
  tagName: 'snice-receipt',
  properties: ["receiptNumber","date","currency","locale","merchant","items","tax","taxes","subtotal","total","tip","discount","discountLabel","paymentMethod","paymentDetails","variant","showQr","qrData","qrPosition","thankYou","cashier","terminalId"],
  events: {},
  formAssociated: false
});
