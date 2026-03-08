import { createReactAdapter } from './wrapper';
/**
 * Estimate - React adapter for snice-estimate
 *
 * This is an auto-generated React wrapper for the Snice estimate component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/estimate';
 * import { Estimate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Estimate />;
 * }
 * ```
 */
export const Estimate = createReactAdapter({
    tagName: 'snice-estimate',
    properties: ["estimateNumber", "date", "expiryDate", "status", "from", "to", "items", "currency", "taxRate", "discount", "notes", "terms", "variant", "showQr", "qrData", "qrPosition"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=estimate.js.map