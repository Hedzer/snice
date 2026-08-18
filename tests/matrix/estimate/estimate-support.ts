/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-estimate matrix — the documented oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/estimate.md` and
 * `snice-estimate.types.ts`. The estimate is an invoice that can be argued
 * with: lines may be `optional`, an optional line may be `included` or not,
 * and every number below the table is a function of which lines are IN.
 *
 * The doc's own example is the specification for that:
 *
 *   est.items = [
 *     { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
 *     { description: 'SEO Audit', quantity: 1, unitPrice: 1500,
 *       optional: true, included: false }
 *   ];
 *
 * — an optional line that is not included is priced out of the estimate, and
 * `estimate-accept` carries "the items" (the ones being accepted) and "the
 * total" (of those items).
 *
 * ── Findings pinned by this suite ───────────────────────────────────────────
 *
 *   MATRIX-estimate-1 (fixed)  The doc lists `estimateNumber` with
 *                              "attribute: estimate-number", `expiryDate` with
 *                              "attribute: expiry-date" and `taxRate` with
 *                              "attribute: tax-rate", and the doc's own HTML
 *                              example writes
 *                              `<snice-estimate estimate-number="EST-001" tax-rate="10">`.
 *                              None of those used to reach their property; the
 *                              decorators now name the documented attributes
 *                              and the guards run unpinned.
 */
import { Problems, text, all } from '../matrix-kit';
import { exactPart as part, exactParts as parts, partTokens } from '../part-exact';
import type { EstimateItem, EstimateParty, EstimateStatus, EstimateVariant }
  from '../../../packages/components/src/estimate/snice-estimate.types';

export const STATUSES: readonly EstimateStatus[] =
  ['draft', 'sent', 'accepted', 'declined', 'expired'];

export const VARIANTS: readonly EstimateVariant[] =
  ['standard', 'comparison', 'professional', 'creative', 'minimal'];

export const QR_POSITIONS = ['top-right', 'bottom-right', 'footer'] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

/** No optional lines: every line counts. */
export const REQUIRED_LINES: EstimateItem[] = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'Website Build', quantity: 2, unitPrice: 3000 },
];

/** The doc's own example: one optional line, excluded. */
export const EXCLUDED_LINES: EstimateItem[] = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'SEO Audit', quantity: 1, unitPrice: 1500, optional: true, included: false },
];

/** An optional line left `included` undefined — the docs' default is "in". */
export const DEFAULTED_LINES: EstimateItem[] = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'Copywriting', quantity: 3, unitPrice: 400, optional: true },
];

export const LINE_SETS: Record<string, EstimateItem[]> = {
  required: REQUIRED_LINES,
  excluded: EXCLUDED_LINES,
  defaulted: DEFAULTED_LINES,
};

export const FROM: EstimateParty = {
  name: 'Studio', address: '100 Design Blvd', email: 'hi@studio.com',
};
export const TO: EstimateParty = { name: 'Client Inc', address: '200 Innovation Way' };

// ── The documented money pipeline ───────────────────────────────────────────

/** An optional line counts unless it is explicitly excluded. */
export function isIncluded(item: EstimateItem): boolean {
  return !item.optional || item.included !== false;
}

export function includedItems(items: EstimateItem[]): EstimateItem[] {
  return items.filter(isIncluded);
}

export function expectedSubtotal(items: EstimateItem[]): number {
  return includedItems(items).reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
}

export function expectedDiscountAmount(items: EstimateItem[], discount: number): number {
  return expectedSubtotal(items) * (discount / 100);
}

export function expectedTaxAmount(
  items: EstimateItem[], discount: number, taxRate: number,
): number {
  return (expectedSubtotal(items) - expectedDiscountAmount(items, discount)) * (taxRate / 100);
}

export function expectedTotal(
  items: EstimateItem[], discount: number, taxRate: number,
): number {
  return expectedSubtotal(items)
    - expectedDiscountAmount(items, discount)
    + expectedTaxAmount(items, discount, taxRate);
}

/**
 * `currency` here is a SYMBOL, not an ISO code (the doc's default is `'$'`),
 * so the rendered figure is the symbol followed by a grouped two-decimal
 * number.
 */
export function money(amount: number, currency: string): string {
  return currency + amount.toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

// ── The documented structure ────────────────────────────────────────────────

/** Summary rows, in order: subtotal, then discount and tax if they apply, then total. */
export function expectedSummary(
  items: EstimateItem[], discount: number, taxRate: number, currency: string,
): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['Subtotal', money(expectedSubtotal(items), currency)],
  ];
  if (discount > 0) {
    rows.push([`Discount (${discount}%)`,
      `-${money(expectedDiscountAmount(items, discount), currency)}`]);
  }
  if (taxRate > 0) {
    rows.push([`Tax (${taxRate}%)`,
      money(expectedTaxAmount(items, discount, taxRate), currency)]);
  }
  rows.push(['Total', money(expectedTotal(items, discount, taxRate), currency)]);
  return rows;
}

// ── Readers ─────────────────────────────────────────────────────────────────

function pairOf(row: Element | null): [string, string] {
  const spans = [...(row?.children ?? [])];
  return [text(spans[0]), text(spans[1])];
}

export function readSummary(el: HTMLElement): Array<[string, string]> {
  const rows = [
    part(el, 'subtotal'), part(el, 'discount-row'), part(el, 'tax-row'), part(el, 'total'),
  ].filter(Boolean) as HTMLElement[];
  return rows.map(pairOf);
}

export function readRows(el: HTMLElement): string[][] {
  return parts(el, 'table-row').map(row =>
    [...row.querySelectorAll('td')].map(cell => text(cell)));
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface MoneyCombo {
  items: EstimateItem[];
  discount: number;
  taxRate: number;
  currency: string;
}

export function checkMoney(el: HTMLElement, combo: MoneyCombo, problems: Problems): void {
  const { items, discount, taxRate, currency } = combo;
  problems.equal(readSummary(el), expectedSummary(items, discount, taxRate, currency),
    'summary rows');

  // Every line — included or not — is still LISTED; only the money changes.
  const rows = readRows(el);
  problems.equal(rows.length, items.length, 'table row count');
  items.forEach((item, i) => {
    const cells = rows[i];
    if (!cells) return;
    problems.equal(cells[1], String(item.quantity), `line ${i} quantity`);
    problems.equal(cells[2], money(item.unitPrice, currency), `line ${i} unit price`);
    problems.equal(cells[3], money(item.quantity * item.unitPrice, currency),
      `line ${i} line total`);
  });
}

/** `toJSON(): EstimateJSON` — "full estimate data with computed totals". */
export function checkJson(el: any, combo: MoneyCombo, problems: Problems): void {
  const json = el.toJSON();
  problems.equal(json.subtotal, expectedSubtotal(combo.items), 'toJSON.subtotal');
  problems.equal(json.discountAmount, expectedDiscountAmount(combo.items, combo.discount),
    'toJSON.discountAmount');
  problems.equal(json.taxAmount,
    expectedTaxAmount(combo.items, combo.discount, combo.taxRate), 'toJSON.taxAmount');
  problems.equal(json.total, expectedTotal(combo.items, combo.discount, combo.taxRate),
    'toJSON.total');
}

/** No shadow node claims a part the docs never named. */
const DOCUMENTED_PARTS = new Set([
  'base', 'header', 'logo', 'title', 'status', 'expiry', 'expiry-date', 'meta', 'parties',
  'party', 'party-label', 'party-name', 'party-detail', 'table', 'table-header', 'table-row',
  'table-cell', 'item-toggle', 'summary', 'subtotal', 'discount-row', 'tax-row', 'total',
  'notes', 'notes-label', 'notes-content', 'terms', 'actions', 'accept-button',
  'decline-button', 'footer', 'qr-container', 'qr', 'comparison', 'option', 'option-button',
]);

export function checkNoUndocumentedParts(el: HTMLElement, problems: Problems): void {
  for (const node of all(el, '[part]')) {
    for (const name of partTokens(node)) {
      problems.check(DOCUMENTED_PARTS.has(name), `undocumented part="${name}"`);
    }
  }
}
