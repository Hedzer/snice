/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-chart TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * For this component the browser tier is not a supplement — it is the ONLY tier
 * that can see the chart at all. snice-chart paints into a `<canvas>`, and
 * happy-dom has no 2D context: the component's own `initAndDrawChart` returns
 * before drawing a single mark. The DOM matrix
 * (tests/matrix/chart) therefore owns the shell — parts, legend,
 * a11y summary, the seven documented methods — and everything below owns the
 * picture.
 *
 * ── Layer 1 (every combo): geometry + canvas ink + occlusion + style ────────
 *   · the canvas has a real box, and its BACKING STORE matches the box it was
 *     given — a canvas whose `width` attribute and CSS width disagree paints a
 *     blurred, mis-scaled chart that no DOM test can see;
 *   · the canvas actually contains INK. The share of non-transparent pixels is
 *     read out of the component's own canvas, by the engine that painted it, so
 *     "the chart rendered" stops being an inference from the DOM;
 *   · every documented legend position really places the legend on that side of
 *     the canvas (`top`/`bottom`/`left`/`right`), which is a pure CSS claim and
 *     invisible to the DOM tier;
 *   · every legend entry is hit-testable at its own centre — a legend that
 *     cannot be clicked cannot toggle a dataset, which is a documented feature;
 *   · legend swatches paint a real, visible colour.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Small on purpose. These answer what even the canvas read-back cannot: that
 *   the ink is on screen rather than clipped away, and that it contrasts with
 *   the surface behind it.
 */
import { test, expect, type Page } from '@playwright/test';
import { openChartStage, mount } from '../chart-visual-support';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/chart/matrix.html';

const DATASETS = [
  { label: 'Sales', data: [12, 19, 15, 25], borderColor: '#2196f3' },
  { label: 'Costs', data: [8, 11, 9, 14], borderColor: '#e91e63' },
];
const LABELS = ['Jan', 'Feb', 'Mar', 'Apr'];

const TYPES = [
  'line', 'bar', 'horizontal-bar', 'area', 'pie', 'donut',
  'scatter', 'bubble', 'radar', 'mixed',
] as const;
const POSITIONS = ['top', 'bottom', 'left', 'right', 'none'] as const;

interface Combo {
  id: string;
  type: typeof TYPES[number];
  position: typeof POSITIONS[number];
}

/**
 * The full 10 x 5 cross: every documented chart type against every documented
 * legend position. Sized to the component — chart is one of the library's
 * complex components, the ten types take three separate drawing paths, and the
 * legend positions are four different flex arrangements around the canvas. That
 * is exactly 50 different pictures, and each is worth a browser once.
 */
const COMBOS: Combo[] = TYPES.flatMap(type =>
  POSITIONS.map(position => ({ id: `${type}/legend=${position}`, type, position })));

/** Animation off everywhere in layer 1: a half-drawn chart is not a chart. */
function optionsFor(position: Combo['position']) {
  return {
    legend: { position, clickable: true },
    animation: { enabled: false },
    xAxis: { grid: true },
    yAxis: { grid: true },
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await openChartStage(browser, FIXTURE);
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
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const named = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const base = named('base')[0];
    const canvasHost = named('canvas')[0];
    const legend = named('legend')[0];
    const canvas = sr.querySelector('.chart-render-canvas') as HTMLCanvasElement | null;

    if (!base) { say('no part="base" painted'); return problems; }
    if (!canvasHost) say('no part="canvas" painted');
    if (!canvas) { say('no <canvas> painted'); return problems; }

    // ── The canvas has a real, correctly-scaled box ──────────────────────────
    const cb = rect(canvas);
    if (cb.width <= 0 || cb.height <= 0) {
      say(`canvas renders at ${cb.width}x${cb.height}`);
      return problems;
    }
    if (cb.width < 80 || cb.height < 80) {
      say(`canvas is only ${cb.width.toFixed(0)}x${cb.height.toFixed(0)} — too small to be a chart`);
    }
    // The backing store must match the box, or every mark is drawn at the wrong
    // scale. This is the defect a DOM test structurally cannot see.
    if (Math.abs(canvas.width - cb.width) > 2 || Math.abs(canvas.height - cb.height) > 2) {
      say(`canvas backing store ${canvas.width}x${canvas.height} does not match its`
        + ` painted box ${cb.width.toFixed(0)}x${cb.height.toFixed(0)}`);
    }

    const canvasCs = getComputedStyle(canvas);
    if (canvasCs.visibility !== 'visible') say(`canvas visibility "${canvasCs.visibility}"`);
    if (Number(canvasCs.opacity) <= 0) say(`canvas opacity "${canvasCs.opacity}"`);

    // ── The canvas contains INK ──────────────────────────────────────────────
    // Read from the component's own canvas by the engine that painted it. A
    // chart that laid out perfectly and drew nothing is the single most likely
    // silent failure of a canvas component, and this is the only check for it.
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      say('the canvas has no 2D context in a real browser');
    } else {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let inked = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 8) inked++;
      const ratio = inked / (canvas.width * canvas.height);
      if (ratio <= 0.002) {
        say(`the canvas is blank — only ${(ratio * 100).toFixed(3)}% of its pixels are painted`);
      }
      if (ratio > 0.98) {
        say(`the canvas is entirely filled (${(ratio * 100).toFixed(1)}%) — the chart is a solid block`);
      }
    }

    // ── The chart stays inside the box it was given ──────────────────────────
    const baseBox = rect(base);
    if (cb.left < baseBox.left - EPS || cb.right > baseBox.right + EPS
      || cb.top < baseBox.top - EPS || cb.bottom > baseBox.bottom + EPS) {
      say('the canvas escapes part="base"');
    }

    // ── The documented legend positions are real placements ─────────────────
    if (combo.position === 'none') {
      if (legend) say('legend position "none" still painted a legend');
    } else if (!legend) {
      say(`legend position "${combo.position}" painted no legend`);
    } else {
      const lb = rect(legend);
      if (lb.width <= 0 || lb.height <= 0) {
        say(`legend renders at ${lb.width}x${lb.height}`);
      } else {
        const placed = {
          top: lb.bottom <= cb.top + EPS,
          bottom: lb.top >= cb.bottom - EPS,
          left: lb.right <= cb.left + EPS,
          right: lb.left >= cb.right - EPS,
        }[combo.position];
        if (!placed) {
          say(`legend position "${combo.position}" put the legend at`
            + ` (${lb.left.toFixed(0)},${lb.top.toFixed(0)} ${lb.width.toFixed(0)}x${lb.height.toFixed(0)})`
            + ` against a canvas at (${cb.left.toFixed(0)},${cb.top.toFixed(0)}`
            + ` ${cb.width.toFixed(0)}x${cb.height.toFixed(0)})`);
        }
      }

      // Every legend entry is reachable and paints a visible swatch. The doc
      // calls legend entries clickable, so an unreachable one is a broken
      // feature however correct its DOM is.
      const items = [...sr.querySelectorAll('.legend-item')] as HTMLElement[];
      if (items.length !== 2) say(`${items.length} legend entries, expected 2`);
      items.forEach((item, i) => {
        const ib = rect(item);
        if (ib.width <= 0 || ib.height <= 0) {
          say(`legend entry ${i} renders at ${ib.width}x${ib.height}`);
          return;
        }
        const hit = (sr as any).elementFromPoint(
          ib.left + ib.width / 2, ib.top + ib.height / 2) as Element | null;
        if (hit !== item && !item.contains(hit as Node)) {
          say(`legend entry ${i} is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}`
            + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
        }
        const swatch = item.querySelector('.legend-color') as HTMLElement | null;
        if (!swatch) { say(`legend entry ${i} has no colour swatch`); return; }
        const sb = rect(swatch);
        if (sb.width <= 0 || sb.height <= 0) say(`legend swatch ${i} renders at ${sb.width}x${sb.height}`);
        const swatchBg = getComputedStyle(swatch).backgroundColor;
        if (swatchBg === 'rgba(0, 0, 0, 0)') say(`legend swatch ${i} is transparent`);
        const labelCs = getComputedStyle(item.querySelector('.legend-label')!);
        if (parseFloat(labelCs.fontSize) < 9) say(`legend label ${i} font-size ${labelCs.fontSize}`);
      });
    }

    return problems;
  }, combo as any);
}

/**
 * ── FINDINGS ────────────────────────────────────────────────────────────────
 *
 * Both of these are divergences from `docs/ai/components/chart.md` that ONLY a
 * browser can see, which is exactly what this tier exists for. Per
 * `.ai/fuzzing.md` the assertions above are NOT weakened and the component is
 * NOT changed: the affected combos keep asserting the documented behaviour and
 * are marked `test.fail`, so they start failing the day the component is fixed.
 */
const FINDINGS = {
  /**
   * Doc `legend.position: 'top' | 'bottom'` places the legend above or below
   * the plot — the legend takes a row of the container and the chart keeps the
   * rest. The canvas is instead sized from the HOST's box
   * (`this.height || this.offsetHeight || 400`) and knows nothing about the row
   * the legend just took, so it overflows `part="base"` by the legend's height
   * and `.chart-canvas { overflow: hidden }` clips the bottom of the chart
   * away — the x-axis and its labels are the first casualties.
   */
  clipped: 'MATRIX-chart-6: a top/bottom legend does not shrink the canvas, so the '
    + 'canvas overflows part="base" and the bottom of the chart (x-axis and labels) '
    + 'is clipped away',
  /**
   * Doc `legend.position: 'left' | 'right'`, plus doc "Accessibility: Legend
   * items clickable to toggle datasets". The left/right legend is
   * `position: absolute` OVER the plot area and, being earlier in DOM order
   * than the equally-positioned `.chart-canvas` with no z-index of its own, is
   * painted UNDERNEATH the canvas. The legend is invisible and every entry
   * fails a hit-test, so the documented toggle-by-clicking feature cannot be
   * used at all in these two positions.
   */
  buried: 'MATRIX-chart-7: a left/right legend is absolutely positioned over the plot '
    + 'and painted underneath the canvas — it is invisible and its entries cannot be '
    + 'clicked, so the documented legend toggle is unreachable',
} as const;

function findingFor(position: Combo['position']): string | null {
  if (position === 'top' || position === 'bottom') return FINDINGS.clipped;
  if (position === 'left' || position === 'right') return FINDINGS.buried;
  return null;
}

test.describe('chart visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    const known = findingFor(combo.position);
    const title = known ? `${known.split(':')[0]} \u00b7 ${combo.id}` : combo.id;

    test(title, async () => {
      if (known) test.fail(true, known);
      const mounted = await mount(page, {
        type: combo.type,
        datasets: DATASETS,
        labels: LABELS,
        options: optionsFor(combo.position),
      });
      expect(mounted.type).toBe(combo.type);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('chart visual matrix: ink responds to the documented state', () => {
  // Doc: "Legend items clickable to toggle datasets". Toggling must change the
  // PICTURE, not merely the legend's class — that is the whole point of the
  // feature and the DOM tier cannot see it.
  //
  // The assertion is that the painting CHANGED, deliberately not that there is
  // less of it: the y-axis range is derived from the visible datasets, so
  // hiding a series legitimately rescales the survivors and can paint more ink,
  // not less. "Fewer pixels" is an assumption the docs never make.
  test('hiding a dataset repaints the canvas', async () => {
    await mount(page, {
      type: 'bar', datasets: DATASETS, labels: LABELS, options: optionsFor('none'),
    });
    const before = await page.evaluate(() => (window as any).matrix.inkSignature());
    const inkBefore = await page.evaluate(() => (window as any).matrix.inkRatio());
    await page.evaluate(() => (window as any).matrix.toggle(1));
    const after = await page.evaluate(() => (window as any).matrix.inkSignature());

    expect(inkBefore, 'the two-series chart painted nothing').toBeGreaterThan(0.002);
    expect(after, `hiding a series left the canvas pixel-identical (${before})`)
      .not.toBe(before);
  });

  // Three different drawing paths, three different pictures. A component that
  // silently falls through to the cartesian renderer for pie and radar would
  // pass every structural check ever written.
  test('the three drawing families paint visibly different pictures', async () => {
    const signatures: Record<string, number | null> = {};
    for (const type of ['line', 'pie', 'radar'] as const) {
      await mount(page, {
        type, datasets: DATASETS, labels: LABELS, options: optionsFor('none'),
      });
      signatures[type] = await page.evaluate(() => (window as any).matrix.inkSignature());
    }
    const values = Object.values(signatures);
    expect(new Set(values).size,
      `line/pie/radar painted the same pixels: ${JSON.stringify(signatures)}`).toBe(3);
  });

  // Doc: `width` / `height`, "0 = auto". An explicit size must be the size the
  // canvas is actually given, backing store included.
  test('explicit width and height size the canvas exactly', async () => {
    await mount(page, {
      type: 'line', width: 500, height: 300,
      datasets: DATASETS, labels: LABELS, options: optionsFor('none'),
    });
    const size = await page.evaluate(() => {
      const canvas = document.getElementById('subject')!
        .shadowRoot!.querySelector('.chart-render-canvas') as HTMLCanvasElement;
      const box = canvas.getBoundingClientRect();
      return { attrW: canvas.width, attrH: canvas.height, boxW: box.width, boxH: box.height };
    });
    expect(size.attrW).toBe(500);
    expect(size.attrH).toBe(300);
    expect(Math.round(size.boxW)).toBe(500);
    expect(Math.round(size.boxH)).toBe(300);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Two. Layer 1 already read the canvas's own pixels; these prove those pixels
// reached the SCREEN — that nothing clipped, covered or blended the chart away
// between the canvas and the compositor.

test.describe('chart visual matrix: marquee pixels', () => {
  test('a bar chart paints pixels that differ from the surface behind it', async () => {
    await mount(page, {
      type: 'bar',
      datasets: [{ label: 'Sales', data: [40, 40, 40, 40], backgroundColor: 'rgb(220, 38, 38)' }],
      labels: LABELS,
      options: optionsFor('none'),
    });
    // Probe the middle of the plotted area and a point in the top-left padding
    // the cartesian renderer never draws into.
    const [plot, margin] = await capture(
      page, '#stage', 'chart-bar-ink',
      `() => {
        const canvas = document.getElementById('subject').shadowRoot
          .querySelector('.chart-render-canvas');
        const box = canvas.getBoundingClientRect();
        return [
          { x: box.x + box.width * 0.2, y: box.y + box.height * 0.75 },
          { x: box.x + 6, y: box.y + 6 },
        ];
      }`,
    );
    expect(sameColor(plot, margin),
      `the plotted area painted ${plot.join(',')}, identical to the untouched margin`).toBe(false);
    expect(contrast(plot, margin),
      `chart ink contrast against the surface is ${contrast(plot, margin).toFixed(2)}:1`)
      .toBeGreaterThan(1.15);
  });

  test('a legend swatch paints the colour the dataset asked for', async () => {
    await mount(page, {
      type: 'line',
      datasets: [{ label: 'Sales', data: [1, 2, 3, 4], borderColor: 'rgb(220, 38, 38)' }],
      labels: LABELS,
      options: optionsFor('top'),
    });
    const [swatch] = await capture(
      page, '#stage', 'chart-legend-swatch',
      `() => {
        const el = document.getElementById('subject').shadowRoot
          .querySelector('.legend-color');
        const box = el.getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      }`,
    );
    const [r, g, b] = swatch;
    expect(r > g + 40 && r > b + 40,
      `borderColor "rgb(220,38,38)" painted a swatch of rgb(${r},${g},${b})`).toBe(true);
  });
});
