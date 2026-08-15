/**
 * Matrix slice CART / BEHAVIOUR — every documented method and event, driven
 * both through the API and through the controls a shopper actually clicks.
 *
 * Dimensions: the five documented methods against the four documented
 * mutation events, plus `checkout` crossed with the money axes (4). 24 cases.
 *
 * Contract asserted (docs/ai/components/cart.md):
 *   · `addItem(item)` — "Add item (increments qty if exists)"; a NEW item
 *     reports `item-add`, an existing one reports `quantity-change`.
 *   · `removeItem(id)` — "Remove by ID", reporting `item-remove` with the item.
 *   · `updateQuantity(id, qty)` — "Set qty (removes if 0)", reporting
 *     `quantity-change` with `{ item, previousQuantity, newQuantity }`, and
 *     `item-remove` when the quantity reaches zero.
 *   · `applyCoupon(code)` — sets `couponCode` and reports `coupon-apply`.
 *   · `clear()` — "Remove all items".
 *   · `checkout` → `{ items, subtotal, discount, tax, total }`, and those
 *     numbers are the ones the summary shows.
 *   · The rendered controls do the same thing: the remove button removes, the
 *     quantity stepper restates the quantity, the coupon field applies.
 *
 * This file imports the child components the cart renders (`snice-button`,
 * `snice-step-input`, `snice-input`) so a real click can reach them. The
 * documented single-import usage is a slice of its own —
 * `cart-dependencies.test.ts` — because the two claims are different.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import '../../../packages/components/src/button/snice-button';
import '../../../packages/components/src/input/snice-input';
import '../../../packages/components/src/step-input/snice-step-input';
import {
  cleanup, cross, part, parts, one, all, text, click, record, settle,
  Problems, expectClean,
} from './matrix-utils';
import {
  CURRENCIES, TAX_RATES, DISCOUNTS, basket, mountCart, subtotalOf, sameMoney,
  type CartElement,
} from './cart-support';

/** Click the inner control of a rendered child component, the way a pointer does. */
function pressChild(host: Element | null | undefined, selector = 'button'): boolean {
  const inner = host?.shadowRoot?.querySelector(selector);
  if (!inner) return false;
  click(inner);
  return true;
}

/** The remove control of the line named `name`. */
function removeButton(el: HTMLElement, name: string): Element | null {
  return parts(el, 'item')
    .map(line => line.querySelector(`[aria-label="Remove ${name}"]`))
    .find(node => node !== null) ?? null;
}

describe('cart matrix: behaviour', () => {
  afterEach(() => cleanup());

  // ── addItem ───────────────────────────────────────────────────────────────

  it('addItem adds a new line and reports item-add', async () => {
    const items = basket();
    const el = await mountCart({ items });
    const p = new Problems();
    const fresh = { id: '9', name: 'Cap', price: 19.5, quantity: 2 };

    const seen = record(el, ['item-add', 'quantity-change']);
    el.addItem(fresh);
    await settle();
    seen.stop();

    p.eq('event sequence', seen.events.map(e => e.type), ['item-add']);
    p.eq('item-add detail', seen.events[0]?.detail, { item: fresh });
    p.eq('items', el.items.length, items.length + 1);
    p.eq('rendered lines', parts(el, 'item').length, items.length + 1);

    expectClean(p, 'addItem-new');
  });

  for (const added of [1, 3]) {
    it(`addItem(qty=${added}) on an existing id increments the quantity`, async () => {
      const items = basket();
      const el = await mountCart({ items });
      const p = new Problems();
      const existing = items[0];

      const seen = record(el, ['item-add', 'quantity-change']);
      el.addItem({ ...existing, quantity: added });
      await settle();
      seen.stop();

      // "increments qty if exists" — one line, a bigger quantity, and the
      // quantity-change event rather than an add.
      p.eq('event sequence', seen.events.map(e => e.type), ['quantity-change']);
      p.eq('quantity-change detail', seen.events[0]?.detail, {
        item: { ...existing, quantity: existing.quantity + added },
        previousQuantity: existing.quantity,
        newQuantity: existing.quantity + added,
      });
      p.eq('line count', el.items.length, items.length);
      p.eq('quantity', el.items[0].quantity, existing.quantity + added);

      expectClean(p, `addItem-existing-${added}`);
    });
  }

  // ── removeItem / updateQuantity ───────────────────────────────────────────

  for (const index of [0, 1, 2]) {
    it(`removeItem removes line ${index} and reports it`, async () => {
      const items = basket();
      const el = await mountCart({ items });
      const p = new Problems();
      const target = items[index];

      const seen = record(el, ['item-remove']);
      el.removeItem(target.id);
      await settle();
      seen.stop();

      p.eq('events', seen.events.map(e => e.type), ['item-remove']);
      p.eq('item-remove detail', seen.events[0]?.detail, { item: target });
      p.eq('remaining names', all(el, '.cart__item-name').map(text),
        items.filter(item => item.id !== target.id).map(item => item.name));

      expectClean(p, `removeItem-${index}`);
    });
  }

  it('removeItem with an unknown id changes nothing and reports nothing', async () => {
    const items = basket();
    const el = await mountCart({ items });
    const p = new Problems();

    const seen = record(el, ['item-remove']);
    el.removeItem('nope');
    await settle();
    seen.stop();

    p.eq('events', seen.events.length, 0);
    p.eq('lines', parts(el, 'item').length, items.length);

    expectClean(p, 'removeItem-unknown');
  });

  for (const qty of [1, 5]) {
    it(`updateQuantity(${qty}) restates the line and reports the change`, async () => {
      const items = basket();
      const el = await mountCart({ items });
      const p = new Problems();
      const target = items[1];

      const seen = record(el, ['quantity-change', 'item-remove']);
      el.updateQuantity(target.id, qty);
      await settle();
      seen.stop();

      p.eq('events', seen.events.map(e => e.type), ['quantity-change']);
      p.eq('detail', seen.events[0]?.detail, {
        item: { ...target, quantity: qty },
        previousQuantity: target.quantity,
        newQuantity: qty,
      });
      p.eq('quantity', el.items[1].quantity, qty);

      expectClean(p, `updateQuantity-${qty}`);
    });
  }

  for (const qty of [0, -2]) {
    it(`updateQuantity(${qty}) removes the line, as documented`, async () => {
      const items = basket();
      const el = await mountCart({ items });
      const p = new Problems();
      const target = items[1];

      const seen = record(el, ['quantity-change', 'item-remove']);
      el.updateQuantity(target.id, qty);
      await settle();
      seen.stop();

      p.eq('events', seen.events.map(e => e.type), ['item-remove']);
      p.eq('item-remove detail', seen.events[0]?.detail, { item: target });
      p.eq('remaining names', all(el, '.cart__item-name').map(text),
        items.filter(item => item.id !== target.id).map(item => item.name));

      expectClean(p, `updateQuantity-${qty}`);
    });
  }

  // ── applyCoupon ───────────────────────────────────────────────────────────

  it('applyCoupon sets the code and reports it', async () => {
    const el = await mountCart({ items: basket(), discount: 10 });
    const p = new Problems();

    const seen = record(el, ['coupon-apply']);
    el.applyCoupon('SAVE10');
    await settle();
    seen.stop();

    p.eq('events', seen.events.map(e => e.type), ['coupon-apply']);
    p.eq('detail', seen.events[0]?.detail, { code: 'SAVE10' });
    p.eq('couponCode', el.couponCode, 'SAVE10');
    // …and the summary names the coupon it just accepted.
    p.ok(text(part(el, 'summary')).includes('SAVE10'),
      `summary "${text(part(el, 'summary'))}" does not name the applied coupon`);

    expectClean(p, 'applyCoupon');
  });

  // ── checkout ──────────────────────────────────────────────────────────────

  for (const combo of cross({ taxRate: TAX_RATES, discount: DISCOUNTS })) {
    it(`${combo.id}: checkout reports the money the summary shows`, async () => {
      const items = basket();
      const el = await mountCart({
        items, taxRate: combo.taxRate, discount: combo.discount, currency: CURRENCIES[0],
      });
      const p = new Problems();

      const seen = record(el, ['checkout']);
      const pressed = pressChild(one(el, '[part~="checkout"] snice-button'));
      p.ok(pressed, 'the checkout button has no inner control to press');
      await settle();
      seen.stop();

      p.eq('events', seen.events.map(e => e.type), ['checkout']);
      const detail = seen.events[0]?.detail ?? {};
      p.eq('items', detail.items, items);
      p.ok(sameMoney(detail.subtotal, subtotalOf(items)),
        `checkout subtotal ${detail.subtotal} != ${subtotalOf(items)}`);
      p.eq('discount', detail.discount, combo.discount);
      p.ok(sameMoney(detail.total, detail.subtotal - detail.discount + detail.tax),
        `checkout total ${detail.total} != subtotal ${detail.subtotal}`
        + ` - discount ${detail.discount} + tax ${detail.tax}`);

      // The event is not allowed to disagree with the rendered summary.
      const totalRow = all(el, '.cart__summary-row')
        .find(row => text(row.querySelector('.cart__summary-label')) === 'Total');
      const shown = Number(text(totalRow?.querySelector('.cart__summary-value'))
        .replace(/[^0-9.-]/g, ''));
      p.ok(sameMoney(shown, detail.total),
        `the summary shows ${shown} but checkout reported ${detail.total}`);

      expectClean(p, combo.id);
    });
  }

  // ── The controls a shopper actually uses ──────────────────────────────────

  it('the remove button removes its own line', async () => {
    const items = basket();
    const el = await mountCart({ items });
    const p = new Problems();

    const seen = record(el, ['item-remove']);
    p.ok(pressChild(removeButton(el, 'Watch')), 'the remove button has no inner control');
    await settle();
    seen.stop();

    p.eq('events', seen.events.map(e => e.type), ['item-remove']);
    p.eq('item-remove detail', seen.events[0]?.detail, { item: items[1] });
    p.eq('remaining names', all(el, '.cart__item-name').map(text), ['Shoes', 'Earbuds']);

    expectClean(p, 'remove-button');
  });

  it('the quantity stepper restates the line it belongs to', async () => {
    const items = basket();
    const el = await mountCart({ items });
    const p = new Problems();

    const stepper = parts(el, 'item')[0].querySelector('.cart__qty');
    const seen = record(el, ['quantity-change']);
    p.ok(pressChild(stepper, '.step-input__button--increment'),
      'the quantity stepper has no increment control');
    await settle();
    seen.stop();

    p.eq('events', seen.events.map(e => e.type), ['quantity-change']);
    p.eq('newQuantity', seen.events[0]?.detail?.newQuantity, items[0].quantity + 1);
    p.eq('quantity', el.items[0].quantity, items[0].quantity + 1);

    expectClean(p, 'quantity-stepper');
  });

  it('the coupon field applies the code that was typed into it', async () => {
    const el = await mountCart({ items: basket(), discount: 10 }) as CartElement;
    const p = new Problems();

    const field = one(el, '.cart__coupon-input');
    const inner = field?.shadowRoot?.querySelector('input') as HTMLInputElement | null;
    p.ok(inner !== null, 'the coupon field has no inner input');
    if (inner) {
      inner.value = 'SAVE10';
      inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      await settle();
    }

    const seen = record(el, ['coupon-apply']);
    p.ok(pressChild(one(el, '[part~="coupon"] snice-button')),
      'the apply button has no inner control');
    await settle();
    seen.stop();

    p.eq('events', seen.events.map(e => e.type), ['coupon-apply']);
    p.eq('detail', seen.events[0]?.detail, { code: 'SAVE10' });
    p.eq('couponCode', el.couponCode, 'SAVE10');

    expectClean(p, 'coupon-field');
  });
});
