/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-estimate matrix — smoke slice
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The one file of this directory the DEFAULT vitest loop collects. One combo
 * per feature family, plus the marquee regression:
 *
 *   · an optional line that is excluded is listed but not priced;
 *   · toggling it moves the subtotal, the tax, the total and `toJSON()`;
 *   · the comparison variant renders option cards instead of a table;
 *   · accept / decline / item-toggle all reach the page;
 *   · MATRIX-estimate-1 — `tax-rate="10"` sets `taxRate` to the string "10".
 *
 * The full cross lives in the sibling files and runs via
 * `npx vitest run --config vitest.matrix.config.ts tests/matrix/estimate`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, Problems, expectClean, captureEvents, click, wait } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  REQUIRED_LINES, EXCLUDED_LINES, checkMoney, expectedTotal, expectedSubtotal,
} from './estimate-support';

const TAG = 'snice-estimate';
await import('../../../packages/components/src/estimate/snice-estimate');

afterEach(() => { document.body.innerHTML = ''; });

describe('estimate smoke', () => {
  it('an excluded optional line is listed but not priced', async () => {
    const el = await mount<HTMLElement>(TAG, { currency: '$' }, {
      taxRate: 10, discount: 0, items: EXCLUDED_LINES,
    });
    const problems = new Problems();
    checkMoney(el, { items: EXCLUDED_LINES, discount: 0, taxRate: 10, currency: '$' }, problems);
    problems.equal(parts(el, 'table-row').length, 2, 'both lines are listed');
    problems.equal(expectedSubtotal(EXCLUDED_LINES), 5000, 'subtotal excludes the optional line');
    expectClean(problems, 'excluded');
  });

  it('toggling the optional line moves every number', async () => {
    const el = await mount<any>(TAG, { currency: '$' }, {
      taxRate: 10, items: EXCLUDED_LINES,
    });
    const seen = captureEvents<any>(el, 'item-toggle');
    click(part(el, 'item-toggle'));
    await wait(30);

    const included = [EXCLUDED_LINES[0], { ...EXCLUDED_LINES[1], included: true }];
    expect(seen.map(d => d.included), 'item-toggle detail').toEqual([true]);
    expect(el.toJSON().total, 'total after including the optional line')
      .toBe(expectedTotal(included, 0, 10));
  });

  it('the comparison variant renders options instead of a table', async () => {
    const el = await mount<HTMLElement>(TAG, { variant: 'comparison' }, {
      items: REQUIRED_LINES,
    });
    expect(parts(el, 'option').length, 'option cards').toBe(REQUIRED_LINES.length);
    expect(part(el, 'table'), 'the comparison variant still rendered a table').toBeNull();
  });

  it('accept and decline reach the page', async () => {
    const el = await mount<any>(TAG, { status: 'sent' }, {
      estimateNumber: 'EST-001', items: REQUIRED_LINES,
    });
    const accepted = captureEvents<any>(el, 'estimate-accept');
    const declined = captureEvents<any>(el, 'estimate-decline');
    click(part(el, 'accept-button'));
    click(part(el, 'decline-button'));
    await wait(30);
    expect(accepted.length, 'estimate-accept').toBe(1);
    expect(accepted[0].total).toBe(expectedTotal(REQUIRED_LINES, 0, 0));
    expect(declined.map(d => d.estimateNumber)).toEqual(['EST-001']);
  });

  it.fails('tax-rate arrives as the documented number [MATRIX-estimate-1]', async () => {
    const el = await mount<any>(TAG, { 'tax-rate': '10' });
    expect(el.taxRate, 'taxRate from the documented attribute').toBe(10);
  });
});
