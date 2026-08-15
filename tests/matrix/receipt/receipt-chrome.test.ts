/**
 * Matrix slice RECEIPT / CHROME — everything around the money: the QR block and
 * its documented positions, the merchant header, the metadata block, the
 * payment block, the closing line, and the documented attribute names.
 *
 * Dimensions: qr (4: off + the three documented `QrPosition` values) x variant
 * (3 representative: `standard`, the plainest; `thermal`, the narrow monospace
 * one; `detailed`, the only variant with extra item chrome) = 12 combos, plus
 * the per-region cases below.
 *
 * Contract asserted (docs/ai/components/receipt.md):
 *   · `showQr` gates the `qr-container` part; `qrPosition` decides WHERE.
 *   · Merchant name/address/contact render into their documented parts.
 *   · `receiptNumber`/`date` render into `receipt-number`/`date`.
 *   · `paymentMethod`/`paymentDetails` render into their documented parts.
 *   · `thankYou` renders into `thank-you`, defaulting to the documented string.
 *   · Every documented attribute name is the one the component observes.
 */
import { describe, it, afterEach } from 'vitest';
import { mount, cleanup, cross, part, parts, partText, shadow, text, Problems, expectClean } from './matrix-utils';
import { QR_POSITIONS, MERCHANT, baseItems } from './receipt-support';

/** Documented default of the `thankYou` property. */
const DEFAULT_THANK_YOU = 'Thank you for your purchase!';

const CHROME_VARIANTS = ['standard', 'thermal', 'detailed'] as const;

describe('receipt matrix: chrome', () => {
  afterEach(() => cleanup());

  // ── QR placement ────────────────────────────────────────────────────────

  const qrCombos = cross({
    variant: CHROME_VARIANTS,
    qr: ['off', ...QR_POSITIONS] as const,
  });

  for (const combo of qrCombos) {
    it(`${combo.id}: showQr gates the QR container and qrPosition places it`, async () => {
      const on = combo.qr !== 'off';
      const el = await mount('snice-receipt', {
        attrs: {
          variant: combo.variant,
          ...(on ? { 'show-qr': true, 'qr-position': combo.qr, 'qr-data': 'https://r.test/1' } : {}),
        },
        props: { merchant: MERCHANT, items: baseItems() },
        html: '<span slot="qr">QR</span>',
      });
      const p = new Problems();

      const containers = parts(el, 'qr-container');
      if (!on) {
        p.eq('qr containers with showQr off', containers.length, 0);
        expectClean(p, combo.id);
        return;
      }

      // Exactly one: a receipt that painted the block at two positions would
      // still satisfy a "contains a QR" assertion.
      p.eq('qr containers', containers.length, 1);
      if (containers.length !== 1) { expectClean(p, combo.id); return; }

      const container = containers[0];
      const footer = part(el, 'footer');
      const header = part(el, 'header');
      const totals = part(el, 'totals');
      const inFooter = !!footer?.contains(container);
      /** True when `a` precedes `b` in document order. */
      const before = (a: Element, b: Element) =>
        (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

      if (combo.qr === 'top') {
        p.ok(!inFooter, 'qr-position="top" placed the block inside the footer');
        p.ok(!!header && before(container, header),
          'qr-position="top" did not place the block above the merchant header');
      } else if (combo.qr === 'bottom') {
        p.ok(!inFooter, 'qr-position="bottom" placed the block inside the footer');
        p.ok(!!totals && before(totals, container),
          'qr-position="bottom" did not place the block below the totals');
      } else {
        p.ok(inFooter, 'qr-position="footer" did not place the block inside the footer');
      }

      // The slotted QR content must actually be reachable through the block.
      p.ok(container.querySelector('slot[name="qr"]') !== null,
        'qr-container exposes no qr slot');

      expectClean(p, combo.id);
    });
  }

  // ── Merchant, metadata, payment, closing line ───────────────────────────

  for (const variant of CHROME_VARIANTS) {
    it(`variant=${variant}: merchant fields render into their documented parts`, async () => {
      const el = await mount('snice-receipt', {
        attrs: { variant },
        props: { merchant: MERCHANT, items: baseItems() },
      });
      const p = new Problems();

      p.eq('merchant-name', partText(el, 'merchant-name'), MERCHANT.name);
      p.eq('merchant-address', partText(el, 'merchant-address'), MERCHANT.address!);

      const contact = partText(el, 'merchant-contact');
      for (const value of [MERCHANT.phone!, MERCHANT.email!, MERCHANT.website!, MERCHANT.taxId!]) {
        p.ok(contact.includes(value), `merchant-contact omits "${value}" (got "${contact}")`);
      }

      expectClean(p, `variant=${variant}`);
    });

    it(`variant=${variant}: a merchant with only a name renders no address or contact`, async () => {
      const el = await mount('snice-receipt', {
        attrs: { variant },
        props: { merchant: { name: 'Kiosk' }, items: baseItems() },
      });
      const p = new Problems();

      p.eq('merchant-name', partText(el, 'merchant-name'), 'Kiosk');
      p.ok(part(el, 'merchant-address') === null, 'merchant-address rendered with no address');
      p.ok(part(el, 'merchant-contact') === null, 'merchant-contact rendered with no contact fields');

      expectClean(p, `variant=${variant}`);
    });

    it(`variant=${variant}: metadata and payment render into their documented parts`, async () => {
      const el = await mount('snice-receipt', {
        attrs: {
          variant,
          'receipt-number': 'REC-4521',
          date: '2026-02-27 14:30',
          cashier: 'Dana',
          'terminal-id': 'T-07',
          'payment-method': 'Visa **** 4242',
          'payment-details': 'Auth 00912',
        },
        props: { merchant: MERCHANT, items: baseItems() },
      });
      const p = new Problems();

      p.eq('receipt-number', partText(el, 'receipt-number'), 'REC-4521');
      p.eq('date', partText(el, 'date'), '2026-02-27 14:30');
      p.eq('payment-method', partText(el, 'payment-method'), 'Visa **** 4242');
      p.eq('payment-details', partText(el, 'payment-details'), 'Auth 00912');

      // `cashier` and `terminalId` are documented properties with no part of
      // their own, so the contract they can be held to is that their values
      // reach the metadata block.
      const meta = partText(el, 'meta');
      p.ok(meta.includes('Dana'), `meta omits the cashier (got "${meta}")`);
      p.ok(meta.includes('T-07'), `meta omits the terminal id (got "${meta}")`);

      expectClean(p, `variant=${variant}`);
    });

    it(`variant=${variant}: thankYou defaults to the documented line and can be replaced`, async () => {
      const el = await mount('snice-receipt', {
        attrs: { variant },
        props: { merchant: MERCHANT, items: baseItems() },
      });
      const p = new Problems();
      p.eq('default thank-you', partText(el, 'thank-you'), DEFAULT_THANK_YOU);

      (el as any).thankYou = 'See you soon';
      await new Promise(resolve => setTimeout(resolve, 30));
      p.eq('replaced thank-you', partText(el, 'thank-you'), 'See you soon');

      expectClean(p, `variant=${variant}`);
    });
  }

  // ── Documented attribute names ──────────────────────────────────────────
  //
  // Every property the docs annotate with `attr:` must be reachable from
  // authored markup under exactly that name. This is the channel a customer
  // copying the "Basic Usage" block actually uses.

  it('every documented attribute name reaches its property', async () => {
    const el = await mount('snice-receipt', {
      attrs: {
        'receipt-number': 'REC-1',
        'discount-label': 'Staff',
        'payment-method': 'Cash',
        'payment-details': 'Drawer 2',
        'show-qr': true,
        'qr-data': 'https://r.test/2',
        'qr-position': 'footer',
        'thank-you': 'Ciao',
        'terminal-id': 'T-99',
      },
      props: { merchant: MERCHANT, items: baseItems() },
    });
    const p = new Problems();
    const receipt = el as any;

    p.eq('receiptNumber', receipt.receiptNumber, 'REC-1');
    p.eq('discountLabel', receipt.discountLabel, 'Staff');
    p.eq('paymentMethod', receipt.paymentMethod, 'Cash');
    p.eq('paymentDetails', receipt.paymentDetails, 'Drawer 2');
    p.eq('showQr', receipt.showQr, true);
    p.eq('qrData', receipt.qrData, 'https://r.test/2');
    p.eq('qrPosition', receipt.qrPosition, 'footer');
    p.eq('thankYou', receipt.thankYou, 'Ciao');
    p.eq('terminalId', receipt.terminalId, 'T-99');

    expectClean(p, 'attribute names');
  });

  it('an empty receipt still renders its base and totals', async () => {
    const el = await mount('snice-receipt');
    const p = new Problems();

    p.ok(part(el, 'base') !== null, 'no base part');
    p.ok(part(el, 'totals') !== null, 'no totals part');
    p.ok(part(el, 'items') === null, 'items container rendered with no items');
    p.ok(shadow(el).querySelector('[part~="divider"]') !== null, 'no divider rendered');
    p.eq('subtotal row present', text(part(el, 'subtotal-row')).startsWith('Subtotal'), true);

    expectClean(p, 'empty');
  });
});
