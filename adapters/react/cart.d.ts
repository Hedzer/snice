import type { SniceBaseProps } from './types';
/**
 * Props for the Cart component
 */
export interface CartProps extends SniceBaseProps {
    items?: any;
    currency?: any;
    taxRate?: any;
    discount?: any;
    couponCode?: any;
    couponInput?: any;
}
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
export declare const Cart: import("react").ForwardRefExoticComponent<Omit<CartProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=cart.d.ts.map