/**
 * Matrix slice RECEIPT / TOTALS — the documented money contract crossed with
 * every documented variant.
 *
 * Dimensions: variant (9, the full `ReceiptVariant` union) x money shape (4).
 * 36 combos. The variant axis is in here because the money rows are documented
 * without any variant exception: a variant that suppresses or recomputes a
 * totals row would be a divergence, and only crossing the two can see it.
 *
 * Contract asserted (docs/ai/components/receipt.md):
 *   · Subtotal auto-computed from items if not set.
 *   · Total auto-computed as subtotal + tax - discount + tip if not set.
 *   · `taxes` array overrides single `tax` property.
 *   · Amounts render through Intl.NumberFormat for `currency`/`locale`.
 *   · `discountLabel` labels the discount row.
 *
 * it.fails policy: no assertion here is relaxed for any variant.
 */
import { describe, it, afterEach } from 'vitest';
import {
  mount, cleanup, cross, part, parts, partText, text, Problems, expectClean,
} from './matrix-utils';
import {
  VARIANTS, MONEY_SHAPES, moneyState, baseItems, money,
  expectedSubtotal, expectedTax, expectedTotal, taxLabel, MERCHANT,
} from './receipt-support';

describe('receipt matrix: totals', () => {
  afterEach(() => cleanup());

  const combos = cross({ variant: VARIANTS, shape: MONEY_SHAPES });

  for (const combo of combos) {
    const s = moneyState(combo.shape, baseItems());

    it(`${combo.id}: totals rows carry the documented amounts`, async () => {
      const el = await mount('snice-receipt', {
        attrs: { variant: combo.variant },
        props: {
          merchant: MERCHANT,
          items: s.items,
          tax: s.tax,
          taxes: s.taxes,
          subtotal: s.subtotal,
          total: s.total,
          tip: s.tip,
          discount: s.discount,
          discountLabel: s.discountLabel,
          currency: s.currency,
        },
      });
      const p = new Problems();

      // Subtotal: documented as auto-computed from items unless set.
      p.eq('subtotal row', partText(el, 'subtotal-row'),
        `Subtotal ${money(expectedSubtotal(s), s.currency)}`);

      // Total: documented as subtotal + tax - discount + tip unless set.
      p.eq('total row', partText(el, 'total-row'),
        `Total ${money(expectedTotal(s), s.currency)}`);

      // Discount row exists exactly when a discount was declared, and carries
      // the configured `discountLabel`.
      const discountRow = part(el, 'discount-row');
      if (s.discount > 0) {
        p.eq('discount row', text(discountRow),
          `${s.discountLabel} -${money(s.discount, s.currency)}`);
      } else {
        p.ok(discountRow === null, `discount row rendered with discount ${s.discount}`);
      }

      // Tip row, same rule.
      const tipRow = part(el, 'tip-row');
      if (s.tip > 0) {
        p.eq('tip row', text(tipRow), `Tip ${money(s.tip, s.currency)}`);
      } else {
        p.ok(tipRow === null, `tip row rendered with tip ${s.tip}`);
      }

      expectClean(p, combo.id);
    });

    it(`${combo.id}: the taxes array overrides the single tax property`, async () => {
      const el = await mount('snice-receipt', {
        attrs: { variant: combo.variant },
        props: {
          merchant: MERCHANT,
          items: s.items,
          tax: s.tax,
          taxes: s.taxes,
          subtotal: s.subtotal,
          total: s.total,
          tip: s.tip,
          discount: s.discount,
          currency: s.currency,
        },
      });
      const p = new Problems();
      const taxRows = parts(el, 'tax-row').map(node => text(node));

      if (s.taxes.length > 0) {
        // One row per declared line, labelled "Label (rate%)" when it has a
        // rate — and the single `tax` value must appear nowhere.
        p.eq('tax rows', taxRows, s.taxes.map(line =>
          `${taxLabel(line)} ${money(line.amount, s.currency)}`));
        p.ok(
          !taxRows.some(row => row === `Tax ${money(s.tax, s.currency)}`),
          `overridden single tax ${s.tax} still rendered a row`,
        );
      } else if (s.tax > 0) {
        p.eq('tax rows', taxRows, [`Tax ${money(s.tax, s.currency)}`]);
      } else {
        p.eq('tax rows', taxRows, []);
      }

      // And the total must be built from the SAME tax the rows show.
      p.eq('total row', partText(el, 'total-row'),
        `Total ${money(expectedTotal(s), s.currency)}`);

      expectClean(p, combo.id);
    });
  }

  // ── Currency / locale formatting, crossed with the variants ───────────────
  //
  // `currency` is a currency code and `locale` an Intl.NumberFormat locale, so
  // the same amounts must re-render in the requested currency and locale
  // without any variant getting its own number formatting.

  for (const variant of VARIANTS) {
    for (const [currency, locale] of [['USD', 'en-US'], ['EUR', 'de-DE']] as const) {
      it(`variant=${variant} currency=${currency} locale=${locale}: amounts use Intl.NumberFormat`, async () => {
        const s = moneyState('adjusted', baseItems());
        const el = await mount('snice-receipt', {
          attrs: { variant, currency, locale },
          props: {
            merchant: MERCHANT,
            items: s.items,
            tax: s.tax,
            tip: s.tip,
            discount: s.discount,
            discountLabel: s.discountLabel,
          },
        });
        const p = new Problems();

        p.eq('subtotal row', partText(el, 'subtotal-row'),
          `Subtotal ${money(expectedSubtotal(s), currency, locale)}`);
        p.eq('tax row', text(part(el, 'tax-row')),
          `Tax ${money(expectedTax(s), currency, locale)}`);
        p.eq('total row', partText(el, 'total-row'),
          `Total ${money(expectedTotal(s), currency, locale)}`);

        expectClean(p, `variant=${variant} currency=${currency}`);
      });
    }
  }
});
