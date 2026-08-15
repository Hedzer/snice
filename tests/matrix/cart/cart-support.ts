/**
 * snice-cart matrix — oracle module.
 *
 * Every expectation is transcribed from `docs/ai/components/cart.md` (and the
 * long-hand `docs/components/cart.md`) plus `snice-cart.types.ts`:
 *
 *   · "Shopping cart with line items, quantity controls, coupon, tax, discount,
 *     and checkout."
 *   · `currency` prefixes every amount; `taxRate` is a "Tax rate percentage";
 *     `discount` is a "Discount amount".
 *   · `addItem` — "Add item (increments qty if exists)"; `removeItem(id)`;
 *     `updateQuantity(id, qty)` — "Set qty (removes if 0)"; `applyCoupon(code)`;
 *     `clear()` — "Remove all items".
 *   · Events `item-add`, `item-remove`, `quantity-change`, `coupon-apply`,
 *     `checkout` with the detail shapes of the types file.
 *   · Parts `base`, `header`, `items`, `item`, `coupon`, `summary`, `checkout`,
 *     `empty`.
 *   · a11y: "Remove buttons include item name".
 *
 * THE TAX BASE IS NOT DOCUMENTED. "Tax rate percentage" and "Discount amount"
 * do not say whether tax is charged on the subtotal or on the discounted
 * subtotal, and reading the answer off the component is exactly what
 * `.ai/fuzzing.md` forbids. So the oracle asserts what the docs DO fix:
 *
 *   · `total = subtotal - discount + tax`, the identity the `checkout` detail's
 *     own four fields describe;
 *   · the `checkout` detail equals the summary the reader is looking at;
 *   · and the exact tax figure only where the two readings coincide
 *     (`discount === 0`), which every combo without a discount exercises.
 */
import type { CartItem } from '../../../packages/components/src/cart/snice-cart.types';
import '../../../packages/components/src/cart/snice-cart';
import { mount, settle } from './matrix-utils';

export type { CartItem };

/** The documented currencies a combo runs in — the property is a free string. */
export const CURRENCIES = ['$', '€'] as const;

/** Percentages, including the documented default of 0 (no tax row). */
export const TAX_RATES = [0, 8.5] as const;

/** Discount amounts, including the documented default of 0 (no discount row). */
export const DISCOUNTS = [0, 10] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

export const IMAGE = 'https://example.test/shoes.png';

/**
 * Three items whose quantities differ (1 and >1) and whose prices do not
 * collide, so a total that mixes two lines up cannot land on the right number
 * by accident. One carries the documented optional `variant`, one an `image`.
 */
export function basket(): CartItem[] {
  return [
    { id: '1', name: 'Shoes', price: 89.99, quantity: 1, variant: 'Size: M', image: IMAGE },
    { id: '2', name: 'Watch', price: 249, quantity: 2 },
    { id: '3', name: 'Earbuds', price: 59.99, quantity: 3, variant: 'Black' },
  ];
}

/** The documented per-item shapes: with/without an image, with/without a variant. */
export const ITEM_SHAPES = ['plain', 'image', 'variant', 'image+variant'] as const;
export type ItemShape = typeof ITEM_SHAPES[number];

export function itemFor(shape: ItemShape, quantity = 2): CartItem {
  const base: CartItem = { id: '1', name: 'Shoes', price: 89.99, quantity };
  return {
    ...base,
    ...(shape.includes('image') ? { image: IMAGE } : {}),
    ...(shape.includes('variant') ? { variant: 'Size: M' } : {}),
  };
}

// ── The money oracle ────────────────────────────────────────────────────────

/** An amount as the cart renders it: the currency, then a two-decimal figure. */
export function money(amount: number, currency = '$'): string {
  return `${currency}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

/** "line items": the subtotal is the sum of price x quantity. */
export function subtotalOf(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/** A line's own total, the figure its row shows. */
export function lineTotal(item: CartItem): number {
  return item.price * item.quantity;
}

/** The documented item count in the header: the sum of the quantities. */
export function itemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * The tax figure, for the combos where the documented wording is unambiguous.
 * With no discount, "tax rate percentage" has exactly one reading.
 */
export function taxOf(items: CartItem[], taxRate: number, discount: number): number | null {
  if (discount !== 0) return null;
  return subtotalOf(items) * (taxRate / 100);
}

/** Numbers that round to the same two-decimal string are the same money. */
export function sameMoney(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

// ── Mounting one combo ──────────────────────────────────────────────────────

export interface CartElement extends HTMLElement {
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

export interface CartCombo {
  items?: CartItem[];
  currency?: string;
  taxRate?: number;
  discount?: number;
  couponCode?: string;
}

/**
 * Mount one combo. `tax-rate`, `discount` and `coupon-code` cross the ATTRIBUTE
 * channel — the form the docs write (`<snice-cart tax-rate="8.5">`) — and
 * `items` crosses the property channel because the docs say "property only".
 */
export async function mountCart(combo: CartCombo = {}): Promise<CartElement> {
  const { items = [], currency, taxRate, discount, couponCode } = combo;
  const attrs: Record<string, string> = {};
  if (currency !== undefined) attrs.currency = currency;
  if (taxRate !== undefined) attrs['tax-rate'] = String(taxRate);
  if (discount !== undefined) attrs.discount = String(discount);
  if (couponCode !== undefined) attrs['coupon-code'] = couponCode;

  const el = await mount<CartElement>('snice-cart', { attrs, props: { items } });
  await settle();
  return el;
}
