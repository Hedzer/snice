/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-receipt TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/receipt, `npm run test:matrix`) owns the VALUE
 * truth: the money maths, Intl-formatted amounts, which parts exist for which
 * payload, SKU/notes/per-item-discount gating, the taxes-vs-tax override, and
 * the slot wiring. It cannot own the component's subject, because a receipt
 * IS a paper: a reading order of sections on a coloured sheet, name-left /
 * amount-right line items, a bolder grand total, dashed rules, and five
 * named variant aesthetics. happy-dom flows no text and paints no paper.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the paper is a real box with a real background, never wider than the
 *     documented `--snice-receipt-max-width` bracket allows;
 *   · the sections read top to bottom in the doc's own part order — header,
 *     meta, items, totals, payment, footer — disjoint, inside the paper;
 *   · every line item is one row: name on the left, price on the right, a
 *     quantity chip between them when the quantity is not 1, and nothing
 *     wrapping over its neighbour;
 *   · the totals stack ends in the grand total, and the grand total is the
 *     BOLDEST row on the paper (the two typography custom properties the
 *     docs dedicate to it are the emphasis contract);
 *   · per the doc's variant prose: `standard` dashes its dividers, `thermal`
 *     is monospaced on its own paper colour, `modern` rounds and tints its
 *     sections and casts a shadow, `minimal` strips the chrome, `detailed`
 *     gridded its meta and paints SKU lines;
 *   · the QR slot paints its slotted child square and centred, at the
 *     position `qr-position` names;
 *   · nothing occludes the merchant name, the grand total, or the closing
 *     line (elementFromPoint through the shadow root).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Four captures: thermal really paints its own paper, modern really tints
 *   a section differently from the sheet, the slotted QR child really paints
 *   (projection is a pixel claim), and the ticket variant's pure-CSS barcode
 *   strip really draws bars.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/receipt/matrix.html';

/**
 * The full documented `ReceiptVariant` union from the types file — the nine
 * values, not the five the prose calls out. A variant that exists in the
 * type but broke the paper would otherwise never be measured; the four the
 * prose does not describe get the generic paper contract only.
 */
const VARIANTS = [
  'standard', 'thermal', 'modern', 'minimal', 'detailed',
  'paper', 'ink', 'ledger', 'ticket',
] as const;
type Variant = typeof VARIANTS[number];

interface Combo {
  id: string;
  variant: Variant;
  showQr?: boolean;
  qrPosition?: 'top' | 'bottom' | 'footer';
  qrChild?: boolean;
  /** The multiple-taxes form replaced by a single `tax`. */
  singleTax?: boolean;
  /** No merchant, meta, items or payment — totals and the closing line only. */
  empty?: boolean;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const named = (name: string) =>
      sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;
    const rect = (el: Element) => el.getBoundingClientRect();

    // ── The paper ────────────────────────────────────────────────────────────
    const base = named('base');
    if (!base) { say('no part="base" painted'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`the paper renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    const baseStyle = getComputedStyle(base);
    if (baseStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('the paper is transparent — a receipt is a sheet, not a window');
    }
    // The docs bracket the sheet: `--snice-receipt-max-width` (default 22rem)
    // with `detailed` wide (26rem) and `thermal` narrow (18rem). The stage is
    // wider than all three, so the paper never touches its edge. The property
    // feeds the paper's CSS `max-width`, and nothing resets box-sizing, so it
    // constrains the CONTENT column; the sheet's border box legitimately adds
    // the paper's own padding and border on top. Bracket the box the property
    // governs (receipt.md: "Receipt maximum width").
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const horizChrome = parseFloat(baseStyle.paddingLeft) + parseFloat(baseStyle.paddingRight)
      + parseFloat(baseStyle.borderLeftWidth) + parseFloat(baseStyle.borderRightWidth);
    const columnWidth = baseBox.width - horizChrome;
    const widest = combo.variant === 'detailed' ? 26 : 22;
    if (columnWidth > widest * rem + EPS) {
      say(`the paper's column is ${round(columnWidth)}px wide, over the documented`
        + ` ${widest}rem maximum`);
    }

    // ── The sections read top to bottom, in the doc's own part order ────────
    const SECTION_ORDER = ['header', 'meta', 'items', 'totals', 'payment', 'footer'];
    let previous: { what: string; box: DOMRect } | null = null;
    for (const what of SECTION_ORDER) {
      const section = named(what);
      if (!section) continue;
      const box = rect(section);
      if (box.width <= 0 || box.height <= 0) { say(`section "${what}" renders empty`); continue; }
      if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS) {
        say(`section "${what}" is wider than the paper`);
      }
      if (previous && box.top < previous.box.bottom - EPS) {
        say(`section "${what}" starts before "${previous.what}" ends — the reading`
          + ' order is the part order');
      }
      previous = { what, box };
    }

    // The divider is the seam between sections: it spans the paper's whole
    // content column — the band the padding leaves it, the same column the
    // sections live in.
    for (const divider of sr.querySelectorAll('[part~="divider"]')) {
      const box = rect(divider);
      if (box.width > 0 && box.width < columnWidth - EPS) {
        say(`a divider spans ${round(box.width)}px of a ${round(columnWidth)}px column`);
      }
    }

    // ── Line items: one row each, name left, amount right ───────────────────
    const items = named('items');
    if (items) {
      const rows = [...items.querySelectorAll('[part~="item"]')] as HTMLElement[];
      if (rows.length === 0) say('part="items" painted with no item rows');
      let rowAbove: DOMRect | null = null;
      for (const [index, row] of rows.entries()) {
        const rowBox = rect(row);
        if (rowBox.width <= 0 || rowBox.height <= 0) {
          say(`item ${index} renders empty`);
          continue;
        }
        if (rowAbove && rowBox.top < rowAbove.bottom - EPS) {
          say(`item ${index} overlaps the item above it`);
        }
        rowAbove = rowBox;

        const name = row.querySelector('[part~="item-name"]') as HTMLElement | null;
        const price = row.querySelector('[part~="item-price"]') as HTMLElement | null;
        if (!name || !price) { say(`item ${index} paints no name/price pair`); continue; }
        const nameBox = rect(name);
        const priceBox = rect(price);
        if (nameBox.width <= 0) say(`item ${index}'s name renders empty`);
        if (priceBox.width <= 0) say(`item ${index}'s price renders empty`);
        if (nameBox.left > priceBox.left) {
          say(`item ${index}: the name is not left of the amount`);
        }
        if (priceBox.right > rowBox.right + EPS) {
          say(`item ${index}'s amount escapes its row`);
        }
        // A row is one visual line: name and amount share the line's band.
        const overlap = Math.min(nameBox.bottom, priceBox.bottom) - Math.max(nameBox.top, priceBox.top);
        if (overlap <= 0) {
          say(`item ${index}'s name and amount are on different lines`);
        }
        const qty = row.querySelector('[part~="item-qty"]') as HTMLElement | null;
        if (qty) {
          const qtyBox = rect(qty);
          if (qtyBox.left < nameBox.right - EPS) {
            say(`item ${index}'s quantity overlaps the name`);
          }
          if (qtyBox.right > priceBox.left + EPS) {
            say(`item ${index}'s quantity overlaps the amount`);
          }
        }
      }

      // SKU lines are `detailed`-only (receipt.md): the DOM tier owns the
      // value truth; here it is the paint fact — a SKU part with a box.
      const skus = [...items.querySelectorAll('[part~="item-sku"]')] as HTMLElement[];
      if (combo.variant === 'detailed') {
        const painted = skus.filter(sku => rect(sku).width > 0);
        if (painted.length === 0) {
          say('the detailed variant painted no SKU line');
        }
      } else if (skus.some(sku => rect(sku).width > 0)) {
        say('a non-detailed variant painted an SKU line');
      }
    }

    // ── The totals stack, and the grand total's emphasis ────────────────────
    const totals = named('totals');
    if (totals) {
      // "`taxes` array overrides single `tax`": each tax line is its own row.
      // The fixture's default payload carries two; the single-tax combo one.
      const expectedTaxRows = combo.singleTax ? 1 : 2;
      const taxRows = [...sr.querySelectorAll('[part~="tax-row"]')].filter(
        row => rect(row).height > 0);
      if (!combo.empty && taxRows.length !== expectedTaxRows) {
        say(`${taxRows.length} tax row(s) painted, expected ${expectedTaxRows}`);
      }
      const rows = [...totals.children] as HTMLElement[];
      if (rows.length < 2) say(`the totals stack has ${rows.length} rows`);
      let totalPrevious: DOMRect | null = null;
      for (const row of rows) {
        const rowBox = rect(row);
        if (rowBox.width <= 0 || rowBox.height <= 0) continue;
        if (totalPrevious && rowBox.top < totalPrevious.bottom - EPS) {
          say('two total rows overlap');
        }
        totalPrevious = rowBox;
        // Every totals row is label-left / amount-right.
        const spans = [...row.children] as HTMLElement[];
        if (spans.length >= 2) {
          const first = rect(spans[0]);
          const last = rect(spans[spans.length - 1]);
          if (first.left > last.left) {
            say('a totals row puts its label right of its amount');
          }
        }
      }
      const grand = named('total-row');
      const subtotal = named('subtotal-row');
      if (!grand) say('no part="total-row" painted');
      else if (rows.length && rows[rows.length - 1] !== grand) {
        say('the grand total is not the last row of the stack');
      }
      if (grand && subtotal) {
        // The docs dedicate two typography knobs to the total row alone
        // (--snice-receipt-total-font-size / -weight): the emphasis contract.
        const grandWeight = parseInt(getComputedStyle(grand).fontWeight, 10);
        const subWeight = parseInt(getComputedStyle(subtotal).fontWeight, 10);
        if (!(grandWeight > subWeight)) {
          say(`the grand total (${grandWeight}) is not bolder than the subtotal row (${subWeight})`);
        }
      }
    }

    // ── Variant prose, as computed style ─────────────────────────────────────
    if (combo.variant === 'standard') {
      // "Clean receipt with dashed dividers".
      const divider = named('divider');
      if (!divider) say('standard painted no dividers');
      else {
        const style = getComputedStyle(divider);
        if (style.borderTopStyle !== 'dashed') {
          say(`standard's divider rule is "${style.borderTopStyle}", expected dashed`);
        }
      }
      const paper = token('--snice-color-surface');
      if (baseStyle.backgroundColor !== paper) {
        say(`standard paper "${baseStyle.backgroundColor}",`
          + ` expected --snice-color-surface "${paper}"`);
      }
    }
    if (combo.variant === 'thermal') {
      // "Monospace, narrow-width, thermal printer aesthetic".
      if (!/monospace/i.test(baseStyle.fontFamily)) {
        say(`thermal paper is set in "${baseStyle.fontFamily}", expected a monospace face`);
      }
      const paper = token('--snice-color-surface-container-high');
      if (baseStyle.backgroundColor !== paper) {
        say(`thermal paper "${baseStyle.backgroundColor}", expected the documented`
          + ` --snice-receipt-thermal-bg default "${paper}"`);
      }
    }
    if (combo.variant === 'modern') {
      // "Card-based, rounded sections, shadows".
      if (baseStyle.boxShadow === 'none') say('modern casts no shadow');
      for (const what of ['meta', 'items', 'totals', 'payment']) {
        const section = named(what);
        if (!section) continue;
        const style = getComputedStyle(section);
        if (parseFloat(style.borderTopLeftRadius) <= 0) {
          say(`modern's "${what}" section is not rounded`);
        }
        if (style.backgroundColor === 'rgba(0, 0, 0, 0)') {
          say(`modern's "${what}" section has no card tint`);
        }
      }
    }
    if (combo.variant === 'minimal') {
      // "Stripped to essentials": no border, no shadow, no address chrome.
      if (parseFloat(baseStyle.borderTopWidth) > 0) {
        say(`minimal paper kept a border (${baseStyle.borderTopWidth})`);
      }
      if (baseStyle.boxShadow !== 'none') say('minimal paper casts a shadow');
      const address = named('merchant-address');
      if (address && rect(address).height > 0) {
        say('minimal painted the merchant address — essentials only');
      }
    }
    if (combo.variant === 'detailed') {
      // "Wide, grid meta, SKU/notes/per-item discounts".
      const meta = named('meta');
      if (meta && getComputedStyle(meta).display !== 'grid') {
        say(`detailed's meta is "${getComputedStyle(meta).display}", expected a grid`);
      }
    }

    // ── The QR slot, where `qr-position` says it is ──────────────────────────
    if (combo.showQr) {
      const qr = named('qr-container');
      if (!qr) { say('show-qr painted no qr-container'); }
      else {
        const qrBox = rect(qr);
        const header = named('header');
        const footer = named('footer');
        if (combo.qrPosition === 'top' && header && qrBox.bottom > header.getBoundingClientRect().top + EPS) {
          say('a top-positioned QR is not above the header');
        }
        if (combo.qrPosition === 'bottom') {
          const payment = named('payment');
          if (payment && qrBox.top < payment.getBoundingClientRect().bottom - EPS) {
            say('a bottom-positioned QR is not below the payment section');
          }
          if (footer && qrBox.bottom > footer.getBoundingClientRect().top + EPS) {
            say('a bottom-positioned QR intrudes into the footer');
          }
        }
        if (combo.qrPosition === 'footer') {
          if (!footer) say('qr-position="footer" painted no footer to live in');
          else {
            const footerBox = rect(footer);
            if (qrBox.top < footerBox.top - EPS || qrBox.bottom > footerBox.bottom + EPS) {
              say('a footer-positioned QR is not inside the footer');
            }
          }
        }
        // The slotted child is the component's own ::slotted size contract:
        // square, centred on the paper's axis.
        const child = host.querySelector('[slot="qr"]') as HTMLElement | null;
        if (child) {
          const childBox = rect(child);
          if (childBox.width <= 0 || childBox.height <= 0) {
            say('the slotted QR child was not projected');
          } else {
            if (Math.abs(childBox.width - childBox.height) > EPS) {
              say(`the slotted QR child is ${round(childBox.width)}x${round(childBox.height)},`
                + ' expected square');
            }
            const sheetCentre = baseBox.left + baseBox.width / 2;
            const childCentre = childBox.left + childBox.width / 2;
            if (Math.abs(sheetCentre - childCentre) > EPS) {
              say(`the slotted QR child is centred ${round(childCentre - sheetCentre)}px off`
                + ' the paper’s axis');
            }
          }
        }
      }
    }

    // ── Nothing occludes the three things a reader looks for ────────────────
    const probeHost = (el: HTMLElement | null, what: string) => {
      if (!el) return;
      const box = rect(el);
      if (box.width <= 0) return;
      const outer = document.elementFromPoint(
        box.left + Math.min(box.width / 2, 12), box.top + box.height / 2);
      if (outer !== host && !(host.contains(outer as Node))) {
        say(`${what} is occluded by <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    };
    probeHost(named('merchant-name'), 'the merchant name');
    probeHost(named('total-row'), 'the grand total');
    probeHost(named('thank-you'), 'the closing line');

    return problems;
  }, combo as any);
}

const VARIANT_COMBOS: Combo[] = VARIANTS.map(variant => ({ id: variant, variant }));

const COMBOS: Combo[] = [
  ...VARIANT_COMBOS,
  { id: 'single tax instead of taxes[]', variant: 'standard', singleTax: true },
  { id: 'qr top', variant: 'standard', showQr: true, qrPosition: 'top', qrChild: true },
  { id: 'qr bottom', variant: 'standard', showQr: true, qrPosition: 'bottom', qrChild: true },
  { id: 'qr footer', variant: 'standard', showQr: true, qrPosition: 'footer', qrChild: true },
  { id: 'empty receipt', variant: 'standard', empty: true },
];

test.describe('receipt visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant, `attribute reflection for ${combo.id}`).toBe(combo.variant);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * Two width claims no single combo can make — the prose's "narrow-width"
 * (thermal) and "Wide" (detailed) are ORDERINGS against the standard sheet.
 */
test.describe('receipt visual matrix: the variant width orderings', () => {
  test('thermal is narrower and detailed wider than the standard sheet', async () => {
    const widths: Record<string, number> = {};
    for (const variant of ['standard', 'thermal', 'detailed']) {
      await page.evaluate(v => (window as any).matrix.mount({ variant: v }), variant);
      widths[variant] = await page.evaluate(() =>
        document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="base"]')!.getBoundingClientRect().width);
    }
    expect(widths.thermal, 'thermal "narrow-width"').toBeLessThan(widths.standard);
    expect(widths.detailed, 'detailed "Wide"').toBeGreaterThan(widths.standard);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('receipt visual matrix: marquee pixels', () => {
  test('thermal paints its own paper, distinct from the page', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ variant: 'thermal' }));
    // The host is a block that fills the stage, so the strip right of the
    // max-width paper is stage surface — the reference the paper is judged
    // against, read inside the same capture.
    const [paper, surface] = await capture(
      page, '#subject', 'receipt-thermal-paper',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]').getBoundingClientRect();
        return [
          { x: base.left + 12, y: base.top + 10 },
          { x: host.getBoundingClientRect().right - 10, y: base.top + 10 },
        ];
      }`,
    );
    expect(sameColor(paper as RGB, surface as RGB),
      `thermal paper painted ${paper.join(',')} identical to the page surface`
        + ` ${surface.join(',')}`).toBe(false);
  });

  test('modern tints a section differently from the sheet it sits on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ variant: 'modern' }));
    const [section, sheet] = await capture(
      page, '#subject', 'receipt-modern-section',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]').getBoundingClientRect();
        const totals = host.shadowRoot.querySelector('[part~="totals"]').getBoundingClientRect();
        return [
          { x: totals.left + 12, y: totals.top + 4 },
          { x: base.left + 8, y: base.top + 6 },
        ];
      }`,
    );
    expect(sameColor(section as RGB, sheet as RGB),
      `the modern section tint ${section.join(',')} is identical to the sheet`
        + ` ${sheet.join(',')} — no card was painted`).toBe(false);
  });

  test('the slotted QR child really paints its own colour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'standard', showQr: true, qrPosition: 'bottom', qrChild: true,
    }));
    const [child, sheet] = await capture(
      page, '#subject', 'receipt-qr-child',
      `(host) => {
        const child = host.querySelector('[slot="qr"]').getBoundingClientRect();
        return [
          { x: child.left + child.width / 2, y: child.top + child.height / 2 },
          { x: child.left - 10, y: child.top + child.height / 2 },
        ];
      }`,
    );
    // The fixture paints the child rgb(220 38 38); the sheet beside it is the
    // paper's own surface. Identical pixels mean the slot projected nothing.
    expect(sameColor(child as RGB, sheet as RGB),
      `the slotted QR child painted ${child.join(',')} identical to the sheet`
        + ` ${sheet.join(',')}`).toBe(false);
    expect(child as RGB, 'the child is not the fixture red').toEqual([220, 38, 38]);
  });

  test('the ticket variant draws its pure-CSS barcode strip', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ variant: 'ticket' }));
    const bars = await capture(
      page, '#subject', 'receipt-ticket-barcode',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]').getBoundingClientRect();
        // The strip is pinned to the paper's bottom: 0.875rem up, 1.75rem tall.
        const y = base.bottom - 28;
        return [40, 44, 48, 52, 56, 60].map(dx => ({ x: base.left + dx, y }));
      }`,
    );
    const distinct = new Set(bars.map(p => p.join(',')));
    expect(distinct.size,
      `six probes along the barcode strip found ${distinct.size} colour(s)`
        + ` (${[...distinct].join(' | ')}) — no bars were drawn`).toBeGreaterThan(1);
  });
});
