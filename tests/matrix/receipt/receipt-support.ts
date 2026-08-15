/**
 * snice-receipt matrix — oracle module.
 *
 * Every expectation here is transcribed from `docs/ai/components/receipt.md`
 * and `snice-receipt.types.ts`. Nothing is read off the component:
 *
 *   · "Subtotal auto-computed from items if not set"
 *   · "Total auto-computed as subtotal + tax - discount + tip if not set"
 *   · "`taxes` array overrides single `tax` property"
 *   · "SKU, notes, per-item discounts only in `detailed` variant"
 *   · `locale` is documented as an "Intl.NumberFormat locale", and `currency`
 *     as the currency code — so the display oracle IS Intl.NumberFormat.
 *
 * The variant axis is the full documented union from the types file (nine
 * values), not the five the prose calls out: a variant that exists in the type
 * but changes the money maths would otherwise never be measured.
 */
import type {
  ReceiptItem,
  ReceiptTaxLine,
  ReceiptMerchant,
  ReceiptVariant,
  QrPosition,
} from '../../../packages/components/src/receipt/snice-receipt.types';
import '../../../packages/components/src/receipt/snice-receipt';

export { };

/** The documented `ReceiptVariant` union, in declaration order. */
export const VARIANTS: readonly ReceiptVariant[] = [
  'standard', 'thermal', 'modern', 'minimal', 'detailed',
  'paper', 'ink', 'ledger', 'ticket',
] as const;

/** The documented `QrPosition` union, plus "no QR at all". */
export const QR_POSITIONS: readonly QrPosition[] = ['top', 'bottom', 'footer'] as const;

/** The receipt state a combo asserts against — the documented properties only. */
export interface ReceiptState {
  items: ReceiptItem[];
  tax: number;
  taxes: ReceiptTaxLine[];
  subtotal: number;
  total: number;
  tip: number;
  discount: number;
  discountLabel: string;
  currency: string;
  locale: string;
}

export function state(overrides: Partial<ReceiptState> = {}): ReceiptState {
  return {
    items: [],
    tax: 0,
    taxes: [],
    subtotal: 0,
    total: 0,
    tip: 0,
    discount: 0,
    discountLabel: 'Discount',
    currency: 'USD',
    locale: '',
    ...overrides,
  };
}

// ── The money oracle ────────────────────────────────────────────────────────

/**
 * Display text for an amount. `currency` is a currency code and `locale` is an
 * "Intl.NumberFormat locale" (docs), so the documented rendering of an amount
 * is exactly what Intl.NumberFormat produces for that pair.
 */
export function money(amount: number, currency = 'USD', locale = ''): string {
  return new Intl.NumberFormat(locale || undefined, {
    style: 'currency',
    currency,
  }).format(amount);
}

/** Line total for one item, before the item's own discount. */
export function lineTotal(item: ReceiptItem): number {
  return item.quantity * item.price;
}

/**
 * "Subtotal auto-computed from items if not set." An explicitly set `subtotal`
 * wins; otherwise the items are the source, each contributing its line total
 * less its own discount (the discount is part of the item).
 */
export function expectedSubtotal(s: ReceiptState): number {
  if (s.subtotal > 0) return s.subtotal;
  return s.items.reduce((sum, item) => sum + lineTotal(item) - (item.discount ?? 0), 0);
}

/** "`taxes` array overrides single `tax` property." */
export function expectedTax(s: ReceiptState): number {
  if (s.taxes.length > 0) return s.taxes.reduce((sum, t) => sum + t.amount, 0);
  return s.tax;
}

/** "Total auto-computed as subtotal + tax - discount + tip if not set." */
export function expectedTotal(s: ReceiptState): number {
  if (s.total > 0) return s.total;
  return expectedSubtotal(s) + expectedTax(s) - s.discount + s.tip;
}

/** The label a `taxes` entry shows: "Label (rate%)" when it declares a rate. */
export function taxLabel(line: ReceiptTaxLine): string {
  return line.rate ? `${line.label} (${line.rate}%)` : line.label;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

export const MERCHANT: ReceiptMerchant = {
  name: 'Coffee House',
  address: '123 Brew St',
  phone: '555-0100',
  email: 'hi@brew.test',
  website: 'brew.test',
  taxId: 'TX-9',
};

/**
 * Three items whose quantities differ (1 and >1, so the documented `item-qty`
 * part has both shapes to render) and whose prices do not collide, so a total
 * that mixes two lines up cannot land on the right number by accident.
 */
export function baseItems(): ReceiptItem[] {
  return [
    { name: 'Cappuccino', quantity: 2, price: 4.5 },
    { name: 'Croissant', quantity: 1, price: 3.75 },
    { name: 'Beans 1kg', quantity: 3, price: 12.25 },
  ];
}

/** The same three items, each carrying the `detailed`-only extras. */
export function detailedItems(): ReceiptItem[] {
  return [
    { name: 'Cappuccino', quantity: 2, price: 4.5, sku: 'SKU-CAP', note: 'oat milk', discount: 1.5 },
    { name: 'Croissant', quantity: 1, price: 3.75, sku: 'SKU-CRO', note: 'warmed' },
    { name: 'Beans 1kg', quantity: 3, price: 12.25, sku: 'SKU-BNS', discount: 4 },
  ];
}

export const TAX_LINES: ReceiptTaxLine[] = [
  { label: 'State Tax', rate: 6, amount: 3 },
  { label: 'City Tax', amount: 1 },
];

/**
 * The four documented money shapes.
 *
 *  · `auto`     — nothing set but items: both subtotal and total are derived.
 *  · `adjusted` — tax + tip + discount all non-zero, so every optional totals
 *                 row renders and the derived total exercises all four terms.
 *  · `taxes`    — a `taxes` array AND a conflicting single `tax`: the array
 *                 must win, in the rows and in the total.
 *  · `explicit` — subtotal and total both set, so neither may be recomputed.
 */
export const MONEY_SHAPES = ['auto', 'adjusted', 'taxes', 'explicit'] as const;
export type MoneyShape = typeof MONEY_SHAPES[number];

export function moneyState(shape: MoneyShape, items: ReceiptItem[]): ReceiptState {
  switch (shape) {
    case 'auto':
      return state({ items });
    case 'adjusted':
      return state({ items, tax: 1.15, tip: 2, discount: 0.5, discountLabel: 'Loyalty' });
    case 'taxes':
      // `tax` is deliberately a number nothing else in the combo produces, so a
      // component that ignores the override renders a value the oracle can name.
      return state({ items, tax: 9.99, taxes: TAX_LINES, tip: 1.25 });
    case 'explicit':
      return state({ items, subtotal: 100, total: 250, tax: 5, tip: 3, discount: 2 });
  }
}

/** The documented item shapes: plain, plus each `detailed`-only extra alone. */
export const ITEM_SHAPES = ['plain', 'sku', 'note', 'item-discount'] as const;
export type ItemShape = typeof ITEM_SHAPES[number];

export function itemsFor(shape: ItemShape): ReceiptItem[] {
  const base = { name: 'Cappuccino', quantity: 2, price: 4.5 };
  switch (shape) {
    case 'plain': return [base];
    case 'sku': return [{ ...base, sku: 'SKU-CAP' }];
    case 'note': return [{ ...base, note: 'oat milk' }];
    case 'item-discount': return [{ ...base, discount: 1.5 }];
  }
}
