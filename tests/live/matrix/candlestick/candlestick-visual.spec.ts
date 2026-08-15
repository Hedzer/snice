/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-candlestick TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/candlestick, `npm run test:matrix`)
 * owns structural truth: one candle per data point, every price on the chart's
 * own axis, the documented formats, the zoom methods. It cannot own visual
 * truth, because happy-dom performs no layout, paints nothing, and ships no
 * `DOMPoint` — the DOM tier has to SUPPLY the pointer space the crosshair reads.
 *
 * This tier asserts what only a browser can:
 *
 * ── Layer 1 (every combo): geometry, occlusion, computed style ──────────────
 *   · the SVG really fills the 720x420 stage, and every candle is painted
 *     INSIDE the plot area rather than clipped away at its edge;
 *   · bullish and bearish resolve, through the documented
 *     --snice-candlestick-* custom properties, to two DIFFERENT computed
 *     colours that are actually visible against the surface;
 *   · `showVolume` really moves the price plot up and puts the volume band
 *     below it, with no overlap between the two — a DOM test sees two sets of
 *     coordinates, only a browser sees whether they collide;
 *   · candles do not overlap each other (the width clamp really clamps);
 *   · the crosshair follows a REAL pointer through the browser's own screen
 *     CTM, and the tooltip lands inside the container instead of off-stage.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A candle with `fill="var(--candlestick-bullish)"` can still paint nothing.
 *   The marquee captures decode the PNG inside the browser under test and
 *   assert a bullish candle really is green, a bearish one really is red, and
 *   an author's `bullishColor` override really reaches the pixels.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/candlestick/matrix.html';

interface Combo {
  id: string;
  dataset: 'empty' | 'single' | 'mixed' | 'allBullish' | 'allBearish' | 'wide';
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  yAxisFormat: 'number' | 'currency' | 'percent';
  animation: boolean;
}

/**
 * The cross: six dataset shapes x showVolume x showGrid = 24, with the axis
 * format and the crosshair switch rotated across it. Sized to a component whose
 * visual dimensions are the plot band, the volume band, and the two direction
 * colours — this tier's job is that those four things are really on screen, not
 * that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  const datasets: Combo['dataset'][] = ['empty', 'single', 'mixed', 'allBullish', 'allBearish', 'wide'];
  const formats: Combo['yAxisFormat'][] = ['number', 'currency', 'percent'];
  let n = 0;
  for (const dataset of datasets) {
    for (const showVolume of [false, true]) {
      for (const showGrid of [false, true]) {
        combos.push({
          id: `${dataset}/[volume:${showVolume},grid:${showGrid}]`,
          dataset, showVolume, showGrid,
          showCrosshair: n % 2 === 0,
          yAxisFormat: formats[n % 3],
          animation: false,
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
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);

    // ── The chart really occupies its container ──────────────────────────────
    const base = sr.querySelector('[part="base"]') as HTMLElement | null;
    const svg = sr.querySelector('[part="canvas"]') as SVGSVGElement | null;
    if (!base) { say('no part="base"'); return problems; }
    if (!svg) { say('no part="canvas"'); return problems; }

    const svgBox = rect(svg);
    if (svgBox.width < hostBox.width - 4) {
      say(`the SVG is ${svgBox.width.toFixed(0)}px wide in a ${hostBox.width.toFixed(0)}px host`);
    }
    if (svgBox.height < 100) say(`the SVG is only ${svgBox.height.toFixed(0)}px tall`);

    // A real browser keeps the `viewBox` casing the DOM tier cannot assert.
    if (!svg.getAttribute('viewBox')) say('the SVG lost its viewBox attribute');

    const bodies = [...sr.querySelectorAll('.candlestick__body')] as SVGRectElement[];
    const volumes = [...sr.querySelectorAll('.candlestick__volume')] as SVGRectElement[];
    const grid = [...sr.querySelectorAll('.candlestick__grid-line')] as SVGLineElement[];

    if (combo.dataset === 'empty') {
      if (bodies.length) say(`${bodies.length} candles painted for empty data`);
      // An empty chart must still be a chart-shaped box, not a collapsed strip.
      if (svgBox.height < 100) say(`an empty chart collapsed to ${svgBox.height.toFixed(0)}px`);
      return problems;
    }

    if (bodies.length === 0) { say('no candles painted at all'); return problems; }

    // ── Every candle is painted inside the plot, with a real box ─────────────
    const boxes = bodies.map(rect);
    for (const [i, box] of boxes.entries()) {
      if (box.width <= 0 || box.height <= 0) {
        say(`candle ${i} paints at ${box.width.toFixed(2)}x${box.height.toFixed(2)}`);
        continue;
      }
      if (box.left < svgBox.left - EPS || box.right > svgBox.right + EPS) {
        say(`candle ${i} (x ${box.left.toFixed(1)}..${box.right.toFixed(1)}) escapes the`
          + ` canvas (${svgBox.left.toFixed(1)}..${svgBox.right.toFixed(1)})`);
      }
      if (box.top < svgBox.top - EPS || box.bottom > svgBox.bottom + EPS) {
        say(`candle ${i} (y ${box.top.toFixed(1)}..${box.bottom.toFixed(1)}) escapes the`
          + ` canvas vertically`);
      }
    }

    // ── Candles do not collide: the width clamp really clamps ────────────────
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].left < boxes[i - 1].right - EPS) {
        say(`candle ${i} overlaps candle ${i - 1}`
          + ` (${boxes[i].left.toFixed(1)} < ${boxes[i - 1].right.toFixed(1)})`);
      }
    }

    // ── The documented direction colours resolve to real, distinct paint ─────
    const fills = bodies.map(body => getComputedStyle(body).fill);
    const transparent = fills.filter(fill => fill === 'none' || fill === 'rgba(0, 0, 0, 0)');
    if (transparent.length) say(`${transparent.length} candles resolve to no fill at all`);

    if (combo.dataset === 'mixed') {
      // The mixed series alternates direction, so candle 0 and candle 1 are a
      // bullish/bearish pair. If the custom-property chain is broken they both
      // resolve to the same colour and the chart says nothing.
      if (fills[0] === fills[1]) {
        say(`bullish and bearish candles both resolve to "${fills[0]}"`);
      }
    }

    // ── showVolume: a band BELOW the price plot, never through it ────────────
    if (combo.showVolume) {
      if (volumes.length !== bodies.length) {
        say(`${volumes.length} volume bars painted for ${bodies.length} candles`);
      } else {
        const priceBottom = Math.max(...boxes.map(box => box.bottom));
        const volumeBoxes = volumes.map(rect);
        const volumeTop = Math.min(...volumeBoxes.map(box => box.top));
        if (volumeTop < priceBottom - EPS) {
          say(`the volume band starts at y=${volumeTop.toFixed(1)}, above the bottom of`
            + ` the price plot (${priceBottom.toFixed(1)}) — the two overlap`);
        }
        for (const [i, box] of volumeBoxes.entries()) {
          if (box.bottom > svgBox.bottom + EPS) {
            say(`volume bar ${i} paints below the canvas`);
          }
          if (Math.abs((box.left + box.right) / 2 - (boxes[i].left + boxes[i].right) / 2) > 1) {
            say(`volume bar ${i} is not painted under its own candle`);
          }
        }
      }
    } else if (volumes.length) {
      say(`showVolume is off but ${volumes.length} volume bars are painted`);
    }

    // ── showGrid: real horizontal rules spanning the plot ────────────────────
    if (combo.showGrid) {
      if (grid.length === 0) say('showGrid is on but no grid lines are painted');
      for (const [i, line] of grid.entries()) {
        const box = rect(line);
        if (box.width < svgBox.width * 0.5) {
          say(`grid line ${i} spans only ${box.width.toFixed(0)}px of a`
            + ` ${svgBox.width.toFixed(0)}px canvas`);
        }
        const cs = getComputedStyle(line);
        if (cs.stroke === 'none' || cs.stroke === 'rgba(0, 0, 0, 0)') {
          say(`grid line ${i} has no stroke colour`);
        }
      }
    } else if (grid.length) {
      say(`showGrid is off but ${grid.length} grid lines are painted`);
    }

    // ── The y-axis labels are painted inside the canvas, not off its edge ────
    const yLabels = [...sr.querySelectorAll('.candlestick__axis-label--y')] as SVGTextElement[];
    for (const [i, label] of yLabels.entries()) {
      const box = rect(label);
      if (box.width <= 0) { say(`y-axis label ${i} paints nothing`); continue; }
      if (box.right > svgBox.right + EPS) {
        say(`y-axis label ${i} ("${label.textContent}") runs off the right edge`);
      }
      if (!/\S/.test(label.textContent ?? '')) say(`y-axis label ${i} is blank`);
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('candlestick visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      if (combo.dataset === 'empty') expect(mounted.candles).toBe(0);
      else expect(mounted.candles).toBeGreaterThan(0);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('candlestick visual matrix: the crosshair in a real pointer space', () => {
  // The DOM tier has to SUPPLY `DOMPoint` and an identity screen matrix, because
  // happy-dom has neither. Only here does the component's real
  // `getScreenCTM().inverse()` path run, so only here can "the crosshair lands
  // under the pointer" be a fact rather than an assumption.
  test('the crosshair snaps to the candle under a real pointer', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'mixed', showVolume: true, showGrid: true, showCrosshair: true, animation: false,
    }));

    const problems = await page.evaluate(async () => {
      const out: string[] = [];
      const host = document.getElementById('subject') as HTMLElement;
      const sr = host.shadowRoot!;
      const bodies = [...sr.querySelectorAll('.candlestick__body')] as SVGRectElement[];
      const api = (window as any).matrix;
      let index = 0;
      const say = (message: string) => out.push(`candle ${index}: ${message}`);

      for (index of [0, 3, 7]) {
        const target = bodies[index].getBoundingClientRect();
        const x = target.left + target.width / 2;
        const y = target.top + target.height / 2;
        await api.hover(x, y);

        const vertical = sr.querySelector('.candlestick__crosshair-v') as SVGLineElement | null;
        const horizontal = sr.querySelector('.candlestick__crosshair-h') as SVGLineElement | null;
        if (!vertical || !horizontal) {
          out.push(`no crosshair for a pointer over candle ${index}`);
          continue;
        }
        const vBox = vertical.getBoundingClientRect();
        const hBox = horizontal.getBoundingClientRect();
        if (Math.abs((vBox.left + vBox.right) / 2 - x) > 2) {
          say(`vertical line at ${(vBox.left + vBox.right) / 2} for a pointer at ${x}`);
        }
        if (Math.abs((hBox.top + hBox.bottom) / 2 - y) > 2) {
          say(`horizontal line at ${(hBox.top + hBox.bottom) / 2} for a pointer at ${y}`);
        }

        // The tooltip must land inside the chart, not off its edge.
        const tooltip = sr.querySelector('[part="tooltip"]') as HTMLElement;
        const tipBox = tooltip.getBoundingClientRect();
        const hostBox = host.getBoundingClientRect();
        if (!tooltip.classList.contains('candlestick__tooltip--visible')) {
          say('the tooltip stayed hidden under the pointer');
        } else if (tipBox.width <= 0 || tipBox.height <= 0) {
          say('the tooltip has no box');
        } else if (tipBox.left < hostBox.left - 1 || tipBox.right > hostBox.right + 1) {
          say(`the tooltip (${tipBox.left.toFixed(0)}..${tipBox.right.toFixed(0)})`
            + ` hangs outside the chart`
            + ` (${hostBox.left.toFixed(0)}..${hostBox.right.toFixed(0)})`);
        }
      }

      await api.leave();
      if (sr.querySelector('.candlestick__crosshair-v')) {
        out.push('the crosshair outlived the pointer');
      }
      return out;
    });

    expect(problems).toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "fill resolves to rgb(22, 163, 74)" and "the candle is green on
// screen" are different claims, and only pixels can tell them apart.

test.describe('candlestick visual matrix: marquee pixels', () => {
  test('bullish candles paint green and bearish candles paint red', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'mixed', showVolume: false, showGrid: true, showCrosshair: false, animation: false,
    }));

    const [bull, bear, surface] = await capture(
      page, '#subject', 'candlestick-directions',
      `(host) => {
        const sr = host.shadowRoot;
        const bodies = [...sr.querySelectorAll('.candlestick__body')];
        const centre = (el) => {
          const b = el.getBoundingClientRect();
          return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        };
        const hostBox = host.getBoundingClientRect();
        return [centre(bodies[0]), centre(bodies[1]), { x: hostBox.x + 2, y: hostBox.y + 2 }];
      }`,
    );

    const [br, bg, bb] = bull as RGB;
    expect(bg > br + 20 && bg > bb + 20,
      `the bullish candle painted rgb(${br},${bg},${bb}), which is not green`).toBe(true);
    const [rr, rg, rb] = bear as RGB;
    expect(rr > rg + 20 && rr > rb + 20,
      `the bearish candle painted rgb(${rr},${rg},${rb}), which is not red`).toBe(true);
    expect(sameColor(bull, bear),
      'bullish and bearish candles painted the same colour').toBe(false);
    // A candle nobody can see is not a candle.
    expect(contrast(bull, surface),
      `bullish candle contrast against the surface is ${contrast(bull, surface).toFixed(2)}:1`)
      .toBeGreaterThan(1.3);
  });

  test('bullishColor paints the colour that was asked for', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'allBullish', showVolume: false, showGrid: false, showCrosshair: false,
      animation: false, bullishColor: 'rgb(0, 80, 255)',
    }));

    const [candle] = await capture(
      page, '#subject', 'candlestick-colour-override',
      `(host) => {
        const body = host.shadowRoot.querySelector('.candlestick__body');
        const b = body.getBoundingClientRect();
        return [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }];
      }`,
    );
    const [r, g, b] = candle as RGB;
    expect(b > r + 40 && b > g + 40,
      `bullishColor="rgb(0,80,255)" painted rgb(${r},${g},${b})`).toBe(true);
  });

  test('volume bars paint below the price plot, not through it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'mixed', showVolume: true, showGrid: false, showCrosshair: false, animation: false,
    }));

    // Probe the tallest volume bar and the empty band directly above it. A
    // volume layer that has leaked into the price plot paints both.
    const [bar, above] = await capture(
      page, '#subject', 'candlestick-volume-band',
      `(host) => {
        const bars = [...host.shadowRoot.querySelectorAll('.candlestick__volume')];
        const tallest = bars.reduce((best, bar) =>
          bar.getBoundingClientRect().height > best.getBoundingClientRect().height ? bar : best);
        const b = tallest.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.bottom - 3 },
          { x: b.x + b.width / 2, y: b.top - 12 },
        ];
      }`,
    );
    expect(sameColor(bar, above),
      `the volume bar and the band above it both painted ${bar.join(',')}`).toBe(false);
  });
});
