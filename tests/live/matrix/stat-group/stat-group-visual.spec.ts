/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-stat-group TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/stat-group, `npm run test:matrix`)
 * owns structure truth: card count and order, the trend region's three pieces,
 * the `--sg-columns` pin, the `stat-click` detail. It deliberately asserts that
 * `variant` changes NOTHING structural — which leaves the entire meaning of
 * `variant` unverified, because a variant is pure CSS.
 *
 * That is this file's subject, together with the other two claims happy-dom
 * cannot check: that `columns` produces a real GRID, and that a trend really
 * paints in its direction's colour.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · `columns=N` puts exactly N cards on a row, at equal widths; `columns=0`
 *     is auto-fit — cards still tile without overlapping and stay in the host;
 *   · every card has a real box, no two cards overlap, and each card's centre
 *     hit-tests to the card (it is documented `role="button"`);
 *   · inside a card the label sits ABOVE the value and the trend BELOW it, and
 *     an icon sits beside the content rather than on top of it;
 *   · the three variants resolve to three distinct paint rules — `card` has a
 *     full border and its own surface, `minimal` has neither, `bordered` has a
 *     bottom rule only;
 *   · nothing occludes a value.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   `up` is green and `down` is red only if the pixels say so. The marquee
 *   decodes the PNG inside the browser under test.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/stat-group/matrix.html';

type Variant = 'card' | 'minimal' | 'bordered';

interface Stat {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
  color?: string;
}

interface Dataset { name: string; stats: Stat[] }

const DATASETS: Dataset[] = [
  {
    name: 'bare',
    stats: [
      { label: 'Revenue', value: '$45,231' },
      { label: 'Users', value: 2338 },
      { label: 'Orders', value: '1,245' },
      { label: 'Refunds', value: 12 },
    ],
  },
  {
    name: 'full',
    // Icon names come from the built-in SVG registry, never ligature names
    // ('trending_up' …): without an icon font a ligature paints as 150px of
    // raw text, which crushes `.stat__content` against `min-width: 0` — to
    // 0.2px in Chromium and a clean 0 in Firefox/WebKit. A registry icon is
    // a 24px SVG in every engine, so what this tier measures is the card's
    // layout, not the host page's font set.
    stats: [
      { label: 'Revenue', value: '$45,231', trend: 'up', trendValue: '+12.5%', icon: 'arrow-trending-up' },
      { label: 'Users', value: 2338, trend: 'down', trendValue: '-3.1%' },
      { label: 'Orders', value: '1,245', trend: 'neutral', trendValue: '0.0%', icon: 'chart-bar' },
      { label: 'Refunds', value: 12, icon: 'banknotes', color: 'rgb(220, 38, 38)' },
    ],
  },
];

const VARIANTS: Variant[] = ['card', 'minimal', 'bordered'];
const COLUMNS = [0, 1, 2, 4] as const;

interface Combo { id: string; variant: Variant; columns: number; dataset: Dataset }

/**
 * 3 variants x 4 column settings x 2 datasets — 24 combos. Sized to a
 * component whose documented visual surface is one grid and three skins; the
 * point of this tier is that each of them meets a real layout engine, not that
 * the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const columns of COLUMNS) {
      for (const dataset of DATASETS) {
        combos.push({
          id: `${variant}/columns=${columns}/${dataset.name}`,
          variant, columns, dataset,
        });
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
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning EVERY violation at once. */
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
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partsIn = (root: ParentNode, name: string) =>
      [...root.querySelectorAll('[part]')].filter(node => tokens(node).includes(name)) as HTMLElement[];

    const hostBox = rect(host);
    const cards = partsIn(sr, 'stat');
    if (cards.length !== combo.dataset.stats.length) {
      say(`${cards.length} cards, expected ${combo.dataset.stats.length}`);
      return problems;
    }

    // ── The grid: rows, counts, and equal widths ─────────────────────────────
    const boxes = cards.map(rect);
    const rows: DOMRect[][] = [];
    for (const box of boxes) {
      const row = rows.find(r => Math.abs(r[0].top - box.top) < 2);
      if (row) row.push(box); else rows.push([box]);
    }

    if (combo.columns > 0) {
      // `columns=N` is a pinned column count: every row except the last holds
      // exactly N cards, and the last holds the remainder.
      const expectedRows = Math.ceil(boxes.length / combo.columns);
      if (rows.length !== expectedRows) {
        say(`columns=${combo.columns} produced ${rows.length} rows for ${boxes.length} cards,`
          + ` expected ${expectedRows}`);
      }
      rows.forEach((row, i) => {
        const want = i === rows.length - 1
          ? boxes.length - combo.columns * (rows.length - 1)
          : combo.columns;
        if (row.length !== want) say(`row ${i} holds ${row.length} cards, expected ${want}`);
      });
    }

    // Cards on a row are equal-width tracks (`minmax(10rem, 1fr)`), whatever
    // the column setting.
    for (const [i, row] of rows.entries()) {
      const widths = row.map(box => box.width);
      const spread = Math.max(...widths) - Math.min(...widths);
      if (spread > 1) say(`row ${i} card widths differ by ${spread.toFixed(1)}px: ${widths.map(w => w.toFixed(0))}`);
    }

    // No two cards may overlap, and none may leave the host.
    for (let i = 0; i < boxes.length; i++) {
      const a = boxes[i];
      if (a.width <= 0 || a.height <= 0) { say(`card ${i} renders at ${a.width}x${a.height}`); continue; }
      if (a.left < hostBox.left - EPS || a.right > hostBox.right + EPS) {
        say(`card ${i} (${a.left.toFixed(0)}..${a.right.toFixed(0)}) escapes the group`
          + ` (${hostBox.left.toFixed(0)}..${hostBox.right.toFixed(0)})`);
      }
      for (let j = i + 1; j < boxes.length; j++) {
        const b = boxes[j];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > EPS && overlapY > EPS) {
          say(`cards ${i} and ${j} overlap by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}px`);
        }
      }
    }

    // ── The variant's paint ──────────────────────────────────────────────────
    const cardStyle = getComputedStyle(cards[0]);
    const borderTop = parseFloat(cardStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(cardStyle.borderBottomWidth) || 0;
    const opaque = cardStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
      && cardStyle.backgroundColor !== 'transparent';
    if (combo.variant === 'card') {
      if (borderTop <= 0) say(`variant="card" cards have no border (border-top ${cardStyle.borderTopWidth})`);
      if (!opaque) say('variant="card" cards have a transparent background — they are not cards');
      if ((parseFloat(cardStyle.borderTopLeftRadius) || 0) <= 0) {
        say(`variant="card" cards have border-radius ${cardStyle.borderTopLeftRadius}`);
      }
    }
    if (combo.variant === 'minimal') {
      if (borderTop > 0 || borderBottom > 0) {
        say(`variant="minimal" cards are bordered (${cardStyle.borderTopWidth}/${cardStyle.borderBottomWidth})`);
      }
      if (opaque) say(`variant="minimal" cards paint a background (${cardStyle.backgroundColor})`);
    }
    if (combo.variant === 'bordered') {
      if (borderBottom <= 0) say(`variant="bordered" cards have no bottom rule (${cardStyle.borderBottomWidth})`);
      if (borderTop > 0) say(`variant="bordered" cards carry a full border (top ${cardStyle.borderTopWidth})`);
      if (opaque) say(`variant="bordered" cards paint a background (${cardStyle.backgroundColor})`);
    }

    // ── Inside a card ────────────────────────────────────────────────────────
    for (const [i, card] of cards.entries()) {
      const stat = combo.dataset.stats[i];
      const label = card.querySelector('.stat__label') as HTMLElement | null;
      const value = card.querySelector('.stat__value') as HTMLElement | null;
      const trend = card.querySelector('.stat__trend') as HTMLElement | null;
      const icon = card.querySelector('.stat__icon') as HTMLElement | null;
      if (!label || !value) { say(`card ${i} paints no label/value pair`); continue; }

      const labelBox = rect(label);
      const valueBox = rect(value);
      if (valueBox.height <= 0 || valueBox.width <= 0) {
        say(`card ${i} value renders at ${valueBox.width}x${valueBox.height}`);
        continue;
      }
      if (valueBox.top < labelBox.bottom - EPS) {
        say(`card ${i} value (top ${valueBox.top.toFixed(1)}) is not below its label`
          + ` (bottom ${labelBox.bottom.toFixed(1)})`);
      }
      // The value is the loudest thing in a stat card: it must out-size the label.
      const labelSize = parseFloat(getComputedStyle(label).fontSize);
      const valueSize = parseFloat(getComputedStyle(value).fontSize);
      if (valueSize <= labelSize) {
        say(`card ${i} value font-size ${valueSize} does not exceed the label's ${labelSize}`);
      }

      if (trend) {
        const trendBox = rect(trend);
        if (trendBox.height <= 0) say(`card ${i} trend region renders at height ${trendBox.height}`);
        if (trendBox.top < valueBox.bottom - EPS) {
          say(`card ${i} trend (top ${trendBox.top.toFixed(1)}) is not below the value`
            + ` (bottom ${valueBox.bottom.toFixed(1)})`);
        }
        // Direction colour, from the computed cascade.
        const colour = getComputedStyle(trend).color;
        const [r, g, b] = colour.match(/\d+/g)!.map(Number);
        if (stat.trend === 'up' && !(g > r + 20 && g > b + 20)) {
          say(`card ${i} trend="up" paints ${colour}, which is not a positive/green tone`);
        }
        if (stat.trend === 'down' && !(r > g + 20 && r > b + 20)) {
          say(`card ${i} trend="down" paints ${colour}, which is not a negative/red tone`);
        }
        if (stat.trend === 'neutral' && (Math.abs(r - g) > 20 || Math.abs(g - b) > 20)) {
          say(`card ${i} trend="neutral" paints ${colour}, which is not a neutral tone`);
        }
      }

      if (icon) {
        const iconBox = rect(icon);
        if (iconBox.width <= 0 || iconBox.height <= 0) {
          say(`card ${i} declares an icon but it renders at ${iconBox.width}x${iconBox.height}`);
        } else {
          const overlapX = Math.min(iconBox.right, valueBox.right) - Math.max(iconBox.left, valueBox.left);
          const overlapY = Math.min(iconBox.bottom, valueBox.bottom) - Math.max(iconBox.top, valueBox.top);
          if (overlapX > EPS && overlapY > EPS) say(`card ${i} icon overlaps the value`);
        }
      }

      // Occlusion + hit-testability: the card is documented `role="button"`, so
      // a pointer aimed at it has to reach it.
      const centre = { x: rect(card).left + rect(card).width / 2, y: rect(card).top + rect(card).height / 2 };
      const outer = document.elementFromPoint(centre.x, centre.y);
      if (outer !== host) {
        say(`card ${i} centre hit-tests to <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the group`);
      } else {
        const hit = (sr as any).elementFromPoint(centre.x, centre.y) as Element | null;
        if (hit !== card && !card.contains(hit as Node)) {
          say(`card ${i} centre is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
      const vy = valueBox.top + valueBox.height / 2;
      for (const fraction of [0.25, 0.75]) {
        const vx = valueBox.left + valueBox.width * fraction;
        if (document.elementFromPoint(vx, vy) !== host) continue;
        const hit = (sr as any).elementFromPoint(vx, vy) as Element | null;
        if (hit !== value && !value.contains(hit as Node) && !(hit as Element)?.contains(value)) {
          say(`card ${i} value @${Math.round(fraction * 100)}% is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('stat-group visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c),
        { variant: combo.variant, columns: combo.columns, stats: combo.dataset.stats } as any,
      );
      expect(mounted.cards).toBe(combo.dataset.stats.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 already measured the model the browser built; these
// two exist because "the trend has color: green in the cascade" and "the trend
// is green on screen" are different claims, and only pixels tell them apart.

test.describe('stat-group visual matrix: marquee pixels', () => {
  test('up and down trends paint in different colours, and neither is the value colour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'card',
      columns: 2,
      stats: [
        { label: 'Up', value: '1', trend: 'up', trendValue: '▲▲▲▲' },
        { label: 'Down', value: '1', trend: 'down', trendValue: '▼▼▼▼' },
      ],
    }));
    // Nine probes across each glyph run, not one: the centre of a text box can
    // easily land in the gap BETWEEN two glyphs, where the paint is the card's
    // surface and the reading says nothing about the trend's colour. The most
    // saturated pixel of the run is the stable answer to "what colour is this
    // text", where any single point is not.
    const PROBES = 9;
    const pixels = await capture(
      page, '#subject', 'stat-group-trends',
      `(host) => {
        const cards = [...host.shadowRoot.querySelectorAll('[part]')]
          .filter(n => (n.getAttribute('part') || '').split(/\\s+/).includes('stat'));
        const run = (card, selector) => {
          const b = card.querySelector(selector).getBoundingClientRect();
          return Array.from({ length: ${PROBES} }, (_, i) => ({
            x: b.x + (b.width * (i + 0.5)) / ${PROBES},
            y: b.y + b.height / 2,
          }));
        };
        return [
          ...run(cards[0], '.stat__trend-value'),
          ...run(cards[1], '.stat__trend-value'),
          ...run(cards[0], '.stat__value'),
        ];
      }`,
    );
    const boldest = (from: number) => pixels.slice(from, from + PROBES)
      .reduce((best, p) => {
        const spread = (rgb: number[]) => Math.max(...rgb) - Math.min(...rgb);
        return spread(p) > spread(best) ? p : best;
      });
    const up = boldest(0);
    const down = boldest(PROBES);
    const value = boldest(PROBES * 2);
    expect(sameColor(up, down),
      `up and down trends both painted ${up.join(',')}`).toBe(false);
    // A rising trend is green and a falling one is red — the one thing the two
    // glyphs are for. Channel dominance, not an exact triple, because the glyph
    // edge is anti-aliased.
    expect(up[1] > up[0] && up[1] > up[2],
      `trend="up" painted rgb(${up.join(',')}), which is not green-dominant`).toBe(true);
    expect(down[0] > down[1] && down[0] > down[2],
      `trend="down" painted rgb(${down.join(',')}), which is not red-dominant`).toBe(true);
    expect(sameColor(up, value),
      `the trend painted the same colour as the value (${value.join(',')})`).toBe(false);
  });

  test('a card variant paints a surface the page behind it does not', async () => {
    // `variant="card"` promises a CARD: a surface plus a border. Both can be
    // present in the cascade and invisible on a page of the same colour, which
    // is why the fixture sits on the secondary surface and this probe compares
    // the two.
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'card',
      columns: 2,
      stats: [{ label: 'Revenue', value: '$45,231' }, { label: 'Users', value: 2338 }],
    }));
    const [inside, gap] = await capture(
      page, '#stage', 'stat-group-card-surface',
      `() => {
        const host = document.getElementById('subject');
        const cards = [...host.shadowRoot.querySelectorAll('[part]')]
          .filter(n => (n.getAttribute('part') || '').split(/\\s+/).includes('stat'));
        const a = cards[0].getBoundingClientRect();
        const b = cards[1].getBoundingClientRect();
        return [
          // Inside the first card, clear of any glyph.
          { x: a.right - 6, y: a.bottom - 6 },
          // The grid gap between the two cards — the page, not the card.
          { x: (a.right + b.left) / 2, y: a.top + a.height / 2 },
        ];
      }`,
    );
    expect(sameColor(inside, gap),
      `the card surface (${inside.join(',')}) is the same colour as the page behind it`).toBe(false);
  });
});
