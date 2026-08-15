/**
 * Regression coverage for the `accounting` cell format.
 *
 * Field report (table showcase, "Rich Cell Types"): the Accounting card
 * rendered `(12840.50)` — no currency symbol and no thousands separator —
 * sitting directly beside a Currency card reading `$95,000`. Two cells claiming
 * to present the same money in the same grid disagreed about what money looks
 * like.
 *
 * "Accounting" is a CURRENCY notation everywhere it exists (Excel, Numbers,
 * Sheets, every ledger): symbol + grouped digits + negatives in parentheses,
 * with the positive rows padded so their last digit stays under the ")" of the
 * row above. This suite pins that contract and its escape hatches.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-cell';

const cells: HTMLElement[] = [];

afterEach(() => {
  while (cells.length) removeComponent(cells.pop() as HTMLElement);
});

/** Render a standalone `snice-cell` the way the showcase's cell grid does. */
async function accountingCell(value: unknown, column?: Record<string, unknown>) {
  const cell = await createComponent<any>('snice-cell', { type: 'accounting', value: String(value) });
  cells.push(cell);
  if (column) {
    cell.column = { key: 'amount', label: 'Amount', type: 'accounting', ...column };
    await wait(20);
  }
  return cell;
}

/** The painted string, with the alignment padding kept intact. */
function raw(cell: any): string {
  return cell.shadowRoot.querySelector('.cell-content').textContent as string;
}

function text(cell: any): string {
  return raw(cell).trim();
}

describe('accounting cell format', () => {
  it('renders a negative amount with symbol, grouping and parentheses', async () => {
    const cell = await accountingCell(-12840.5);
    expect(text(cell)).toBe('($12,840.50)');
  });

  it('renders a positive amount with symbol and grouping', async () => {
    const cell = await accountingCell(95000);
    expect(text(cell)).toBe('$95,000.00');
  });

  it('agrees with the currency cell on the same amount', async () => {
    const accounting = await accountingCell(95000);
    const currency = await createComponent<any>('snice-cell', { type: 'currency', value: '95000' });
    cells.push(currency);
    expect(text(accounting)).toBe(currency.shadowRoot.querySelector('.cell-content').textContent.trim());
  });

  it('pads positives so their digits align with parenthesised negatives', async () => {
    const positive = await accountingCell(95000);
    const negative = await accountingCell(-95000);
    // A non-breaking space stands in for the closing paren of the row above; a
    // plain space would collapse in HTML and the two rows would sit one glyph
    // apart in a right-aligned column.
    expect(raw(positive)).toContain('$95,000.00\u00a0');
    expect(raw(negative)).toContain('($95,000.00)');
    expect(raw(negative)).not.toContain('\u00a0');
  });

  it('honours an explicit decimals setting', async () => {
    const cell = await accountingCell(-12840.5, { numberFormat: { decimals: 0 } });
    expect(text(cell)).toBe('($12,841)');
  });

  it('honours thousandsSeparator: false', async () => {
    const cell = await accountingCell(12840.5, { numberFormat: { thousandsSeparator: false } });
    expect(text(cell)).toBe('$12840.50');
  });

  it('honours a column currencyFormat currency and locale', async () => {
    const cell = await accountingCell(-12840.5, {
      currencyFormat: { currency: 'EUR', locale: 'de-DE' },
    });
    expect(text(cell)).toContain('€');
    expect(text(cell)).toContain('12.840,50');
    expect(text(cell)).toMatch(/^\(.*\)$/);
  });

  it('lets an explicit numberFormat prefix replace the currency symbol', async () => {
    const cell = await accountingCell(-12840.5, { numberFormat: { prefix: 'CR ' } });
    expect(text(cell)).toBe('(CR 12,840.50)');
    expect(text(cell)).not.toContain('$');
  });

  it('right-aligns like the currency cell it sits beside', async () => {
    // The alignment padding above only means anything in a right-aligned
    // column, and a ledger figure that renders left of its neighbours reads as
    // a different kind of value. snice-cell.css already says so for every
    // numeric type; the cell must not override it with an inline style.
    const cell = await accountingCell(-12840.5);
    expect(cell.style.textAlign).toBe('');
  });

  it('still honours an explicitly declared alignment', async () => {
    const cell = await accountingCell(-12840.5);
    cell.setAttribute('align', 'center');
    await wait(20);
    expect(cell.style.textAlign).toBe('center');
  });

  it('leaves a non-numeric value untouched', async () => {
    const cell = await accountingCell('n/a');
    expect(text(cell)).toBe('n/a');
  });
});
