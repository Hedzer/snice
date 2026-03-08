import { createReactAdapter } from './wrapper';
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
export const Receipt = createReactAdapter({
    tagName: 'snice-receipt',
    properties: ["receiptNumber", "date", "currency", "locale", "merchant", "items", "tax", "taxes", "subtotal", "total", "tip", "discount", "discountLabel", "paymentMethod", "paymentDetails", "variant", "showQr", "qrData", "qrPosition", "thankYou", "cashier", "terminalId"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=receipt.js.map