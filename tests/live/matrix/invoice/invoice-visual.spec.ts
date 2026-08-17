/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-invoice TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/invoice, `npm run test:matrix`) owns the money
 * and the parts. It cannot own what a person receiving a bill sees: whether
 * the Amount column really sits under the word "Amount", whether the status
 * badge is legible against the header, whether the QR block lands in the
 * corner `qr-position` names, or whether the total is the loudest line on the
 * page.
 *
 * That first one is the reason this tier matters for the invoice specifically.
 * The docs say the `detailed` variant "shows line numbers and per-item tax",
 * and the component keeps that promise with `display: none` rather than with
 * conditional markup: the line-number cell and the per-item tax span are in
 * every variant's tree and painted in exactly one of them. happy-dom performs
 * no cascade, so the DOM tier cannot see either half of that sentence — it is
 * asserted here, in both directions, against cells that really have boxes.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · header, table, summary and footer all have real boxes and stack in
 *     document order without overlapping;
 *   · every heading has exactly one body column centred under it;
 *   · each summary row puts its label left of its value, on one baseline, with
 *     the value flush to the summary's right edge;
 *   · the total row is at least as heavy as the rows above it;
 *   · the QR block lands in the half/corner its `qr-position` names;
 *   · nothing occludes the total.
 *
 * ── Layer 2: pinned pixel captures ─────────────────────────────────────────
 *   the status badge and the table header must paint against their
 *   surroundings, which is a claim only real pixels can settle.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/invoice/matrix.html';

interface Item { description: string; quantity: number; unitPrice: number; amount?: number; tax?: number }

function lines(count: number): Item[] {
  const all: Item[] = [
    { description: 'Web Development', quantity: 40, unitPrice: 150 },
    { description: 'Design Services', quantity: 10, unitPrice: 120 },
    { description: 'Hosting', quantity: 12, unitPrice: 9.99, tax: 7 },
  ];
  return all.slice(0, count);
}

interface Combo {
  id: string;
  variant: string;
  status: string;
  items: Item[];
  taxRate: number;
  discount: number;
  currency: string;
  showQr?: boolean;
  qrPosition?: string;
}

/**
 * variant (5) x status (2) x summary shape (2) x line count (2) = 40 combos.
 * The variants are the five with their own stylesheet blocks plus the default;
 * the summary shape axis is what grows the block from two rows to four, which
 * is where a right-aligned value column stops lining up.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['standard', 'modern', 'classic', 'minimal', 'detailed']) {
    for (const status of ['sent', 'overdue']) {
      for (const [taxRate, discount] of [[0, 0], [8.25, 15]] as const) {
        for (const count of [1, 3]) {
          combos.push({
            id: `${variant}/${status}/${taxRate ? 'taxed+discounted' : 'plain'}/${count}-line`,
            variant, status, items: lines(count), taxRate, discount, currency: 'USD',
          });
        }
      }
    }
  }
  return combos;
}

/** The QR corner claims, crossed on their own — one mount per position. */
const QR_COMBOS: Combo[] = ['top-right', 'bottom-right', 'bottom-left', 'footer'].map(pos => ({
  id: `qr/${pos}`,
  variant: 'standard', status: 'sent', items: lines(2),
  taxRate: 10, discount: 0, currency: 'USD', showQr: true, qrPosition: pos,
}));

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
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

    const tokens = (el: Element) => (el.getAttribute('part') ?? '').split(/\s+/);
    const exact = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(el => tokens(el).includes(name)) as HTMLElement[];
    const first = (name: string) => exact(name)[0] ?? null;

    // ── The document's regions stack ────────────────────────────────────────
    const regions: Array<[string, HTMLElement | null]> = [
      ['header', first('header')],
      ['table', first('table')],
      ['summary', first('summary')],
      ['footer', first('footer')],
    ];
    let previousBottom = -Infinity;
    let previousName = '';
    for (const [name, node] of regions) {
      if (!node) { if (name !== 'table' || combo.items.length) say(`part="${name}" is missing`); continue; }
      const box = rect(node);
      if (name !== 'footer' && (box.width <= 0 || box.height <= 0)) {
        say(`part="${name}" renders at ${box.width}x${box.height}`);
      }
      if (box.height > 0 && box.top < previousBottom - 1) {
        say(`part="${name}" (top ${box.top.toFixed(1)}) overlaps part="${previousName}"`
          + ` (bottom ${previousBottom.toFixed(1)})`);
      }
      if (box.height > 0) { previousBottom = box.bottom; previousName = name; }
    }

    // ── Every heading sits over its own column ──────────────────────────────
    //
    // This is the tier that owns the docs' "`detailed` variant shows line
    // numbers" claim. The line-number cell is in the markup of EVERY variant
    // and hidden by CSS outside `detailed`, which happy-dom cannot see and a
    // browser can: count only cells that were actually painted, and they must
    // come to one per heading in every variant.
    const headings = ([...sr.querySelectorAll('thead th')] as HTMLElement[])
      .filter(head => head.getClientRects().length > 0);
    const rows = exact('table-row');
    if (combo.items.length && !rows.length) say('the table renders no body rows');
    for (const [r, row] of rows.entries()) {
      const cells = ([...row.querySelectorAll('[part]')]
        .filter(el => tokens(el).includes('table-cell')) as HTMLElement[])
        .filter(cell => cell.getClientRects().length > 0);
      if (cells.length !== headings.length) {
        say(`row ${r} paints ${cells.length} cells under ${headings.length} headings`);
        continue;
      }
      for (const [c, cell] of cells.entries()) {
        const head = rect(headings[c]);
        const box = rect(cell);
        const centre = box.left + box.width / 2;
        if (centre < head.left - EPS || centre > head.right + EPS) {
          say(`row ${r} cell ${c} (centre ${centre.toFixed(1)}) is not under heading`
            + ` "${headings[c].textContent?.trim()}" [${head.left.toFixed(1)},${head.right.toFixed(1)}]`);
        }
      }
    }

    // ── The summary rows ────────────────────────────────────────────────────
    const summary = first('summary');
    const summaryRows = [
      ...exact('summary-row'), ...exact('discount-row'), ...exact('tax-row'), ...exact('total'),
    ].sort((a, b) => rect(a).top - rect(b).top);
    if (!summary) { say('no part="summary"'); return problems; }
    const summaryBox = rect(summary);
    const total = first('total');

    for (const [i, row] of summaryRows.entries()) {
      const label = [...row.querySelectorAll('[part]')]
        .find(el => tokens(el).includes('summary-label')) as HTMLElement | undefined;
      const value = [...row.querySelectorAll('[part]')]
        .find(el => tokens(el).includes('summary-value')) as HTMLElement | undefined;
      if (!label || !value) { say(`summary row ${i} is missing a label or a value`); continue; }
      const labelBox = rect(label);
      const valueBox = rect(value);
      if (valueBox.left < labelBox.right - EPS) {
        say(`summary row ${i}: the value (left ${valueBox.left.toFixed(1)}) runs into the`
          + ` label (right ${labelBox.right.toFixed(1)})`);
      }
      if (Math.abs(labelBox.top - valueBox.top) > labelBox.height) {
        say(`summary row ${i}: label and value are on different lines`);
      }
      if (summaryBox.right - valueBox.right > 24) {
        say(`summary row ${i}: the value stops`
          + ` ${(summaryBox.right - valueBox.right).toFixed(0)}px short of the summary's right edge`);
      }
    }

    // ── The total is the loudest row ────────────────────────────────────────
    if (!total) {
      say('no part="total"');
    } else if (summaryRows.length > 1) {
      const weightOf = (row: HTMLElement) => {
        const value = [...row.querySelectorAll('[part]')]
          .find(el => tokens(el).includes('summary-value')) as HTMLElement | undefined;
        return value ? Number(getComputedStyle(value).fontWeight) : 0;
      };
      const totalWeight = weightOf(total);
      const others = summaryRows.filter(row => row !== total).map(weightOf);
      if (!others.every(w => totalWeight >= w)) {
        say(`the total is lighter (${totalWeight}) than a row above it (${others})`);
      }
      // ── Nothing paints over the total ────────────────────────────────────
      const value = [...total.querySelectorAll('[part]')]
        .find(el => tokens(el).includes('summary-value')) as HTMLElement | undefined;
      if (value) {
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
    }

    // ── The status badge is a visible box inside the header ─────────────────
    const status = first('status');
    const header = first('header');
    if (!status) {
      say('no part="status"');
    } else if (header) {
      const box = rect(status);
      const headerBox = rect(header);
      if (box.width <= 0 || box.height <= 0) say(`the status badge is ${box.width}x${box.height}`);
      if (box.top < headerBox.top - EPS || box.bottom > headerBox.bottom + EPS) {
        say('the status badge escapes the header');
      }
    }

    // ── The QR block lands where qr-position says ──────────────────────────
    if (combo.showQr) {
      const qr = first('qr-container');
      if (!qr) {
        say('show-qr is set but no part="qr-container" was rendered');
      } else {
        const box = rect(qr);
        const hostBox = rect(host);
        if (box.width <= 0 || box.height <= 0) say(`the QR block is ${box.width}x${box.height}`);
        const centreX = box.left + box.width / 2;
        const midX = hostBox.left + hostBox.width / 2;
        if (combo.qrPosition === 'top-right' || combo.qrPosition === 'bottom-right') {
          if (centreX < midX) say(`qr-position=${combo.qrPosition} painted in the left half`);
        }
        if (combo.qrPosition === 'bottom-left' && centreX > midX) {
          say('qr-position=bottom-left painted in the right half');
        }
        if (combo.qrPosition === 'top-right') {
          const headerBox = header ? rect(header) : null;
          if (headerBox && box.top > headerBox.bottom) {
            say('qr-position=top-right painted below the header');
          }
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('invoice visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.rows, 'rendered line rows').toBe(combo.items.length);

      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('invoice visual matrix: the QR corners', () => {
  for (const combo of QR_COMBOS) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The half of the docs only a browser can check ───────────────────────────
//
// "`detailed` variant shows line numbers and per-item tax" is a claim about
// what is SHOWN, and the component honours it with `display: none` rather than
// with conditional markup — so the DOM tier cannot see either half of it and
// this tier owns the whole sentence, positive and negative.

test.describe('invoice visual matrix: line numbers and per-item tax', () => {
  const TAXED = [
    { description: 'Consulting', quantity: 5, unitPrice: 200, tax: 7 },
    { description: 'Training', quantity: 2, unitPrice: 350 },
  ];

  for (const variant of ['standard', 'modern', 'classic', 'minimal', 'detailed']) {
    test(`variant=${variant}`, async () => {
      await page.evaluate(v => (window as any).matrix.mount({
        variant: v, status: 'sent', taxRate: 0, discount: 0, currency: 'USD',
        items: [
          { description: 'Consulting', quantity: 5, unitPrice: 200, tax: 7 },
          { description: 'Training', quantity: 2, unitPrice: 350 },
        ],
      }), variant);

      const painted = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const shown = (selector: string) => [...sr.querySelectorAll(selector)]
          .filter(node => (node as HTMLElement).getClientRects().length > 0);
        return {
          lineNumbers: shown('.invoice__item-line-num').map(n => n.textContent?.trim()),
          itemTax: shown('.invoice__item-tax').map(n => n.textContent?.trim()),
        };
      });

      if (variant === 'detailed') {
        expect(painted.lineNumbers, 'the detailed variant shows line numbers')
          .toEqual(['1', '2']);
        expect(painted.itemTax, 'the detailed variant shows per-item tax')
          .toEqual(['Tax: 7%']);
      } else {
        expect(painted.lineNumbers, `variant=${variant} shows line numbers`).toEqual([]);
        expect(painted.itemTax, `variant=${variant} shows per-item tax`).toEqual([]);
      }
      expect(TAXED.length).toBe(2);
    });
  }
});

// ── LAYER 2: pinned pixel captures ──────────────────────────────────────────

test.describe('invoice visual matrix: marquee pixels', () => {
  test('the overdue status badge paints against the header', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'standard', status: 'overdue', taxRate: 8.25, discount: 0, currency: 'USD',
      items: [{ description: 'Web Development', quantity: 40, unitPrice: 150 }],
    }));

    const [badge, header] = await capture(
      page, '#subject', 'invoice-status-overdue',
      `(host) => {
        const sr = host.shadowRoot;
        const node = [...sr.querySelectorAll('[part]')]
          .find(el => (el.getAttribute('part') || '').split(/\\s+/).includes('status'));
        const box = node.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + box.width / 2, y: box.y - 8 },
        ];
      }`,
    );
    expect(sameColor(badge, header),
      `the overdue badge painted ${badge.join(',')}, identical to the header behind it`)
      .toBe(false);
  });

  test('the total line reads against the document surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'standard', status: 'sent', taxRate: 8.25, discount: 15, currency: 'USD',
      items: [
        { description: 'Web Development', quantity: 40, unitPrice: 150 },
        { description: 'Design Services', quantity: 10, unitPrice: 120 },
      ],
    }));

    // A single probe point lands wherever antialiasing put it, so the strip
    // below samples the whole width of the word "Total" and the contrast is
    // measured between its darkest and lightest pixels: that is the ink
    // against the paper it was printed on, whatever colour either one is.
    const strip = await capture(
      page, '#subject', 'invoice-total',
      `(host) => {
        const sr = host.shadowRoot;
        const total = [...sr.querySelectorAll('[part]')]
          .find(el => (el.getAttribute('part') || '').split(/\\s+/).includes('total'));
        const label = [...total.querySelectorAll('[part]')]
          .find(el => (el.getAttribute('part') || '').split(/\\s+/).includes('summary-label'));
        const box = label.getBoundingClientRect();
        const points = [];
        for (let i = 0; i <= 40; i++) {
          points.push({ x: box.x + (box.width * i) / 40, y: box.y + box.height / 2 });
        }
        return points;
      }`,
    );
    const luminances = strip.map(rgb => ({ rgb, l: rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 }));
    const darkest = luminances.reduce((a, b) => (a.l <= b.l ? a : b)).rgb;
    const lightest = luminances.reduce((a, b) => (a.l >= b.l ? a : b)).rgb;
    expect(contrast(darkest, lightest),
      `the word "Total" painted ink ${darkest.join(',')} on ${lightest.join(',')}`)
      .toBeGreaterThan(3);
  });
});
