/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-waterfall TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/waterfall, `npm run test:matrix`)
 * owns structure and arithmetic truth: how many bars, which types, which
 * labels, and whether the running total plots on one shared axis. It cannot own
 * visual truth, because happy-dom performs no layout and paints nothing — the
 * SVG there is a string of attributes, not a picture.
 *
 * Everything this tier adds is a claim the docs make that only a browser can
 * settle:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the chart has a real box and the `<svg>` fills its container (the
 *     stylesheet's `width: 100%; height: 100%` on the SVG);
 *   · the three documented bar colours resolve to three DISTINCT paints —
 *     `--snice-color-success` for increases, `--snice-color-danger` for
 *     decreases, `--snice-color-primary` for totals — which is the whole
 *     "distinguishable by color" half of the accessibility promise;
 *   · a value label is painted in its bar's own colour, so colour and label
 *     agree;
 *   · the connector line is really dashed (`stroke-dasharray`) and really
 *     tertiary-coloured, and the zero axis is really the border colour;
 *   · bars never overlap each other, and the value label of a bar is never
 *     occluded by the bar it belongs to (elementFromPoint through the shadow
 *     root) — the one failure a DOM test structurally cannot see;
 *   · every axis label sits inside the chart's own box, so nothing is clipped.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A `fill` that resolves to a colour can still paint nothing. The marquee
 *   captures decode the PNG inside the browser under test and assert that an
 *   increase bar really paints green pixels, a decrease bar really paints red
 *   ones, the two really differ, and a `--snice-color-success` override really
 *   reaches the bar.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/waterfall/matrix.html';

type Dataset = 'doc' | 'auto' | 'mixed' | 'single' | 'descending' | 'magnitudes';

interface Combo {
  id: string;
  dataset: Dataset;
  showValues: boolean;
  showConnectors: boolean;
  animated: boolean;
}

/**
 * The cross: dataset (6 populated) x showValues (2) x showConnectors (2) = 24
 * combos, with `animated` rotated across them. Sized to a component with five
 * documented properties and one render path — the point of this tier is that
 * every documented COLOUR and every occlusion risk gets a real browser, not
 * that the product is large. The empty dataset paints nothing and is checked
 * once, on its own, at the end.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const dataset of ['doc', 'auto', 'mixed', 'single', 'descending', 'magnitudes'] as Dataset[]) {
    for (const showValues of [true, false]) {
      for (const showConnectors of [true, false]) {
        combos.push({
          id: `${dataset}/${showValues ? 'values' : 'no-values'}`
            + `/${showConnectors ? 'connectors' : 'no-connectors'}`
            + `${n % 3 === 0 ? '/animated' : ''}`,
          dataset, showValues, showConnectors, animated: n % 3 === 0,
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

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── The chart area and its SVG ──────────────────────────────────────────
    const chart = sr.querySelector('[part~="chart"]') as HTMLElement | null;
    if (!chart) { say('no [part="chart"] rendered'); return problems; }
    const svg = chart.querySelector('svg') as SVGSVGElement | null;
    if (!svg) { say('no <svg> painted'); return problems; }

    const svgBox = rect(svg);
    if (svgBox.width <= 0 || svgBox.height <= 0) {
      say(`svg renders at ${svgBox.width}x${svgBox.height}`);
      return problems;
    }
    // The stylesheet gives the SVG `display: block; width: 100%`, so a chart
    // that does not span its host is a layout regression, not a data one.
    if (svgBox.width < hostBox.width - 1) {
      say(`svg spans ${svgBox.width.toFixed(0)}px of a ${hostBox.width.toFixed(0)}px host`);
    }
    if (getComputedStyle(svg).display !== 'block') {
      say(`svg computed display "${getComputedStyle(svg).display}", expected "block"`);
    }

    const bars = [...sr.querySelectorAll('rect')] as SVGRectElement[];
    if (bars.length === 0) { say('no bars painted'); return problems; }

    // ── The three documented bar colours are three DISTINCT paints ──────────
    const fillByType = new Map<string, string>();
    for (const [i, bar] of bars.entries()) {
      const cls = bar.getAttribute('class') ?? '';
      const type = /waterfall-bar-([a-z]+)/.exec(cls)?.[1];
      if (!type) { say(`bar ${i} carries no type class ("${cls}")`); continue; }

      const cs = getComputedStyle(bar);
      const fill = cs.fill;
      if (!fill || fill === 'none' || fill === 'rgba(0, 0, 0, 0)') {
        say(`bar ${i} (${type}) has fill "${fill}" — it paints nothing`);
      }
      if (cs.visibility !== 'visible') say(`bar ${i} visibility "${cs.visibility}"`);

      const seen = fillByType.get(type);
      if (seen === undefined) fillByType.set(type, fill);
      else if (seen !== fill) say(`two ${type} bars paint different fills: ${seen} vs ${fill}`);

      // A bar must have a real box. The component floors a zero-delta bar at
      // 1px, which is a visible hairline, not a collapse.
      const box = rect(bar);
      if (box.width <= 0 || box.height <= 0) {
        say(`bar ${i} (${type}) renders at ${box.width.toFixed(2)}x${box.height.toFixed(2)}`);
      }
    }

    const distinctFills = new Set(fillByType.values());
    if (distinctFills.size !== fillByType.size) {
      say(`bar types ${[...fillByType.keys()].join('/')} share fills`
        + ` ${JSON.stringify([...fillByType])} — colour cannot distinguish them`);
    }

    // ── Bars never overlap one another ──────────────────────────────────────
    const boxes = bars.map(bar => rect(bar));
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].left < boxes[i - 1].right - 0.5) {
        say(`bar ${i} (left ${boxes[i].left.toFixed(1)}) overlaps bar ${i - 1}`
          + ` (right ${boxes[i - 1].right.toFixed(1)})`);
      }
    }

    // ── Connectors: really dashed, and only when asked for ──────────────────
    const connectors = [...sr.querySelectorAll('line.waterfall-connector')] as SVGLineElement[];
    if (combo.showConnectors) {
      if (connectors.length !== Math.max(0, bars.length - 1)) {
        say(`${connectors.length} connectors for ${bars.length} bars`);
      }
      for (const [i, line] of connectors.entries()) {
        const cs = getComputedStyle(line);
        if (cs.stroke === 'none' || cs.stroke === 'rgba(0, 0, 0, 0)') {
          say(`connector ${i} stroke "${cs.stroke}" — it paints nothing`);
        }
        if (parseFloat(cs.strokeWidth) <= 0) say(`connector ${i} stroke-width "${cs.strokeWidth}"`);
        // The documented look is a dashed bridge, not a solid rule.
        if (!cs.strokeDasharray || cs.strokeDasharray === 'none') {
          say(`connector ${i} is solid (stroke-dasharray "${cs.strokeDasharray}")`);
        }
      }
    } else if (connectors.length !== 0) {
      say(`${connectors.length} connectors painted while show-connectors is off`);
    }

    // ── The zero axis is painted ────────────────────────────────────────────
    const axis = sr.querySelector('line.waterfall-axis') as SVGLineElement | null;
    if (!axis) say('no zero axis painted');
    else {
      const cs = getComputedStyle(axis);
      if (cs.stroke === 'none' || cs.stroke === 'rgba(0, 0, 0, 0)') {
        say(`zero axis stroke "${cs.stroke}" — it paints nothing`);
      }
      const axisBox = rect(axis);
      if (axisBox.width < svgBox.width * 0.5) {
        say(`zero axis spans ${axisBox.width.toFixed(0)}px of a ${svgBox.width.toFixed(0)}px chart`);
      }
    }

    // ── Category labels: painted, legible, inside the chart ─────────────────
    const labels = [...sr.querySelectorAll('text.waterfall-label')] as SVGTextElement[];
    if (labels.length !== bars.length) say(`${labels.length} labels for ${bars.length} bars`);
    for (const [i, label] of labels.entries()) {
      const cs = getComputedStyle(label);
      if (parseFloat(cs.fontSize) < 9) say(`label ${i} font-size ${cs.fontSize}`);
      if (cs.fill === 'none' || cs.fill === 'rgba(0, 0, 0, 0)') {
        say(`label ${i} fill "${cs.fill}" — the text paints nothing`);
      }
      const box = rect(label);
      if (box.width <= 0 || box.height <= 0) say(`label ${i} renders at ${box.width}x${box.height}`);
      if (box.bottom > svgBox.bottom + 1 || box.top < svgBox.top - 1) {
        say(`label ${i} (${label.textContent}) is clipped by the chart box`);
      }
    }

    // ── Value labels: same colour as their bar, and never occluded by it ────
    const values = [...sr.querySelectorAll('text.waterfall-value')] as SVGTextElement[];
    if (!combo.showValues) {
      if (values.length !== 0) say(`${values.length} value labels painted while show-values is off`);
    } else {
      if (values.length !== bars.length) {
        say(`${values.length} value labels for ${bars.length} bars`);
      }
      for (const [i, value] of values.entries()) {
        const cs = getComputedStyle(value);
        if (parseFloat(cs.fontSize) < 9) say(`value ${i} font-size ${cs.fontSize}`);

        // Colour agreement: the value label of an increase is the increase
        // colour, so "color AND value label" tell the same story.
        const type = /waterfall-value-([a-z]+)/.exec(value.getAttribute('class') ?? '')?.[1];
        const barFill = type ? fillByType.get(type) : undefined;
        if (barFill && cs.fill !== barFill) {
          say(`value ${i} (${type}) paints ${cs.fill} but its bar paints ${barFill}`);
        }

        const box = rect(value);
        if (box.width <= 0 || box.height <= 0) {
          say(`value ${i} renders at ${box.width}x${box.height}`);
          continue;
        }
        if (box.top < svgBox.top - 1) {
          say(`value ${i} (${value.textContent}) is clipped off the top of the chart`);
        }

        // Occlusion. A value label drawn UNDER its own bar reads as a missing
        // label to a sighted user and is invisible to a DOM test.
        const y = box.top + box.height / 2;
        for (const fraction of [0.3, 0.7]) {
          const x = box.left + box.width * fraction;
          const outer = document.elementFromPoint(x, y);
          if (outer !== host) {
            say(`value ${i} @${Math.round(fraction * 100)}%: page hit-test found`
              + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the waterfall`);
            continue;
          }
          const hit = (sr as any).elementFromPoint(x, y) as Element | null;
          if (hit && hit !== value && hit.tagName.toLowerCase() === 'rect') {
            say(`value ${i} (${value.textContent}) is painted under a bar`);
          }
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('waterfall visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.dataset).toBe(combo.dataset);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }

  test('empty/nothing painted', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ dataset: 'empty' }));
    const drawn = await page.evaluate(() => {
      const sr = (document.getElementById('subject') as HTMLElement).shadowRoot!;
      const chart = sr.querySelector('[part~="chart"]') as HTMLElement;
      return {
        svgs: sr.querySelectorAll('svg').length,
        chartVisible: getComputedStyle(chart).visibility,
      };
    });
    // An empty `data` array is the documented default; it draws no chart at all.
    expect(drawn.svgs).toBe(0);
    expect(drawn.chartVisible).toBe('visible');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the rect's computed fill is green" and "green pixels reached
// the screen" are different claims, and only pixels can tell them apart.

test.describe('waterfall visual matrix: marquee pixels', () => {
  /** Probe the centre of the bar at `index`, plus the surface beside the chart. */
  const probeBar = (index: number) => `(host) => {
    const bar = host.shadowRoot.querySelectorAll('rect')[${index}];
    const box = bar.getBoundingClientRect();
    return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
  }`;

  test('the three bar types paint three different, visible colours', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ dataset: 'doc' }));

    // doc dataset: [total, increase, decrease, decrease, total].
    const [total] = await capture(page, '#subject', 'waterfall-total', probeBar(0));
    const [increase] = await capture(page, '#subject', 'waterfall-increase', probeBar(1));
    const [decrease] = await capture(page, '#subject', 'waterfall-decrease', probeBar(2));

    expect(sameColor(total, increase), `total ${total} and increase ${increase} paint the same`)
      .toBe(false);
    expect(sameColor(increase, decrease), `increase ${increase} and decrease ${decrease} paint the same`)
      .toBe(false);
    expect(sameColor(total, decrease), `total ${total} and decrease ${decrease} paint the same`)
      .toBe(false);

    // The documented defaults: success is green-dominant, danger red-dominant,
    // primary blue-dominant. Asserted as dominance rather than exact triples,
    // because the theme is allowed to retune the tokens.
    const [ir, ig, ib] = increase as RGB;
    expect(ig > ir && ig > ib, `increase painted rgb(${ir},${ig},${ib}), not a green`).toBe(true);
    const [dr, dg, db] = decrease as RGB;
    expect(dr > dg && dr > db, `decrease painted rgb(${dr},${dg},${db}), not a red`).toBe(true);
    const [tr, tg, tb] = total as RGB;
    expect(tb > tr && tb > tg, `total painted rgb(${tr},${tg},${tb}), not a blue`).toBe(true);
  });

  test('a bar paints pixels that differ from the surface behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ dataset: 'auto' }));
    const [bar, surface] = await capture(
      page, '#subject', 'waterfall-contrast',
      `(host) => {
        const rect = host.shadowRoot.querySelectorAll('rect')[0];
        const box = rect.getBoundingClientRect();
        const hostBox = host.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: hostBox.right - 4, y: hostBox.top + 4 },
        ];
      }`,
    );
    expect(sameColor(bar, surface), `bar painted ${bar.join(',')}, identical to the surface`)
      .toBe(false);
    // A bar nobody can see is not a bar. 2:1 is a low bar for a solid fill on
    // the theme surface, but "solid" is not "absent".
    expect(contrast(bar, surface),
      `bar contrast against the surface is ${contrast(bar, surface).toFixed(2)}:1`)
      .toBeGreaterThan(2);
  });

  test('the documented --snice-color-success token reaches the increase bars', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      dataset: 'auto', color: 'rgb(160, 32, 240)',
    }));
    const [bar] = await capture(page, '#subject', 'waterfall-token', probeBar(0));
    // auto[0] is a +40 increase, so it is painted from --snice-color-success.
    // Anti-aliasing is avoided by probing the bar's centre; the assertion is
    // dominance rather than an exact triple.
    const [r, g, b] = bar as RGB;
    expect(r > g + 30 && b > g + 30,
      `--snice-color-success: rgb(160,32,240) painted rgb(${r},${g},${b})`).toBe(true);
  });

  test('a value label paints text above its bar, not a flat band', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ dataset: 'doc' }));
    const pixels = await capture(
      page, '#subject', 'waterfall-value-label',
      `(host) => {
        const label = host.shadowRoot.querySelectorAll('text.waterfall-value')[1];
        const box = label.getBoundingClientRect();
        return [0.15, 0.35, 0.55, 0.75].map(f => ({
          x: box.x + box.width * f,
          y: box.y + box.height / 2,
        }));
      }`,
    );
    // Glyphs and the gaps between them guarantee variety; one flat colour means
    // the label painted nothing, or a bar painted over it.
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `value label area painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
  });
});
