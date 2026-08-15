/**
 * Matrix slice RECEIPT / ITEMS — the item line, crossed with every documented
 * variant.
 *
 * Dimensions: variant (9) x item shape (4: plain, sku, note, per-item
 * discount). 36 combos.
 *
 * The contract this slice exists for is one sentence of
 * docs/ai/components/receipt.md:
 *
 *     "SKU, notes, per-item discounts only in `detailed` variant"
 *
 * — so the variant axis is not decoration here, it IS the assertion. Plus the
 * per-item rendering the parts list documents: `item-name` is the item's name
 * and `item-price` is its line total, formatted as currency.
 *
 * FINDINGS
 *   MATRIX-receipt-1  A per-item `discount` renders its line in EVERY variant,
 *                     not only `detailed`. `renderItem()` gates `sku` and
 *                     `note` on `this.variant === 'detailed'` but computes
 *                     `hasDiscount` from the item alone. Pinned below with
 *                     `it.fails` for the eight non-detailed variants; the
 *                     assertion is the documented one and is NOT weakened.
 */
import { describe, it, afterEach } from 'vitest';
import { mount, cleanup, cross, part, parts, text, Problems, expectClean } from './matrix-utils';
import {
  VARIANTS, ITEM_SHAPES, itemsFor, money, lineTotal, MERCHANT,
} from './receipt-support';

describe('receipt matrix: item lines', () => {
  afterEach(() => cleanup());

  const combos = cross({ variant: VARIANTS, shape: ITEM_SHAPES });

  for (const combo of combos) {
    const items = itemsFor(combo.shape);
    const item = items[0];
    const detailed = combo.variant === 'detailed';

    // The documented extras render only in `detailed`.
    const wantsSku = detailed && !!item.sku;
    const wantsNote = detailed && !!item.note;
    const wantsItemDiscount = detailed && (item.discount ?? 0) > 0;

    /**
     * MATRIX-receipt-1: the per-item discount line escapes the `detailed`
     * gate, so every other variant paints it too. The expectation below stays
     * the documented one; only the wrapper records that it currently fails.
     */
    const pinned = combo.shape === 'item-discount' && !detailed;
    const runner = pinned ? it.fails : it;
    const name = pinned
      ? `${combo.id}: item extras render only in the detailed variant [MATRIX-receipt-1]`
      : `${combo.id}: item extras render only in the detailed variant`;

    runner(name, async () => {
      const el = await mount('snice-receipt', {
        attrs: { variant: combo.variant },
        props: { merchant: MERCHANT, items },
      });
      const p = new Problems();

      const itemNodes = parts(el, 'item');
      p.eq('rendered item count', itemNodes.length, items.length);

      p.eq('item-name', text(part(el, 'item-name')), item.name);
      p.eq('item-price', text(part(el, 'item-price')), money(lineTotal(item)));

      const skuNode = part(el, 'item-sku');
      if (wantsSku) {
        p.eq('item-sku', text(skuNode), item.sku!);
      } else {
        p.ok(skuNode === null, `item-sku rendered in variant "${combo.variant}"`);
      }

      const line = text(itemNodes[0]);

      if (item.note) {
        const shown = line.includes(item.note);
        p.ok(shown === wantsNote,
          `note "${item.note}" ${shown ? 'rendered' : 'missing'} in variant "${combo.variant}"`);
      }

      if ((item.discount ?? 0) > 0) {
        const marker = `-${money(item.discount!)}`;
        const shown = line.includes(marker);
        p.ok(shown === wantsItemDiscount,
          `per-item discount "${marker}" ${shown ? 'rendered' : 'missing'} in variant "${combo.variant}"`);
      }

      expectClean(p, combo.id);
    });
  }

  // ── The whole item list, in order ────────────────────────────────────────
  //
  // Documented parts `items` / `item` / `item-name` / `item-price`: every
  // declared item gets a line, in declaration order, with its own line total.

  for (const variant of VARIANTS) {
    it(`variant=${variant}: every item renders in order with its own line total`, async () => {
      const items = [
        { name: 'Cappuccino', quantity: 2, price: 4.5 },
        { name: 'Croissant', quantity: 1, price: 3.75 },
        { name: 'Beans 1kg', quantity: 3, price: 12.25 },
      ];
      const el = await mount('snice-receipt', {
        attrs: { variant },
        props: { merchant: MERCHANT, items },
      });
      const p = new Problems();

      p.ok(part(el, 'items') !== null, 'no items container');
      p.eq('item names', parts(el, 'item-name').map(text), items.map(i => i.name));
      p.eq('item prices', parts(el, 'item-price').map(text),
        items.map(i => money(lineTotal(i))));

      expectClean(p, `variant=${variant}`);
    });
  }
});
