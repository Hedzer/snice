import { createReactAdapter } from './wrapper';
/**
 * OrderTracker - React adapter for snice-order-tracker
 *
 * This is an auto-generated React wrapper for the Snice order-tracker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/order-tracker';
 * import { OrderTracker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <OrderTracker />;
 * }
 * ```
 */
export const OrderTracker = createReactAdapter({
    tagName: 'snice-order-tracker',
    properties: ["steps", "trackingNumber", "carrier", "variant"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=order-tracker.js.map