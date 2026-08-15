/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-cart TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/cart, `npm run test:matrix`) owns the
 * money and the events. It cannot own what a shopper sees: that the summary's
 * value column really lines up on the right, that a line's thumbnail does not
 * sit on top of its name, that the checkout call to action really spans the
 * cart — and, most of all, that the controls exist as boxes at all.
 *
 * That last one is why this tier matters more than usual here. MATRIX-cart-1
 * (see tests/matrix/cart/cart-dependencies.test.ts) is precisely a
 * PAINT defect: following the documented import, `<snice-button>` and
 * `<snice-step-input>` never upgrade, so the remove, quantity, coupon and
 * checkout controls render as inert unknown elements. The DOM tier can say the
 * elements are not defined; only a browser can say what the shopper is looking
 * at instead of a button.
 *
 * ── Layer 1 (every combo, children loaded): geometry + computed style ───────
 *   · every line has a real box; lines stack without overlapping;
 *   · a line's image (or its placeholder) sits left of the line's body;
 *   · each summary row puts its label left of its value, on one baseline, with
 *     the value flush to the summary's right edge;
 *   · the checkout button spans the cart;
 *   · the total row is visually heavier than the rows above it;
 *   · nothing occludes the total.
 *
 * ── Layer 2: the documented-import claim, and a pinned pixel capture ────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/cart/matrix.html';

interface Item {
  id: string; name: string; price: number; quantity: number;
  image?: string; variant?: string;
}

const IMAGE = 'data:image/svg+xml;utf8,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">'
    + '<rect width="8" height="8" fill="#22c55e"/></svg>');

/** The same basket the DOM matrix uses, with an inline image so nothing is fetched. */
function basket(): Item[] {
  return [
    { id: '1', name: 'Shoes', price: 89.99, quantity: 1, variant: 'Size: M', image: IMAGE },
    { id: '2', name: 'Watch', price: 249, quantity: 2 },
    { id: '3', name: 'Earbuds', price: 59.99, quantity: 3, variant: 'Black' },
  ];
}

interface Combo {
  id: string;
  items: Item[];
  taxRate: number;
  discount: number;
  currency: string;
  couponCode?: string;
}

/**
 * lines (2) x taxRate (2) x discount (2) x currency (2) = 16 combos — the same
 * axes the DOM matrix crosses, so a layout that only breaks when the summary
 * grows a row is inside the product rather than outside it.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const lines of [1, 3]) {
    for (const taxRate of [0, 8.5]) {
      for (const discount of [0, 10]) {
        for (const currency of ['$', '€']) {
          combos.push({
            id: `${lines}-line/${taxRate ? 'taxed' : 'untaxed'}`
              + `/${discount ? 'discounted' : 'full'}/${currency}`,
            items: basket().slice(0, lines),
            taxRate, discount, currency,
            couponCode: discount ? 'SAVE10' : undefined,
          });
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
  // Layer 1 measures the CART's layout, so its children have to exist. The
  // documented-import claim is measured on its own page, below.
  expect(await page.evaluate(() => (window as any).matrix.loadDeps())).toBe(true);
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning every violation at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);

    // ── The lines ───────────────────────────────────────────────────────────
    const lines = [...sr.querySelectorAll('.cart__item')] as HTMLElement[];
    if (lines.length !== combo.items.length) {
      say(`${lines.length} lines, expected ${combo.items.length}`);
    }
    for (const [i, line] of lines.entries()) {
      const box = rect(line);
      if (box.width <= 0 || box.height <= 0) say(`line ${i} renders at ${box.width}x${box.height}`);
      if (i > 0) {
        const above = rect(lines[i - 1]);
        if (box.top < above.bottom - 1) {
          say(`line ${i} (top ${box.top.toFixed(1)}) overlaps line ${i - 1}`);
        }
      }
      const thumb = line.querySelector('.cart__item-image, .cart__item-image-placeholder');
      const body = line.querySelector('.cart__item-body');
      if (!thumb) { say(`line ${i} renders no thumbnail`); continue; }
      if (!body) { say(`line ${i} renders no body`); continue; }
      const thumbBox = rect(thumb);
      if (thumbBox.width <= 0 || thumbBox.height <= 0) {
        say(`line ${i} thumbnail renders at ${thumbBox.width}x${thumbBox.height}`);
      }
      if (rect(body).left < thumbBox.right - EPS) {
        say(`line ${i}: the body (left ${rect(body).left.toFixed(1)}) runs under the`
          + ` thumbnail (right ${thumbBox.right.toFixed(1)})`);
      }
    }

    // ── The summary rows ────────────────────────────────────────────────────
    const rows = [...sr.querySelectorAll('.cart__summary-row')] as HTMLElement[];
    const summary = sr.querySelector('[part~="summary"]') as HTMLElement | null;
    if (!summary) { say('no part="summary"'); return problems; }
    const summaryBox = rect(summary);
    let totalRow: HTMLElement | null = null;

    for (const [i, row] of rows.entries()) {
      const label = row.querySelector('.cart__summary-label') as HTMLElement | null;
      const value = row.querySelector('.cart__summary-value') as HTMLElement | null;
      if (!label || !value) { say(`summary row ${i} is missing a label or a value`); continue; }
      const labelBox = rect(label);
      const valueBox = rect(value);
      if (valueBox.left < labelBox.right - EPS) {
        say(`summary row ${i}: the value (left ${valueBox.left.toFixed(1)}) runs into the`
          + ` label (right ${labelBox.right.toFixed(1)})`);
      }
      // One baseline: a wrapped or floated value is a broken row.
      if (Math.abs(labelBox.top - valueBox.top) > labelBox.height) {
        say(`summary row ${i}: label and value are on different lines`);
      }
      // The value column is flush right.
      if (summaryBox.right - valueBox.right > 24) {
        say(`summary row ${i}: the value stops ${(summaryBox.right - valueBox.right).toFixed(0)}px`
          + ' short of the summary\'s right edge');
      }
      if (label.textContent?.trim() === 'Total') totalRow = row;
    }

    // ── The total is the loudest row ────────────────────────────────────────
    if (!totalRow) {
      say('no total row');
    } else if (rows.length > 1) {
      const totalWeight = Number(getComputedStyle(
        totalRow.querySelector('.cart__summary-value')!).fontWeight);
      const others = rows.filter(row => row !== totalRow).map(row =>
        Number(getComputedStyle(row.querySelector('.cart__summary-value')!).fontWeight));
      if (!others.every(weight => totalWeight >= weight)) {
        say(`the total is lighter (${totalWeight}) than a row above it (${others})`);
      }
    }

    // ── The checkout call to action spans the cart ──────────────────────────
    const checkout = sr.querySelector('[part~="checkout"] snice-button') as HTMLElement | null;
    if (!checkout) {
      say('no checkout button');
    } else {
      const box = rect(checkout);
      if (box.height <= 0) say(`the checkout button is ${box.height}px tall`);
      if (box.width < hostBox.width * 0.8) {
        say(`the checkout button covers ${box.width.toFixed(0)}px of a`
          + ` ${hostBox.width.toFixed(0)}px cart`);
      }
    }

    // ── Nothing paints over the total ──────────────────────────────────────
    if (totalRow) {
      const value = totalRow.querySelector('.cart__summary-value') as HTMLElement;
      const box = rect(value);
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`total: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== value && !value.contains(hit as Node)) {
          say(`the total is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('cart visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.lines).toBe(combo.items.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── MATRIX-cart-1, as the shopper meets it ──────────────────────────────────
//
// A FRESH page, so the module registry holds exactly what the documented import
// pulls in. Pinned with `test.fail()`: the assertion is the documented one — a
// cart loaded the documented way shows a checkout button — and is not weakened.

test.describe('cart visual matrix: the documented import', () => {
  test('the checkout button paints a real button [MATRIX-cart-1]', async ({ browser }) => {
    test.fail();
    const fresh = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await fresh.goto(FIXTURE);
      await fresh.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
      await fresh.evaluate(items => (window as any).matrix.mount({ items, taxRate: 8.5 }),
        basket() as any);

      const box = await fresh.evaluate(() => {
        const host = document.getElementById('subject')!;
        const node = host.shadowRoot!.querySelector('[part~="checkout"] snice-button')!;
        const rect = node.getBoundingClientRect();
        return { width: rect.width, height: rect.height, upgraded: !!(node as any).shadowRoot };
      });

      expect(box.upgraded, 'the checkout button never upgraded').toBe(true);
      expect(box.height, 'the checkout button has no height').toBeGreaterThan(20);
    } finally {
      await fresh.close();
    }
  });
});

// ── LAYER 2: the pinned marquee capture ─────────────────────────────────────

test.describe('cart visual matrix: marquee pixels', () => {
  test('the checkout call to action paints against the cart surface', async () => {
    await page.evaluate(items => (window as any).matrix.mount({ items, taxRate: 8.5 }),
      basket() as any);

    // One probe inside the button and one just below it: a primary CTA that
    // paints the surface colour is not a call to action.
    const [button, surface] = await capture(
      page, '#subject', 'cart-checkout',
      `(host) => {
        const node = host.shadowRoot.querySelector('[part~="checkout"] snice-button');
        const box = node.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + box.width / 2, y: box.y - 6 },
        ];
      }`,
    );
    expect(sameColor(button, surface),
      `the checkout button painted ${button.join(',')}, identical to the surface`).toBe(false);
  });
});
