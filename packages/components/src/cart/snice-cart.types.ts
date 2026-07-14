export interface CartItem {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface SniceCartElement extends HTMLElement {
  items: CartItem[];
  currency: string;
  taxRate: number;
  discount: number;
  couponCode: string;
  addItem(item: CartItem): void;
  removeItem(id: string): void;
  updateQuantity(id: string, qty: number): void;
  applyCoupon(code: string): void;
  clear(): void;
}

export interface ItemAddDetail {
  item: CartItem;
}

export interface ItemRemoveDetail {
  item: CartItem;
}

export interface QuantityChangeDetail {
  item: CartItem;
  previousQuantity: number;
  newQuantity: number;
}

export interface CouponApplyDetail {
  code: string;
}

export interface CheckoutDetail {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface SniceCartEventMap {
  'item-add': CustomEvent<ItemAddDetail>;
  'item-remove': CustomEvent<ItemRemoveDetail>;
  'quantity-change': CustomEvent<QuantityChangeDetail>;
  'coupon-apply': CustomEvent<CouponApplyDetail>;
  'checkout': CustomEvent<CheckoutDetail>;
}
