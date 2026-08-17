/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-estimate TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/estimate) owns the optional-line arithmetic and
 * the three events. What it cannot own is the thing a client actually decides
 * from: whether an EXCLUDED line looks excluded, whether the accept button
 * reads as the primary action next to decline, and whether the comparison
 * variant's options sit side by side rather than stacked into a list nobody
 * would compare.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · header, parties, table, summary and actions have real boxes and stack
 *     in document order without overlapping;
 *   · every table row's cells are horizontally disjoint and ascending, and the
 *     optional line's toggle sits inside the row's last column;
 *   · an excluded line is visually distinguished from an included one — the
 *     component must express "not in this price" in SOME painted property
 *     (opacity, colour or line-through), which no DOM assertion can check;
 *   · the total is the heaviest row in the summary and nothing occludes it;
 *   · accept and decline are both real, hit-testable buttons.
 *
 * ── Layer 2: pinned pixel captures ─────────────────────────────────────────
 *   the accept button must not paint the page's own surface colour, and the
 *   excluded row must not paint identically to the included one.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, contrast } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/estimate/matrix.html';

interface Item {
  description: string; quantity: number; unitPrice: number;
  optional?: boolean; included?: boolean;
}

const REQUIRED: Item[] = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'Website Build', quantity: 2, unitPrice: 3000 },
];
const WITH_OPTIONAL: Item[] = [
  { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
  { description: 'SEO Audit', quantity: 1, unitPrice: 1500, optional: true, included: false },
];

interface Combo {
  id: string;
  variant: string;
  status: string;
  items: Item[];
  taxRate: number;
  discount: number;
  notes?: string;
  terms?: string;
  showQr?: boolean;
  qrPosition?: string;
}

/**
 * variant (5) x line set (2) x summary shape (2) = 20 combos. Status is pinned
 * to `sent` for the cross — it is the state that renders the action row, which
 * is the part of the layout with something to get wrong — and crossed on its
 * own below.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['standard', 'comparison', 'professional', 'creative', 'minimal']) {
    for (const [name, items] of [['required', REQUIRED], ['optional', WITH_OPTIONAL]] as const) {
      for (const [taxRate, discount] of [[0, 0], [10, 20]] as const) {
        combos.push({
          id: `${variant}/${name}/${taxRate ? 'taxed+discounted' : 'plain'}`,
          variant, status: 'sent', items: [...items], taxRate, discount,
          notes: 'Prices held for 30 days.', terms: 'Payment on acceptance.',
        });
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

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
    const tokens = (el: Element) => (el.getAttribute('part') ?? '').split(/\s+/);
    const exact = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(el => tokens(el).includes(name)) as HTMLElement[];
    const first = (name: string) => exact(name)[0] ?? null;
    const isComparison = combo.variant === 'comparison';

    // ── The document's regions stack ────────────────────────────────────────
    const wanted = isComparison
      ? ['header', 'parties', 'comparison', 'actions']
      : ['header', 'parties', 'table', 'summary', 'actions'];
    let previousBottom = -Infinity;
    let previousName = '';
    for (const name of wanted) {
      const node = first(name);
      if (!node) { say(`part="${name}" is missing`); continue; }
      const box = rect(node);
      if (box.width <= 0 || box.height <= 0) {
        say(`part="${name}" renders at ${box.width}x${box.height}`);
        continue;
      }
      if (box.top < previousBottom - 1) {
        say(`part="${name}" (top ${box.top.toFixed(1)}) overlaps part="${previousName}"`);
      }
      previousBottom = box.bottom;
      previousName = name;
    }

    // ── Options sit side by side, which is what makes them comparable ───────
    if (isComparison) {
      const options = exact('option');
      if (options.length !== combo.items.length) {
        say(`${options.length} option cards for ${combo.items.length} items`);
      }
      for (let i = 1; i < options.length; i++) {
        const previous = rect(options[i - 1]);
        const box = rect(options[i]);
        if (box.left < previous.right - EPS && box.top < previous.bottom - EPS) {
          say(`option ${i} overlaps option ${i - 1}`);
        }
      }
      for (const [i, option] of options.entries()) {
        const button = option.querySelector('.est__option-btn') as HTMLElement | null;
        if (!button) { say(`option ${i} has no button`); continue; }
        const box = rect(button);
        if (box.width <= 0 || box.height <= 0) say(`option ${i}'s button is ${box.width}x${box.height}`);
      }
      return problems;
    }

    // ── Table rows: cells ascend, the toggle rides the last column ──────────
    const rows = exact('table-row');
    if (rows.length !== combo.items.length) {
      say(`${rows.length} rows for ${combo.items.length} items`);
    }
    for (const [r, row] of rows.entries()) {
      const cells = [...row.querySelectorAll('td')] as HTMLElement[];
      let previousRight = -Infinity;
      for (const [c, cell] of cells.entries()) {
        const box = rect(cell);
        if (box.left < previousRight - EPS) {
          say(`row ${r} cell ${c} (left ${box.left.toFixed(1)}) runs into the cell before it`);
        }
        previousRight = box.right;
      }
      const toggle = row.querySelector('.est__toggle') as HTMLElement | null;
      const isOptional = !!combo.items[r]?.optional;
      if (isOptional !== !!toggle) {
        say(`row ${r}: toggle ${toggle ? 'present' : 'absent'} for optional=${isOptional}`);
      }
      if (toggle) {
        const box = rect(toggle);
        if (box.width <= 0 || box.height <= 0) say(`row ${r}: the toggle is ${box.width}x${box.height}`);
        const last = cells[cells.length - 1];
        if (last && (box.left < rect(last).left - EPS || box.right > rect(last).right + EPS)) {
          say(`row ${r}: the toggle escapes the last column`);
        }
      }
    }

    // ── An excluded line LOOKS excluded ─────────────────────────────────────
    const excludedIndex = combo.items.findIndex(i => i.optional && i.included === false);
    if (excludedIndex >= 0 && rows[excludedIndex] && rows[0]) {
      const style = (row: HTMLElement) => {
        const cell = row.querySelector('td') as HTMLElement;
        const computed = getComputedStyle(cell);
        return {
          opacity: Number(getComputedStyle(row).opacity),
          color: computed.color,
          decoration: computed.textDecorationLine,
        };
      };
      const included = style(rows[0]);
      const excluded = style(rows[excludedIndex]);
      const differs = excluded.opacity < included.opacity
        || excluded.color !== included.color
        || excluded.decoration !== included.decoration;
      if (!differs) {
        say('the excluded line paints exactly like the included one'
          + ` (opacity ${excluded.opacity}, colour ${excluded.color},`
          + ` decoration ${excluded.decoration})`);
      }
    }

    // ── The summary: the total is the loudest row, and unobstructed ─────────
    const summaryRows = [
      first('subtotal'), first('discount-row'), first('tax-row'), first('total'),
    ].filter(Boolean) as HTMLElement[];
    const total = first('total');
    if (!total) {
      say('no part="total"');
    } else {
      const weight = (row: HTMLElement) => Number(getComputedStyle(row).fontWeight);
      const totalWeight = weight(total);
      for (const row of summaryRows) {
        if (row !== total && weight(row) > totalWeight) {
          say(`the total (${totalWeight}) is lighter than a row above it (${weight(row)})`);
        }
      }
      const box = rect(total);
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`total: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>`);
      } else {
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== total && !total.contains(hit as Node)) {
          say(`the total is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    // ── Both actions are real, hit-testable buttons ─────────────────────────
    for (const name of ['accept-button', 'decline-button']) {
      const button = first(name);
      if (!button) { say(`part="${name}" is missing`); continue; }
      const box = rect(button);
      if (box.width <= 0 || box.height <= 0) say(`part="${name}" is ${box.width}x${box.height}`);
      const hit = (sr as any).elementFromPoint(
        box.left + box.width / 2, box.top + box.height / 2) as Element | null;
      if (hit !== button && !button.contains(hit as Node)) {
        say(`part="${name}" is not the element under its own centre`);
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('estimate visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      if (combo.variant === 'comparison') {
        expect(mounted.options, 'option cards').toBe(combo.items.length);
      } else {
        expect(mounted.rows, 'table rows').toBe(combo.items.length);
      }
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('estimate visual matrix: status decides the action row', () => {
  for (const status of ['draft', 'sent', 'accepted', 'declined', 'expired']) {
    test(`status=${status}`, async () => {
      await page.evaluate(s => (window as any).matrix.mount({
        variant: 'standard', status: s, taxRate: 10, discount: 0,
        items: [
          { description: 'Brand Identity', quantity: 1, unitPrice: 5000 },
          { description: 'Website Build', quantity: 2, unitPrice: 3000 },
        ],
      }), status);

      const painted = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const box = (selector: string) => {
          const node = sr.querySelector(selector) as HTMLElement | null;
          return node ? node.getClientRects().length > 0 : false;
        };
        const badge = sr.querySelector('[part~="status"]') as HTMLElement;
        return {
          accept: box('.est__btn--accept'),
          decline: box('.est__btn--decline'),
          badgeText: badge?.textContent?.trim(),
          badgeVisible: badge ? badge.getClientRects().length > 0 : false,
        };
      });

      // The badge always names the state the estimate is in.
      expect(painted.badgeText, 'the status badge text').toBe(status);
      expect(painted.badgeVisible, 'the status badge is painted').toBe(true);
      // Accept and decline belong to an estimate that can still be answered.
      const answerable = status === 'draft' || status === 'sent';
      expect(painted.accept, `accept button painted for status=${status}`).toBe(answerable);
      expect(painted.decline, `decline button painted for status=${status}`).toBe(answerable);
    });
  }
});

test.describe('estimate visual matrix: toggling an optional line', () => {
  test('the excluded row changes how it paints when it is included', async () => {
    await page.evaluate(items => (window as any).matrix.mount({
      variant: 'standard', status: 'sent', taxRate: 10, discount: 0, items,
    }), WITH_OPTIONAL as any);

    const read = () => page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const row = [...sr.querySelectorAll('tbody tr')][1] as HTMLElement;
      const cell = row.querySelector('td') as HTMLElement;
      const total = sr.querySelector('[part~="total"]')!.textContent!.replace(/\s+/g, ' ').trim();
      return {
        opacity: Number(getComputedStyle(row).opacity),
        color: getComputedStyle(cell).color,
        total,
      };
    });

    const before = await read();
    expect(await page.evaluate(() => (window as any).matrix.toggleOptional()),
      'the optional line offers a toggle').toBe(true);
    const after = await read();

    expect(after.total, 'the total must change when a line joins the price')
      .not.toBe(before.total);
    expect(before.opacity !== after.opacity || before.color !== after.color,
      `the excluded row painted ${JSON.stringify(before)} and the included one`
      + ` ${JSON.stringify(after)}`).toBe(true);
  });
});

// ── MATRIX-estimate-1, as a page author meets it ────────────────────────────
//
// The doc's property table gives three properties kebab-case attributes —
// `estimate-number`, `expiry-date`, `tax-rate` — and its example markup writes
// them. In a browser all three are inert: each property is declared with a
// bare `@property()`, so the element observes `estimatenumber`, `expirydate`
// and `taxrate`, and the documented names are never seen. The estimate renders
// with no number in its title, no expiry line, and no tax.
//
// This tier owns that claim because happy-dom hands `attributeChangedCallback`
// every attribute change whether or not it was observed, so the DOM matrix
// sees the documented attributes "work" and can only catch the residue (the
// value arrives untyped — see tests/matrix/estimate/estimate-api.test.ts).
//
// Pinned with `test.fail()`; the assertions are the documented ones.

test.describe('estimate visual matrix: the documented markup', () => {
  test('the doc\'s own attributes reach the document [MATRIX-estimate-1]', async () => {
    test.fail();
    const authored = await page.evaluate(() => (window as any).matrix.mountAuthored());
    expect(authored.estimateNumber, 'estimate-number -> estimateNumber').toBe('EST-001');
    expect(authored.expiryDate, 'expiry-date -> expiryDate').toBe('2026-02-15');
    expect(authored.taxRate, 'tax-rate -> taxRate').toBe(10);
    expect(authored.title, 'the rendered title').toBe('Estimate #EST-001');
    expect(authored.expiryPainted, 'the "Valid until" line is painted').toBe(true);
    expect(authored.taxRowPainted, 'the tax row is painted').toBe(true);
  });
});

// ── LAYER 2: pinned pixel captures ──────────────────────────────────────────

test.describe('estimate visual matrix: marquee pixels', () => {
  test('the accept button is painted, not merely present', async () => {
    await page.evaluate(items => (window as any).matrix.mount({
      variant: 'standard', status: 'sent', taxRate: 10, discount: 0, items,
    }), REQUIRED as any);

    const [button, surface] = await capture(
      page, '#subject', 'estimate-accept',
      `(host) => {
        const node = host.shadowRoot.querySelector('.est__btn--accept');
        const box = node.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + box.width / 2, y: box.y - 8 },
        ];
      }`,
    );
    expect(sameColor(button, surface),
      `the accept button painted ${button.join(',')}, identical to the surface behind it`)
      .toBe(false);
  });

  test('the total line reads against the paper it is printed on', async () => {
    await page.evaluate(items => (window as any).matrix.mount({
      variant: 'standard', status: 'sent', taxRate: 10, discount: 20, items,
    }), REQUIRED as any);

    const strip = await capture(
      page, '#subject', 'estimate-total',
      `(host) => {
        const total = host.shadowRoot.querySelector('.est__total-row');
        const box = total.getBoundingClientRect();
        const points = [];
        for (let i = 0; i <= 40; i++) {
          points.push({ x: box.x + 4 + (i * 60) / 40, y: box.y + box.height / 2 });
        }
        return points;
      }`,
    );
    const luminances = strip.map(rgb => ({
      rgb, l: rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722,
    }));
    const darkest = luminances.reduce((a, b) => (a.l <= b.l ? a : b)).rgb;
    const lightest = luminances.reduce((a, b) => (a.l >= b.l ? a : b)).rgb;
    expect(contrast(darkest, lightest),
      `the word "Total" painted ink ${darkest.join(',')} on ${lightest.join(',')}`)
      .toBeGreaterThan(3);
  });
});
