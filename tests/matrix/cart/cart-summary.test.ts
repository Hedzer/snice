/**
 * Matrix slice CART / SUMMARY — the money the cart shows, crossed with every
 * documented money axis.
 *
 * Dimensions: basket (2: one line / three lines) x taxRate (2: 0 / 8.5)
 * x discount (2: 0 / 10) x currency (2: $ / €) = 16 combos, plus the coupon
 * label (2), the header count (3) and the empty state (2). 23 cases.
 *
 * Contract asserted (docs/ai/components/cart.md, docs/components/cart.md):
 *   · Parts `base`, `header`, `items`, `coupon`, `summary`, `checkout`, `empty`.
 *   · The subtotal is the sum of price x quantity, shown in `currency`.
 *   · "Set `discount` and `coupon-code` to show a discount row" — the row
 *     exists exactly when there is a discount, and names the coupon.
 *   · A tax row exists exactly when `taxRate` is set, and names the percentage.
 *   · `total = subtotal - discount + tax` — the identity the `checkout` detail's
 *     four fields describe. (The tax BASE is undocumented, so the exact tax
 *     figure is only asserted where the readings coincide: see cart-support.)
 *   · An empty cart shows the `empty` part and no summary, coupon or checkout.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, part, all, text, Problems, expectClean } from './matrix-utils';
import {
  CURRENCIES, TAX_RATES, DISCOUNTS, basket, mountCart, money,
  subtotalOf, taxOf, itemCount, sameMoney, type CartElement,
} from './cart-support';

/** The summary rows a reader sees, as label/value pairs. */
function summary(el: HTMLElement): Array<{ label: string; value: string }> {
  return all(el, '.cart__summary-row').map(row => ({
    label: text(row.querySelector('.cart__summary-label')),
    value: text(row.querySelector('.cart__summary-value')),
  }));
}

/** Read a money figure back out of a rendered row. */
function amount(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, ''));
}

describe('cart matrix: summary', () => {
  afterEach(() => cleanup());

  for (const combo of cross({
    lines: [1, 3] as const,
    taxRate: TAX_RATES,
    discount: DISCOUNTS,
    currency: CURRENCIES,
  })) {
    it(`${combo.id}: the summary adds up`, async () => {
      const items = basket().slice(0, combo.lines);
      const el = await mountCart({
        items, taxRate: combo.taxRate, discount: combo.discount,
        currency: combo.currency, couponCode: combo.discount ? 'SAVE10' : undefined,
      });
      const p = new Problems();

      // The documented parts of a non-empty cart.
      for (const name of ['base', 'header', 'items', 'coupon', 'summary', 'checkout']) {
        p.ok(part(el, name) !== null, `no part="${name}"`);
      }
      p.ok(part(el, 'empty') === null, 'a cart with items rendered the empty part');

      const rows = summary(el);
      const subtotal = subtotalOf(items);

      // Subtotal — always shown, in the requested currency.
      const subtotalRow = rows.find(row => row.label === 'Subtotal');
      p.ok(subtotalRow !== undefined, `no subtotal row among [${rows.map(r => r.label)}]`);
      p.eq('subtotal', subtotalRow?.value, money(subtotal, combo.currency));

      // Discount — exactly when there is one, naming the coupon.
      const discountRow = rows.find(row => row.label.startsWith('Discount'));
      if (combo.discount > 0) {
        p.ok(discountRow !== undefined, 'a discount rendered no discount row');
        p.eq('discount', discountRow?.value, `-${money(combo.discount, combo.currency)}`);
        p.ok((discountRow?.label ?? '').includes('SAVE10'),
          `discount row "${discountRow?.label}" does not name the coupon`);
      } else {
        p.ok(discountRow === undefined,
          `a cart with no discount rendered "${discountRow?.label}"`);
      }

      // Tax — exactly when a rate is set, naming the percentage.
      const taxRow = rows.find(row => row.label.startsWith('Tax'));
      if (combo.taxRate > 0) {
        p.ok(taxRow !== undefined, 'a tax rate rendered no tax row');
        p.ok((taxRow?.label ?? '').includes(String(combo.taxRate)),
          `tax row "${taxRow?.label}" does not name the rate ${combo.taxRate}`);
        const exact = taxOf(items, combo.taxRate, combo.discount);
        if (exact !== null) p.eq('tax', taxRow?.value, money(exact, combo.currency));
      } else {
        p.ok(taxRow === undefined, `a cart with no tax rate rendered "${taxRow?.label}"`);
      }

      // Total — the documented identity, read back off the rendered rows.
      const totalRow = rows.find(row => row.label === 'Total');
      p.ok(totalRow !== undefined, 'no total row');
      const tax = taxRow ? amount(taxRow.value) : 0;
      const expectedTotal = subtotal - combo.discount + tax;
      p.ok(sameMoney(amount(totalRow?.value ?? '0'), expectedTotal),
        `total ${totalRow?.value} != subtotal ${subtotal} - discount ${combo.discount}`
        + ` + tax ${tax} = ${expectedTotal}`);
      p.eq('total formatting', totalRow?.value, money(expectedTotal, combo.currency));

      expectClean(p, combo.id);
    });
  }

  // ── The header count ──────────────────────────────────────────────────────

  for (const lines of [1, 2, 3] as const) {
    it(`lines=${lines}: the header counts every unit in the cart`, async () => {
      const items = basket().slice(0, lines);
      const el = await mountCart({ items });
      const p = new Problems();

      const count = itemCount(items);
      const header = text(part(el, 'header'));
      p.ok(header.includes(String(count)),
        `header "${header}" does not carry the ${count}-unit count`);
      // "1 item" against "N items": the singular is a documented nicety of the
      // count, and a cart that says "1 items" is a defect a reader sees.
      p.ok(header.includes(count === 1 ? '1 item' : `${count} items`),
        `header "${header}" mis-pluralises a count of ${count}`);

      expectClean(p, `lines=${lines}`);
    });
  }

  // ── The empty cart ────────────────────────────────────────────────────────

  for (const taxRate of TAX_RATES) {
    it(`tax-rate=${taxRate}: an empty cart shows only the empty state`, async () => {
      const el = await mountCart({ items: [], taxRate });
      const p = new Problems();

      p.ok(part(el, 'empty') !== null, 'no part="empty"');
      for (const name of ['items', 'coupon', 'summary', 'checkout']) {
        p.ok(part(el, name) === null, `an empty cart rendered part="${name}"`);
      }
      p.ok(part(el, 'header') !== null, 'no part="header"');
      p.ok(text(part(el, 'header')).includes('0 items'),
        `empty header reads "${text(part(el, 'header'))}"`);

      expectClean(p, `tax-rate=${taxRate}`);
    });
  }

  it('clear() empties a full cart back to the empty state', async () => {
    const el = await mountCart({ items: basket(), taxRate: 8.5 }) as CartElement;
    const p = new Problems();

    el.clear();
    await new Promise(resolve => setTimeout(resolve, 30));

    p.eq('items', el.items, []);
    p.ok(part(el, 'empty') !== null, 'clear() left no empty state');
    p.ok(part(el, 'summary') === null, 'clear() left the summary behind');

    expectClean(p, 'clear');
  });
});
