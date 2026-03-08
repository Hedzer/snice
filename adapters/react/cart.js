import { createReactAdapter } from './wrapper';
/**
 * Cart - React adapter for snice-cart
 *
 * This is an auto-generated React wrapper for the Snice cart component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/cart';
 * import { Cart } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Cart />;
 * }
 * ```
 */
export const Cart = createReactAdapter({
    tagName: 'snice-cart',
    properties: ["items", "currency", "taxRate", "discount", "couponCode", "couponInput"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=cart.js.map