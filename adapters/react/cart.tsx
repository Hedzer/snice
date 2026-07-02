// GENERATED FILE — DO NOT EDIT.
// Source: components/cart/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
  onItemAdd?: (event: any) => void;
  onItemRemove?: (event: any) => void;
  onQuantityChange?: (event: any) => void;
  onCouponApply?: (event: any) => void;
  onCheckout?: (event: any) => void;
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
export const Cart = createReactAdapter<CartProps>({
  tagName: 'snice-cart',
  properties: ["items","currency","taxRate","discount","couponCode"],
  events: {"item-add":"onItemAdd","item-remove":"onItemRemove","quantity-change":"onQuantityChange","coupon-apply":"onCouponApply","checkout":"onCheckout"},
  formAssociated: false
});
