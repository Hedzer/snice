/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-invoice matrix — the documented oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation in this module is a transcription of
 * `docs/ai/components/invoice.md` and `snice-invoice.types.ts`. Nothing here
 * was read back off the component: the money pipeline below is the doc's own
 * three sentences ("`amount` on item overrides `quantity * unitPrice`",
 * "Discount applied before tax", "Currency formatting via `Intl.NumberFormat`")
 * written as code, and the structure oracle is the doc's CSS-part list.
 *
 * The mechanism (cross / mount / Problems / expectClean) comes from the shared
 * `tests/matrix/matrix-kit.ts`; only the invoice-specific oracle lives here.
 *
 * ── Findings recorded by this suite ─────────────────────────────────────────
 *
 *   MATRIX-invoice-1 (fixed)  The doc says the `detailed` variant is what
 *                     "shows line numbers". The line-number cell used to
 *                     render in every variant, so a non-detailed invoice's
 *                     body rows carried one more cell than their header row.
 *                     The component now honours the sentence (via CSS), and
 *                     the shown/absent-in-both-directions regression guard
 *                     runs unpinned in tests/live/matrix/invoice/.
 *   MATRIX-invoice-2 (fixed)  Same sentence covers per-item tax ("`detailed`
 *                     variant shows line numbers and per-item tax"): an item
 *                     carrying `tax` used to print "Tax: n%" under every
 *                     variant; the same visual guard pins it to `detailed`.
 */
import { Problems, text, all } from '../matrix-kit';
// `[part~="x"]` also matches `x-y` under happy-dom, and this component's part
// list is full of shared prefixes (party/party-label, summary/summary-row,
// table/table-row, notes/notes-label). The shared exact reader is the only way
// to count what the component actually rendered.
import { exactPart as part, exactParts as parts, exactPartsIn, partTokens } from '../part-exact';
import type { InvoiceItem, InvoiceParty, InvoiceStatus, InvoiceVariant }
  from '../../../packages/components/src/invoice/snice-invoice.types';

export const STATUSES: readonly InvoiceStatus[] =
  ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

/** Every variant the docs and the type union list. */
export const VARIANTS: readonly InvoiceVariant[] =
  ['standard', 'modern', 'classic', 'minimal', 'detailed', 'paper', 'ink', 'ledger', 'ticket'];

export const QR_POSITIONS = ['top-right', 'bottom-right', 'bottom-left', 'footer'] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

/** Plain lines: amount is derived (`quantity * unitPrice`). */
export const DERIVED_LINES: InvoiceItem[] = [
  { description: 'Web Development', quantity: 40, unitPrice: 150 },
  { description: 'Design Services', quantity: 10, unitPrice: 120 },
];

/** One line carries an explicit `amount`, which the docs say WINS. */
export const OVERRIDDEN_LINES: InvoiceItem[] = [
  { description: 'Retainer', quantity: 3, unitPrice: 1000, amount: 2500 },
  { description: 'Hosting', quantity: 12, unitPrice: 9.99 },
];

/** Per-item tax, the `detailed` variant's documented extra. */
export const TAXED_LINES: InvoiceItem[] = [
  { description: 'Consulting', quantity: 5, unitPrice: 200, tax: 7 },
  { description: 'Training', quantity: 2, unitPrice: 350 },
];

export const LINE_SETS: Record<string, InvoiceItem[]> = {
  derived: DERIVED_LINES,
  overridden: OVERRIDDEN_LINES,
  taxed: TAXED_LINES,
};

export const FROM: InvoiceParty = {
  name: 'Acme Corp', address: '123 Main St', email: 'billing@acme.com',
};
export const TO: InvoiceParty = { name: 'Client Inc', address: '456 Oak Ave' };

// ── The documented money pipeline ───────────────────────────────────────────

/** "`amount` on item overrides `quantity * unitPrice` calculation". */
export function expectedItemAmount(item: InvoiceItem): number {
  return item.amount !== undefined ? item.amount : item.quantity * item.unitPrice;
}

export function expectedSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + expectedItemAmount(item), 0);
}

/** `discount` is a percentage of the subtotal. */
export function expectedDiscountAmount(items: InvoiceItem[], discount: number): number {
  return expectedSubtotal(items) * (discount / 100);
}

/** "Discount applied before tax" — tax is charged on the discounted base. */
export function expectedTaxAmount(
  items: InvoiceItem[], discount: number, taxRate: number,
): number {
  return (expectedSubtotal(items) - expectedDiscountAmount(items, discount)) * (taxRate / 100);
}

export function expectedTotal(
  items: InvoiceItem[], discount: number, taxRate: number,
): number {
  return expectedSubtotal(items)
    - expectedDiscountAmount(items, discount)
    + expectedTaxAmount(items, discount, taxRate);
}

/** "Currency formatting via `Intl.NumberFormat`", with the ISO 4217 code. */
export function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// ── The documented structure ────────────────────────────────────────────────

/**
 * The summary rows the docs promise, in order: `summary-row` (subtotal) is
 * unconditional, `discount-row` appears with a discount, `tax-row` with a tax
 * rate, `total` closes the block.
 */
export function expectedSummaryLabels(discount: number, taxRate: number): string[] {
  const labels = ['Subtotal'];
  if (discount > 0) labels.push(`Discount (${discount}%)`);
  if (taxRate > 0) labels.push(`Tax (${taxRate}%)`);
  labels.push('Total');
  return labels;
}

export function expectedSummaryValues(
  items: InvoiceItem[], discount: number, taxRate: number, currency: string,
): string[] {
  const values = [money(expectedSubtotal(items), currency)];
  if (discount > 0) values.push(`-${money(expectedDiscountAmount(items, discount), currency)}`);
  if (taxRate > 0) values.push(money(expectedTaxAmount(items, discount, taxRate), currency));
  values.push(money(expectedTotal(items, discount, taxRate), currency));
  return values;
}

/**
 * "`detailed` variant shows line numbers and per-item tax" — so the column
 * count is four (Description, Qty, Unit Price, Amount) everywhere else, five
 * under `detailed`.
 */
export function expectedColumnCount(variant: InvoiceVariant): number {
  return variant === 'detailed' ? 5 : 4;
}

export function expectedColumnHeadings(variant: InvoiceVariant): string[] {
  const headings = ['Description', 'Qty', 'Unit Price', 'Amount'];
  return variant === 'detailed' ? ['#', ...headings] : headings;
}

/** The line's description cell — per-item tax rides along only in `detailed`. */
export function expectedDescriptionCell(item: InvoiceItem, variant: InvoiceVariant): string {
  if (variant === 'detailed' && item.tax !== undefined) {
    return `${item.description} Tax: ${item.tax}%`;
  }
  return item.description;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function summaryRowNodes(el: HTMLElement): HTMLElement[] {
  return [
    ...parts(el, 'summary-row'),
    ...parts(el, 'discount-row'),
    ...parts(el, 'tax-row'),
    ...parts(el, 'total'),
  ];
}

/** Labels/values read in DOCUMENT order, which is the order the docs list. */
export function readSummary(el: HTMLElement): { labels: string[]; values: string[] } {
  const rows = summaryRowNodes(el).sort((a, b) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
  return {
    labels: rows.map(row => text(exactPartsIn(row, 'summary-label')[0])),
    values: rows.map(row => text(exactPartsIn(row, 'summary-value')[0])),
  };
}

export function readBodyRows(el: HTMLElement): string[][] {
  return parts(el, 'table-row').map(row =>
    exactPartsIn(row, 'table-cell').map(cell => text(cell)));
}

export function readHeadings(el: HTMLElement): string[] {
  const header = part(el, 'table-header');
  if (!header) return [];
  return [...header.querySelectorAll('th')].map(th => text(th));
}

// ── The oracle ──────────────────────────────────────────────────────────────

export interface MoneyCombo {
  items: InvoiceItem[];
  discount: number;
  taxRate: number;
  currency: string;
}

/** Every documented money claim about one rendered invoice, at once. */
export function checkMoney(el: HTMLElement, combo: MoneyCombo, problems: Problems): void {
  const { items, discount, taxRate, currency } = combo;
  const summary = readSummary(el);
  problems.equal(summary.labels, expectedSummaryLabels(discount, taxRate), 'summary labels');
  problems.equal(
    summary.values, expectedSummaryValues(items, discount, taxRate, currency), 'summary values');

  const rows = readBodyRows(el);
  problems.check(rows.length === items.length,
    `rendered ${rows.length} line rows for ${items.length} items`);
  items.forEach((item, i) => {
    const cells = rows[i];
    if (!cells) return;
    // The last two documented columns are unit price and amount.
    const unitPrice = cells[cells.length - 2];
    const amount = cells[cells.length - 1];
    problems.equal(unitPrice, money(item.unitPrice, currency), `line ${i} unit price`);
    problems.equal(amount, money(expectedItemAmount(item), currency), `line ${i} amount`);
  });
}

/** `toJSON()` — "Returns full invoice data with computed totals". */
export function checkJson(el: any, combo: MoneyCombo, problems: Problems): void {
  const json = el.toJSON();
  problems.equal(json.subtotal, expectedSubtotal(combo.items), 'toJSON.subtotal');
  problems.equal(json.tax, expectedTaxAmount(combo.items, combo.discount, combo.taxRate),
    'toJSON.tax');
  problems.equal(json.total, expectedTotal(combo.items, combo.discount, combo.taxRate),
    'toJSON.total');
  problems.equal(json.currency, combo.currency, 'toJSON.currency');
}

/** The parts the docs promise unconditionally. */
export const ALWAYS_PARTS = ['base', 'header', 'title', 'status', 'meta', 'summary', 'footer'];

export function checkAlwaysParts(el: HTMLElement, problems: Problems): void {
  for (const name of ALWAYS_PARTS) {
    problems.check(!!part(el, name), `part="${name}" is missing`);
  }
}

/** No stray shadow node claims a part the docs never named. */
export function checkNoUndocumentedParts(el: HTMLElement, problems: Problems): void {
  const documented = new Set([
    'base', 'header', 'title', 'status', 'logo', 'meta', 'parties', 'party', 'party-label',
    'party-name', 'party-detail', 'table', 'table-header', 'table-row', 'table-cell',
    'summary', 'summary-row', 'summary-label', 'summary-value', 'discount-row', 'tax-row',
    'total', 'notes', 'notes-label', 'notes-content', 'qr', 'qr-container', 'footer',
  ]);
  for (const node of all(el, '[part]')) {
    for (const name of partTokens(node)) {
      problems.check(documented.has(name), `undocumented part="${name}"`);
    }
  }
}
