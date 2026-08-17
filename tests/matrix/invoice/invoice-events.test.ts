/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-invoice matrix — the two documented events
 * ════════════════════════════════════════════════════════════════════════════
 *
 * docs/ai/components/invoice.md:
 *
 *   `invoice-item-change`   -> { items, subtotal, tax, total }
 *   `invoice-status-change` -> { oldStatus, newStatus }
 *
 * The status event crosses the full 5x5 transition table (every documented
 * status to every other), because "oldStatus" is the half of that payload a
 * consumer cannot recompute for itself. The item event crosses the line sets
 * against tax and discount, because its payload carries the same computed
 * totals the summary renders — and a payload that disagrees with the document
 * the user is looking at is worse than no payload.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { mount, cross, Problems, expectClean, captureEvents, removeComponent, wait } from '../matrix-kit';
import { STATUSES } from './invoice-support';
import {
  LINE_SETS, expectedSubtotal, expectedTaxAmount, expectedTotal,
} from './invoice-support';

const TAG = 'snice-invoice';
await import('../../../packages/components/src/invoice/snice-invoice');

afterEach(() => { document.body.innerHTML = ''; });

describe('invoice matrix: invoice-status-change', () => {
  const combos = cross({ from: STATUSES, to: STATUSES });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<any>(TAG, { status: combo.from });
      const seen = captureEvents<{ oldStatus: string; newStatus: string }>(
        el, 'invoice-status-change');
      el.status = combo.to;
      await wait(30);

      const problems = new Problems();
      if (combo.from === combo.to) {
        // A no-op assignment is not a status change.
        problems.equal(seen.length, 0, 'events for an unchanged status');
      } else {
        problems.equal(seen.length, 1, 'event count');
        problems.equal(seen[0]?.oldStatus, combo.from, 'detail.oldStatus');
        problems.equal(seen[0]?.newStatus, combo.to, 'detail.newStatus');
      }
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('invoice matrix: invoice-item-change carries the computed totals', () => {
  const combos = cross({
    lines: ['derived', 'overridden', 'taxed'] as const,
    taxRate: [0, 10] as const,
    discount: [0, 15] as const,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const el = await mount<any>(TAG, {
        'tax-rate': combo.taxRate, discount: combo.discount,
      });
      const seen = captureEvents<any>(el, 'invoice-item-change');
      const items = LINE_SETS[combo.lines];
      el.items = items;
      await wait(30);

      const problems = new Problems();
      problems.equal(seen.length, 1, 'event count');
      const detail = seen[0] ?? {};
      problems.equal(detail.items?.length, items.length, 'detail.items length');
      problems.equal(detail.subtotal, expectedSubtotal(items), 'detail.subtotal');
      problems.equal(detail.tax, expectedTaxAmount(items, combo.discount, combo.taxRate),
        'detail.tax');
      problems.equal(detail.total, expectedTotal(items, combo.discount, combo.taxRate),
        'detail.total');
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});
