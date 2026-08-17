/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-invoice matrix — smoke slice
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The one file of this directory the DEFAULT vitest loop collects
 * (vitest.config.ts keeps `tests/matrix/**\/smoke.test.ts` and excludes the
 * rest). One combo per feature family, plus the marquee regressions:
 *
 *   · the money pipeline end to end (discount before tax, Intl formatting);
 *   · the summary rows that appear and disappear with discount/tax;
 *   · both documented events;
 *   · the `detailed` variant's extra heading, the one structural difference
 *     between the nine variants that is visible from this tier at all (the
 *     matching cell is hidden by CSS, which only the visual tier can judge).
 *
 * The full cross lives in the sibling files and runs via
 * `npx vitest run --config vitest.matrix.config.ts tests/matrix/invoice`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, Problems, expectClean, captureEvents, text, wait } from '../matrix-kit';
import { exactPart as part } from '../part-exact';
import {
  DERIVED_LINES, FROM, TO, checkMoney, readBodyRows, readHeadings,
  expectedTotal, money,
} from './invoice-support';

const TAG = 'snice-invoice';
await import('../../../packages/components/src/invoice/snice-invoice');

afterEach(() => { document.body.innerHTML = ''; });

describe('invoice smoke', () => {
  it('discount lands before tax and every figure is Intl-formatted', async () => {
    const el = await mount<HTMLElement>(TAG, {
      'invoice-number': 'INV-001', 'tax-rate': 10, discount: 15, currency: 'USD',
    }, { from: FROM, to: TO, items: DERIVED_LINES });

    const problems = new Problems();
    checkMoney(el, { items: DERIVED_LINES, discount: 15, taxRate: 10, currency: 'USD' },
      problems);
    problems.equal(text(part(el, 'total')?.querySelector('[part="summary-value"]')),
      money(expectedTotal(DERIVED_LINES, 15, 10), 'USD'), 'total row value');
    expectClean(problems, 'money');
  });

  it('the summary shows only the rows its numbers earn', async () => {
    const plain = await mount<HTMLElement>(TAG, {}, { items: DERIVED_LINES });
    expect(part(plain, 'discount-row'), 'discount row without a discount').toBeNull();
    expect(part(plain, 'tax-row'), 'tax row without a tax rate').toBeNull();
    document.body.innerHTML = '';

    const full = await mount<HTMLElement>(TAG, { 'tax-rate': 10, discount: 5 },
      { items: DERIVED_LINES });
    expect(part(full, 'discount-row'), 'no discount row for discount=5').not.toBeNull();
    expect(part(full, 'tax-row'), 'no tax row for tax-rate=10').not.toBeNull();
  });

  it('emits invoice-status-change and invoice-item-change', async () => {
    const el = await mount<any>(TAG, { status: 'draft' });
    const status = captureEvents<any>(el, 'invoice-status-change');
    const items = captureEvents<any>(el, 'invoice-item-change');
    el.status = 'paid';
    el.items = DERIVED_LINES;
    await wait(30);
    expect(status.map(d => [d.oldStatus, d.newStatus])).toEqual([['draft', 'paid']]);
    expect(items.length, 'invoice-item-change count').toBe(1);
    expect(items[0].total).toBe(expectedTotal(DERIVED_LINES, 0, 0));
  });

  it('the detailed variant heads a line-number column, the others do not', async () => {
    const standard = await mount<HTMLElement>(TAG, { variant: 'standard' },
      { items: DERIVED_LINES });
    expect(readHeadings(standard), 'standard headings')
      .toEqual(['Description', 'Qty', 'Unit Price', 'Amount']);
    expect(readBodyRows(standard).length, 'one row per item').toBe(DERIVED_LINES.length);
    document.body.innerHTML = '';

    const detailed = await mount<HTMLElement>(TAG, { variant: 'detailed' },
      { items: DERIVED_LINES });
    expect(readHeadings(detailed), 'detailed headings')
      .toEqual(['#', 'Description', 'Qty', 'Unit Price', 'Amount']);
  });
});
