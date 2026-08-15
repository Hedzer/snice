/**
 * Matrix slice CART / LINE ITEMS — one line's documented fields, crossed with
 * the optional item extras and the currency.
 *
 * Dimensions: item shape (4: plain / image / variant / both) x quantity (2: 1
 * and 3) x currency (2) = 16 combos, plus the whole-basket ordering (2). 18
 * cases.
 *
 * Contract asserted (docs/ai/components/cart.md + snice-cart.types.ts):
 *   · `CartItem` — `name`, `price`, `quantity`, optional `image`, optional
 *     `variant`; every line renders its name, its unit price in `currency` and
 *     its own line total (price x quantity).
 *   · An `image` renders that image; a line without one still renders a
 *     placeholder, never a broken image.
 *   · A `variant` renders exactly when it is declared.
 *   · "Remove buttons include item name" (accessibility).
 *   · The quantity control shows the line's quantity.
 *   · Part `item`, one per line, in the order the items were given.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, parts, all, text, Problems, expectClean } from './matrix-utils';
import {
  CURRENCIES, ITEM_SHAPES, itemFor, basket, mountCart, money, lineTotal, IMAGE,
} from './cart-support';

describe('cart matrix: line items', () => {
  afterEach(() => cleanup());

  for (const combo of cross({
    shape: ITEM_SHAPES, quantity: [1, 3] as const, currency: CURRENCIES,
  })) {
    it(`${combo.id}: the line renders its documented fields`, async () => {
      const item = itemFor(combo.shape, combo.quantity);
      const el = await mountCart({ items: [item], currency: combo.currency });
      const p = new Problems();

      const lines = parts(el, 'item');
      p.eq('line count', lines.length, 1);
      const line = lines[0];
      if (!line) { expectClean(p, combo.id); return; }

      p.eq('name', text(line.querySelector('.cart__item-name')), item.name);
      p.eq('unit price', text(line.querySelector('.cart__item-price')),
        `${money(item.price, combo.currency)} each`);
      p.eq('line total', text(line.querySelector('.cart__item-total')),
        money(lineTotal(item), combo.currency));

      // The image: the declared one, or a placeholder — never a broken <img>.
      const img = line.querySelector('img');
      if (item.image) {
        p.ok(img !== null, 'an item with an image rendered none');
        p.eq('image src', img?.getAttribute('src'), IMAGE);
        p.eq('image alt', img?.getAttribute('alt'), item.name);
      } else {
        p.ok(img === null, `an item without an image rendered <img src="${img?.getAttribute('src')}">`);
        p.ok(line.querySelector('.cart__item-image-placeholder') !== null,
          'an item without an image rendered no placeholder');
      }

      // The variant, exactly when declared.
      const variant = line.querySelector('.cart__item-variant');
      if (item.variant) {
        p.eq('variant', text(variant), item.variant);
      } else {
        p.ok(variant === null, `an item with no variant rendered "${text(variant)}"`);
      }

      // "Remove buttons include item name".
      const remove = line.querySelector('[aria-label]');
      p.ok(remove !== null, 'the line has no labelled remove control');
      p.ok((remove?.getAttribute('aria-label') ?? '').includes(item.name),
        `remove label "${remove?.getAttribute('aria-label')}" omits the item name`);

      // The quantity control carries the line's quantity.
      const qty = line.querySelector('.cart__qty');
      p.ok(qty !== null, 'the line has no quantity control');
      p.eq('quantity control value', qty?.getAttribute('value'), String(item.quantity));

      expectClean(p, combo.id);
    });
  }

  // ── The whole basket, in order ────────────────────────────────────────────

  for (const currency of CURRENCIES) {
    it(`currency=${currency}: every item renders in order with its own total`, async () => {
      const items = basket();
      const el = await mountCart({ items, currency });
      const p = new Problems();

      p.eq('line names', all(el, '.cart__item-name').map(text), items.map(i => i.name));
      p.eq('line totals', all(el, '.cart__item-total').map(text),
        items.map(item => money(lineTotal(item), currency)));
      p.eq('remove labels',
        parts(el, 'item').map(line => line.querySelector('[aria-label]')?.getAttribute('aria-label')),
        items.map(item => `Remove ${item.name}`));

      expectClean(p, `currency=${currency}`);
    });
  }
});
