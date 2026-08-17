/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-estimate matrix — optional lines and the money they move
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The estimate's distinguishing feature is the optional line, so this slice
 * crosses the three states a line set can be in (all required, one optional
 * and excluded, one optional with `included` left undefined) against discount,
 * tax rate and currency, and checks the whole summary block plus `toJSON()`
 * against the documented pipeline:
 *
 *   included    = !optional || included !== false        (doc: items example)
 *   subtotal    = sum of INCLUDED quantity x unitPrice
 *   discount    = subtotal x discount%
 *   tax         = (subtotal - discount) x taxRate%
 *   total       = subtotal - discount + tax
 *
 * 3 line sets x 2 tax rates x 2 discounts x 2 currency symbols = 24 combos,
 * plus the toggle transitions that move a line between those states.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, removeComponent, click, wait } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  LINE_SETS, FROM, TO, checkMoney, checkJson, expectedSubtotal, expectedTotal,
  money, includedItems, type MoneyCombo,
} from './estimate-support';

const TAG = 'snice-estimate';
await import('../../../packages/components/src/estimate/snice-estimate');

afterEach(() => { document.body.innerHTML = ''; });

const combos = cross({
  lines: ['required', 'excluded', 'defaulted'] as const,
  taxRate: [0, 10] as const,
  discount: [0, 20] as const,
  currency: ['$', '€'] as const,
});

describe('estimate matrix: optional lines and the documented totals', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      const items = LINE_SETS[combo.lines];
      const el = await mount<HTMLElement>(TAG, { currency: combo.currency }, {
        estimateNumber: 'EST-001',
        taxRate: combo.taxRate,
        discount: combo.discount,
        from: FROM, to: TO, items,
      });

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

describe('estimate matrix: an excluded line is listed but not priced', () => {
  it('the excluded line still has a row', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { items: LINE_SETS.excluded });
    expect(parts(el, 'table-row').length, 'rows for two items').toBe(2);
  });

  it('the excluded line is out of the subtotal', async () => {
    const items = LINE_SETS.excluded;
    expect(expectedSubtotal(items), 'oracle subtotal excludes the optional line')
      .toBe(5000);
    const el = await mount<HTMLElement>(TAG, { currency: '$' }, { items });
    const problems = new Problems();
    checkMoney(el, { items, discount: 0, taxRate: 0, currency: '$' }, problems);
    expectClean(problems, 'excluded');
  });

  it('an optional line with `included` undefined counts', async () => {
    const items = LINE_SETS.defaulted;
    expect(includedItems(items).length, 'both lines are in').toBe(2);
    expect(expectedTotal(items, 0, 0)).toBe(5000 + 3 * 400);
  });
});

describe('estimate matrix: item-toggle moves the money', () => {
  const toggles = cross({
    taxRate: [0, 10] as const,
    discount: [0, 20] as const,
    startIncluded: [true, false],
  });

  for (const combo of toggles) {
    it(combo.id, async () => {
      const items = [
        { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
        {
          description: 'SEO Audit', quantity: 1, unitPrice: 1500,
          optional: true, included: combo.startIncluded,
        },
      ];
      const el = await mount<any>(TAG, { currency: '$' }, {
        taxRate: combo.taxRate, discount: combo.discount, items,
      });

      const toggle = part(el, 'item-toggle');
      const problems = new Problems();
      problems.check(!!toggle, 'the optional line renders no part="item-toggle"');
      click(toggle);
      await wait(30);

      const after = [items[0], { ...items[1], included: !combo.startIncluded }];
      checkMoney(el, { items: after, discount: combo.discount, taxRate: combo.taxRate, currency: '$' },
        problems);
      problems.equal(
        el.toJSON().total, expectedTotal(after, combo.discount, combo.taxRate),
        'toJSON.total after the toggle');
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }

  it('a required line offers no toggle at all', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { items: LINE_SETS.required });
    expect(parts(el, 'item-toggle').length, 'toggles on required lines').toBe(0);
  });
});

describe('estimate matrix: the currency symbol is used verbatim', () => {
  for (const symbol of ['$', '€', '£', 'CHF ']) {
    it(`currency=${symbol.trim()}`, async () => {
      const el = await mount<HTMLElement>(TAG, { currency: symbol },
        { items: LINE_SETS.required });
      const problems = new Problems();
      checkMoney(el, { items: LINE_SETS.required, discount: 0, taxRate: 0, currency: symbol },
        problems);
      problems.check(money(1234.5, symbol).startsWith(symbol),
        `oracle formatted ${money(1234.5, symbol)} for symbol ${symbol}`);
      expectClean(problems, symbol);
      removeComponent(el);
    });
  }
});
