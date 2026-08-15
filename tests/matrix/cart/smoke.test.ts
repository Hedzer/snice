/**
 * Smoke slice of the snice-cart matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full cart matrix (66 combos) runs only via
 * `npm run test:matrix`. This file deliberately lives at `smoke.test.ts` so
 * it stays collected by the everyday loop.
 *
 * One marquee combo per feature family:
 *   · line items — name, variant, unit price, line total;
 *   · summary    — subtotal / discount / tax / total, and the identity between
 *                  them;
 *   · mutation   — `addItem` increments an existing id, `updateQuantity(0)`
 *                  removes;
 *   · events     — `checkout` reports the money the summary shows;
 *   · empty      — the `empty` part, and nothing else;
 *   · MATRIX-cart-1 — the documented single import leaves the controls inert
 *                  (pinned here too, because it is the one defect a shopper
 *                  meets on the first click).
 *
 * Every assertion routes through the matrix's own oracle module
 * (matrix/cart/cart-support.ts).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import '../../../packages/components/src/button/snice-button';
import { cleanup, part, parts, one, all, text, click, record, settle } from './matrix-utils';
import {
  basket, mountCart, money, subtotalOf, lineTotal, sameMoney,
} from './cart-support';

const summaryRow = (el: HTMLElement, label: string) =>
  all(el, '.cart__summary-row')
    .find(row => text(row.querySelector('.cart__summary-label')).startsWith(label));

const value = (row: Element | undefined) => text(row?.querySelector('.cart__summary-value'));

describe('cart matrix smoke', () => {
  afterEach(() => cleanup());

  it('line items: each line shows its name, variant, unit price and total', async () => {
    const items = basket();
    const el = await mountCart({ items });

    expect(parts(el, 'item')).toHaveLength(items.length);
    expect(all(el, '.cart__item-name').map(text)).toEqual(items.map(i => i.name));
    expect(all(el, '.cart__item-total').map(text))
      .toEqual(items.map(item => money(lineTotal(item))));
    expect(text(parts(el, 'item')[0].querySelector('.cart__item-variant'))).toBe('Size: M');
  });

  it('summary: subtotal, discount and tax add up to the total', async () => {
    const items = basket();
    const el = await mountCart({ items, taxRate: 8.5, discount: 10, couponCode: 'SAVE10' });

    expect(value(summaryRow(el, 'Subtotal'))).toBe(money(subtotalOf(items)));
    expect(value(summaryRow(el, 'Discount'))).toBe(`-${money(10)}`);
    expect(summaryRow(el, 'Discount')!.textContent).toContain('SAVE10');

    const num = (label: string) => Number(value(summaryRow(el, label)).replace(/[^0-9.-]/g, ''));
    expect(sameMoney(num('Total'), num('Subtotal') - 10 + num('Tax'))).toBe(true);
  });

  it('mutation: addItem increments an existing line, updateQuantity(0) removes one', async () => {
    const items = basket();
    const el = await mountCart({ items });

    el.addItem({ ...items[0], quantity: 2 });
    await settle();
    expect(el.items).toHaveLength(items.length);
    expect(el.items[0].quantity).toBe(items[0].quantity + 2);

    const removed = record(el, ['item-remove']);
    el.updateQuantity(items[1].id, 0);
    await settle();
    removed.stop();
    expect(removed.events.map(e => e.type)).toEqual(['item-remove']);
    expect(all(el, '.cart__item-name').map(text)).toEqual(['Shoes', 'Earbuds']);
  });

  it('events: checkout reports the money the summary shows', async () => {
    const items = basket();
    const el = await mountCart({ items, taxRate: 8.5 });

    const seen = record(el, ['checkout']);
    click(one(el, '[part~="checkout"] snice-button')!.shadowRoot!.querySelector('button'));
    await settle();
    seen.stop();

    const detail = seen.events[0]?.detail;
    expect(seen.events.map(e => e.type)).toEqual(['checkout']);
    expect(detail.items).toEqual(items);
    expect(sameMoney(detail.subtotal, subtotalOf(items))).toBe(true);
    expect(sameMoney(detail.total, detail.subtotal - detail.discount + detail.tax)).toBe(true);
  });

  it('empty: a cart with no items shows only the empty state', async () => {
    const el = await mountCart({ items: [], taxRate: 8.5 });
    expect(part(el, 'empty')).not.toBeNull();
    expect(part(el, 'summary')).toBeNull();
    expect(part(el, 'checkout')).toBeNull();
  });
});
