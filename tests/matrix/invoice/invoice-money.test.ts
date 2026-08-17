/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-invoice matrix — the money pipeline
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The invoice's whole reason to exist is arithmetic a human will be billed
 * for, so this slice crosses the four axes that feed it — which lines are on
 * the invoice, the discount, the tax rate, and the currency — and checks the
 * rendered summary, every line's own cells, and `toJSON()` against the
 * documented pipeline in one pass:
 *
 *   line amount = `amount` if present, else `quantity * unitPrice`   (doc: Notes)
 *   discount    = subtotal x discount%                               (doc: Notes)
 *   tax         = (subtotal - discount) x taxRate%   "applied before tax"
 *   total       = subtotal - discount + tax
 *   every figure formatted with `Intl.NumberFormat`  (doc: Notes)
 *
 * 3 line sets x 3 tax rates x 2 discounts x 2 currencies = 36 combos. The
 * currencies are deliberately USD and JPY: JPY has zero minor units, so a
 * component that hard-codes two decimals anywhere cannot survive the cross.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { mount, cross, Problems, expectClean, removeComponent } from '../matrix-kit';
import {
  LINE_SETS, FROM, TO, checkMoney, checkJson, money,
  expectedSubtotal, expectedTotal, type MoneyCombo,
} from './invoice-support';

const TAG = 'snice-invoice';
await import('../../../packages/components/src/invoice/snice-invoice');

const combos = cross({
  lines: ['derived', 'overridden', 'taxed'] as const,
  taxRate: [0, 10, 8.25] as const,
  discount: [0, 15] as const,
  currency: ['USD', 'JPY'] as const,
});

afterEach(() => { document.body.innerHTML = ''; });

describe('invoice matrix: the documented money pipeline', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      const items = LINE_SETS[combo.lines];
      const el = await mount<HTMLElement>(TAG, {
        'invoice-number': 'INV-001',
        'tax-rate': combo.taxRate,
        discount: combo.discount,
        currency: combo.currency,
      }, { from: FROM, to: TO, items });

      const money_: MoneyCombo = {
        items, discount: combo.discount, taxRate: combo.taxRate, currency: combo.currency,
      };
      const problems = new Problems();
      checkMoney(el, money_, problems);
      checkJson(el as any, money_, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('invoice matrix: an empty invoice still totals', () => {
  it('renders a zero subtotal and a zero total with no lines', async () => {
    const el = await mount<HTMLElement>(TAG, { currency: 'USD', 'tax-rate': 10 });
    const problems = new Problems();
    checkMoney(el, { items: [], discount: 0, taxRate: 10, currency: 'USD' }, problems);
    problems.equal(expectedSubtotal([]), 0, 'oracle subtotal for no lines');
    problems.equal(expectedTotal([], 0, 10), 0, 'oracle total for no lines');
    expectClean(problems, 'empty');
  });

  it('formats a zero-minor-unit currency without inventing decimals', async () => {
    const el = await mount<HTMLElement>(TAG, { currency: 'JPY' }, {
      items: [{ description: 'Consulting', quantity: 1, unitPrice: 1000 }],
    });
    const problems = new Problems();
    checkMoney(el, {
      items: [{ description: 'Consulting', quantity: 1, unitPrice: 1000 }],
      discount: 0, taxRate: 0, currency: 'JPY',
    }, problems);
    problems.check(!money(1000, 'JPY').includes('.00'),
      `Intl formatted JPY 1000 as ${money(1000, 'JPY')}`);
    expectClean(problems, 'jpy');
  });
});
