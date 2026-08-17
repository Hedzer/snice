/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-kpi TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/kpi, `npm run test:matrix`) owns structure
 * truth: which parts exist for which inputs, what the label and value read,
 * which series the sparkline was handed. It cannot own visual truth, because
 * happy-dom performs no layout and paints nothing — and a KPI tile is read at a
 * glance, so its truth is almost entirely layout and colour:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the tile is a real box that contains every part it renders;
 *   · the documented reading order is the painted order — the `before` slot,
 *     then label above value, the trend beside them, the sparkline below, then
 *     the `after` slot;
 *   · `sentiment` paints its documented colour ("up: Green", "down: Red",
 *     "neutral: Gray") on the trend, and the three are mutually distinguishable
 *     — the accessibility section promises "color + icon differentiation", so
 *     three sentiments that paint the same colour would be one sentiment;
 *   · `colorValue` really moves that colour onto the value, and its absence
 *     really leaves the value in the ordinary text colour;
 *   · `size` is a real scale: the value grows from small to medium to large;
 *   · nothing occludes the value (elementFromPoint lands inside it).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A value that "has a color" can still be unreadable on the tile it sits on,
 *   and a sparkline with a correct series can still paint nothing. The marquee
 *   captures decode the PNG inside the browser under test and assert contrast
 *   and paint.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/kpi/matrix.html';

type Sentiment = 'up' | 'down' | 'neutral';
type Size = 'small' | 'medium' | 'large';

interface Combo {
  id: string;
  label: string;
  value: string;
  sentiment?: Sentiment;
  trendValue?: string;
  size: Size;
  colorValue: boolean;
  showSparkline: boolean;
  trendData?: number[];
  slotBefore: boolean;
  slotAfter: boolean;
}

const SENTIMENTS: Array<Sentiment | undefined> = [undefined, 'up', 'down', 'neutral'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const SERIES = [20, 25, 22, 30, 28, 35, 32];

/**
 * The cross: sentiment (including none) x size x series-present — 24 combos,
 * the dimensions that change what is painted and in what colour — with
 * `colorValue`, `showSparkline`, the trend text and the two slots rotated
 * across them. Mid-range, per .ai/fuzzing.md: a KPI is a composition of five
 * small blocks, not a data component.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const sentiment of SENTIMENTS) {
    for (const size of SIZES) {
      for (const hasSeries of [false, true]) {
        const colorValue = n % 3 === 0;
        const showSparkline = n % 5 !== 4;
        combos.push({
          id: `${sentiment ?? 'no-sentiment'}/${size}/${hasSeries ? 'series' : 'no-series'}`
            + `/[${colorValue ? 'color-value,' : ''}${showSparkline ? 'sparkline' : 'sparkline-off'}]`,
          label: 'Monthly Revenue',
          value: '$54,239',
          sentiment,
          trendValue: n % 2 === 0 ? '+12.5%' : undefined,
          size, colorValue, showSparkline,
          trendData: hasSeries ? SERIES : undefined,
          slotBefore: n % 4 === 1,
          slotAfter: n % 6 === 2,
        });
        n++;
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
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
    const partsNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const container = partsNamed('container')[0];
    if (!container) { say('no part="container" rendered'); return problems; }
    const tile = rect(container);
    if (tile.width <= 0 || tile.height <= 0) {
      say(`the tile renders at ${tile.width}x${tile.height}`);
      return problems;
    }
    // The tile paints its own surface: a transparent card is not a card.
    const tileCs = getComputedStyle(container);
    if (tileCs.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('the tile has a transparent background');
    }

    const label = partsNamed('label')[0];
    const value = partsNamed('value')[0];
    if (!label || !value) { say('the tile is missing its label or value'); return problems; }
    const labelBox = rect(label);
    const valueBox = rect(value);
    for (const [name, box] of [['label', labelBox], ['value', valueBox]] as const) {
      if (box.width <= 0 || box.height <= 0) say(`part="${name}" renders at ${box.width}x${box.height}`);
    }

    // ── The documented reading order, as painted ────────────────────────────
    if (valueBox.top < labelBox.top - EPS) {
      say(`the value paints above its label (${valueBox.top.toFixed(0)} <`
        + ` ${labelBox.top.toFixed(0)})`);
    }
    for (const [name, box] of [['label', labelBox], ['value', valueBox]] as const) {
      if (box.left < tile.left - EPS || box.right > tile.right + EPS
        || box.top < tile.top - EPS || box.bottom > tile.bottom + EPS) {
        say(`part="${name}" spills outside the tile`);
      }
    }

    // ── The trend block ──────────────────────────────────────────────────────
    const trend = partsNamed('trend')[0];
    const wantsTrend = combo.sentiment !== undefined || combo.trendValue !== undefined;
    if (wantsTrend && !trend) {
      say('a trend was given but no part="trend" was painted');
    }
    if (trend) {
      const trendBox = rect(trend);
      if (trendBox.width <= 0 || trendBox.height <= 0) {
        say(`part="trend" renders at ${trendBox.width}x${trendBox.height}`);
      }
      // The header is a row: the trend sits beside the label/value block, not
      // over it. Overlap here is the failure a DOM test cannot see.
      if (trendBox.left < valueBox.right - EPS && trendBox.top < valueBox.bottom - EPS
        && trendBox.bottom > valueBox.top + EPS) {
        say('the trend block overlaps the value');
      }
      const icon = partsNamed('trend-icon')[0];
      if (combo.sentiment && icon) {
        const iconBox = rect(icon);
        if (iconBox.width <= 0 || iconBox.height <= 0) {
          say(`the ${combo.sentiment} arrow renders at ${iconBox.width}x${iconBox.height}`);
        }
        if (iconBox.left < trendBox.left - EPS || iconBox.right > trendBox.right + EPS) {
          say('the arrow paints outside its trend block');
        }
      }
    }

    // ── colorValue: the sentiment colour, on the value ──────────────────────
    const valueColor = getComputedStyle(value).color;
    if (trend) {
      const trendColor = getComputedStyle(trend).color;
      if (combo.colorValue && combo.sentiment && valueColor !== trendColor) {
        say(`colorValue with sentiment="${combo.sentiment}" left the value ${valueColor}`
          + ` while the trend paints ${trendColor}`);
      }
      if (!combo.colorValue && combo.sentiment && valueColor === trendColor
        && combo.sentiment !== 'neutral') {
        say(`colorValue is off but the value already paints the sentiment colour ${valueColor}`);
      }
    }

    // ── The sparkline ────────────────────────────────────────────────────────
    const sparkline = partsNamed('sparkline')[0];
    const wantsSparkline = combo.showSparkline && !!combo.trendData;
    if (wantsSparkline && !sparkline) {
      say('a series was given but no part="sparkline" was painted');
    }
    if (!wantsSparkline && sparkline) {
      say('a sparkline was painted with no series to draw');
    }
    if (sparkline) {
      const sparkBox = rect(sparkline);
      if (sparkBox.width <= 0 || sparkBox.height <= 0) {
        say(`part="sparkline" renders at ${sparkBox.width}x${sparkBox.height}`);
      }
      if (sparkBox.top < valueBox.bottom - EPS) {
        say('the sparkline paints over the value block');
      }
      // The chart is its own custom element, so its <svg> lives one shadow
      // boundary further down — `querySelector('svg')` on the part would always
      // come back empty and the check would be vacuous.
      const chart = sparkline.querySelector('snice-sparkline');
      const svg = chart?.shadowRoot?.querySelector('svg') ?? sparkline.querySelector('svg');
      if (!chart) {
        say('part="sparkline" holds no <snice-sparkline>');
      } else if (!svg) {
        say('the sparkline chart painted no svg');
      } else if (rect(svg).width <= 0 || rect(svg).height <= 0) {
        say(`the sparkline chart renders at ${rect(svg).width}x${rect(svg).height}`);
      }
    }

    // ── The documented slots, in the documented positions ───────────────────
    const before = host.querySelector('[data-probe="before"]') as HTMLElement | null;
    const after = host.querySelector('[data-probe="after"]') as HTMLElement | null;
    if (combo.slotBefore) {
      if (!before) say('the before slot content never rendered');
      else {
        const box = rect(before);
        if (box.width <= 0 || box.height <= 0) say('the before content has no box');
        // "before — Content before label/value".
        if (box.top > labelBox.top + EPS) say('the before content paints below the label');
      }
    }
    if (combo.slotAfter && after) {
      const box = rect(after);
      if (box.width <= 0 || box.height <= 0) say('the after content has no box');
      // "after — Content after sparkline".
      if (box.top < valueBox.bottom - EPS) say('the after content paints above the value');
    }

    // ── Occlusion: the value is what the cursor would touch ─────────────────
    for (const fraction of [0.2, 0.8]) {
      const x = valueBox.left + valueBox.width * fraction;
      const y = valueBox.top + valueBox.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`value @${Math.round(fraction * 100)}%: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the kpi`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== value && !value.contains(hit as Node)) {
        say(`the value is occluded at ${Math.round(fraction * 100)}% by`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('kpi visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted).toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('kpi visual matrix: the documented sentiment colours', () => {
  // "up — Green, arrow up / down — Red, arrow down / neutral — Gray, arrow
  // right". Three sentiments painted in one colour would be one sentiment.
  test('up, down and neutral paint three distinct colours', async () => {
    const colors = new Map<Sentiment, string>();
    for (const sentiment of ['up', 'down', 'neutral'] as Sentiment[]) {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { label: 'L', value: '1', sentiment, trendValue: '+1%', size: 'medium' } as any);
      colors.set(sentiment, await page.evaluate(() => {
        const trend = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="trend"]')!;
        return getComputedStyle(trend).color;
      }));
    }
    expect(new Set(colors.values()).size,
      `sentiments share a colour: ${[...colors].map(([k, v]) => `${k}=${v}`).join(', ')}`).toBe(3);

    // The documented hues, checked as channel dominance rather than exact
    // triples: the theme owns the shade, the component owns which way it leans.
    const rgb = (value: string) => (value.match(/\d+/g) ?? []).map(Number);
    const [ur, ug, ub] = rgb(colors.get('up')!);
    expect(ug > ur && ug > ub, `"up" paints ${colors.get('up')}, which is not green`).toBe(true);
    const [dr, dg, db] = rgb(colors.get('down')!);
    expect(dr > dg && dr > db, `"down" paints ${colors.get('down')}, which is not red`).toBe(true);
  });
});

test.describe('kpi visual matrix: the documented size scale', () => {
  test('the value grows from small to medium to large', async () => {
    const sizes: number[] = [];
    for (const size of SIZES) {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { label: 'L', value: '$54,239', size } as any);
      sizes.push(await page.evaluate(() => {
        const value = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="value"]')!;
        return parseFloat(getComputedStyle(value).fontSize);
      }));
    }
    expect(sizes[0], `small=${sizes[0]} medium=${sizes[1]}`).toBeLessThan(sizes[1]);
    expect(sizes[1], `medium=${sizes[1]} large=${sizes[2]}`).toBeLessThan(sizes[2]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the value has a colour" and "the value is readable" are
// different claims, and only pixels can tell them apart.

test.describe('kpi visual matrix: marquee pixels', () => {
  test('the value is legible against the tile it sits on', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      label: 'Monthly Revenue', value: '$54,239', size: 'large',
    }));
    // Sampled as a strip: the centre of a text box regularly lands between two
    // glyphs, and one probe there would measure the tile and call the value
    // invisible.
    const pixels = await capture(
      page, '#subject', 'kpi-value',
      `(host) => {
        const sr = host.shadowRoot;
        const box = sr.querySelector('[part~="value"]').getBoundingClientRect();
        const tile = sr.querySelector('[part~="container"]').getBoundingClientRect();
        const points = Array.from({ length: 24 }, (_, i) => ({
          x: box.x + box.width * ((i + 0.5) / 24),
          y: box.y + box.height * 0.6,
        }));
        points.push({ x: tile.x + tile.width - 4, y: tile.y + 4 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const best = Math.max(...pixels.slice(0, 24).map(p => contrast(p, surface)));
    expect(best, `value contrast against its tile is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('an up trend and a down trend paint visibly different pixels', async () => {
    const painted: Record<string, number[]> = {};
    for (const sentiment of ['up', 'down'] as const) {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        label: 'Revenue', value: '$1', sentiment, trendValue: '+12.5%', size: 'large',
      } as any);
      // The trend block paints a tinted background behind its arrow; probing
      // its own field (not the glyph) is the stable read.
      const [field] = await capture(
        page, '#subject', `kpi-trend-${sentiment}`,
        `(host) => {
          const box = host.shadowRoot.querySelector('[part~="trend"]').getBoundingClientRect();
          return [{ x: box.x + box.width - 3, y: box.y + 3 }];
        }`,
      );
      painted[sentiment] = field;
    }
    expect(sameColor(painted.up as any, painted.down as any),
      `up and down both painted ${painted.up.join(',')}`).toBe(false);
  });

  test('a sparkline paints a line inside its box', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      label: 'Weekly Sales', value: '$28,450', sentiment: 'up', trendValue: '+15.3%',
      size: 'large', trendData: [20, 25, 22, 30, 28, 35, 32],
    }));
    // A GRID over the chart's own box, not a handful of points: the line is two
    // pixels thick and wanders, so a sparse probe can miss it everywhere and
    // call a perfectly good chart blank. A chart that drew nothing reads one
    // flat colour across the whole grid.
    const pixels = await capture(
      page, '#subject', 'kpi-sparkline',
      `(host) => {
        const chart = host.shadowRoot.querySelector('[part~="sparkline"] snice-sparkline');
        const svg = chart.shadowRoot.querySelector('svg');
        const box = svg.getBoundingClientRect();
        const points = [];
        for (let ix = 0; ix < 20; ix++) {
          for (let iy = 0; iy < 12; iy++) {
            points.push({
              x: box.x + box.width * ((ix + 0.5) / 20),
              y: box.y + box.height * ((iy + 0.5) / 12),
            });
          }
        }
        return points;
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `the sparkline box painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
    // The ink must also be the sentiment's own colour, not a grey default: an
    // "up" series is documented to draw in the success colour.
    const green = pixels.filter(([r, g, b]) => g > r + 20 && g > b + 20);
    expect(green.length, 'the up-sentiment sparkline painted no green ink').toBeGreaterThan(0);
  });
});
