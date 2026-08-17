/**
 * snice-treemap TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/treemap, 94 combos) owns which rectangle belongs
 * to which node, what the drill path is, and what the events say. It cannot own
 * any of the below, because happy-dom performs no layout: every rectangle,
 * label and tooltip there reads 0x0, and the component falls back to its own
 * 600x400 default rather than the host it was given.
 *
 * LAYER 1 — geometry / computed style / occlusion, for
 *   {7 trees} x {labels+values, labels only, neither} = 21 combos, plus the
 *   colour-scheme sweep and the drill/tooltip interaction probes.
 * The tree axis is the interesting one: a squarified layout computes every box
 * from the data, so equal values are where two rectangles can land on top of
 * each other and a steep drop is where one collapses to nothing.
 *
 * LAYER 2 — real screenshots, four pinned combos.
 */
import { test, expect, type Page } from '@playwright/test';
import { openChartStage, mount, collectChartProblems } from '../chart-visual-support';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/treemap/matrix.html';

const TREES = ['doc', 'single', 'equal', 'steep', 'colored', 'deep', 'many'] as const;
const RECT_COUNT: Record<string, number> = {
  doc: 3, single: 1, equal: 2, steep: 2, colored: 3, deep: 2, many: 12,
};
const TEXT_MODES = [
  { id: 'text-both', showLabels: true, showValues: true },
  { id: 'text-labels', showLabels: true, showValues: false },
  { id: 'text-none', showLabels: false, showValues: false },
] as const;

const SCHEMES = ['default', 'blue', 'green', 'purple', 'orange', 'warm', 'cool', 'rainbow'] as const;

test.describe('snice-treemap visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const tree of TREES) {
    for (const mode of TEXT_MODES) {
      const id = `${tree}/${mode.id}`;
      test(id, async () => {
        await mount(page, { id, tree, ...mode });

        expect(await collectChartProblems(page, {
          surface: '.treemap__svg',
          marks: '.treemap__rect',
          marks_expected: RECT_COUNT[tree],
          requireDistinctPositions: true,
          occlusion: true,
          text: mode.showLabels ? '.treemap__label' : undefined,
          // The tooltip is a hover affordance; nothing has hovered.
          hidden: ['.treemap__tooltip'],
          boxes: ['[part~="base"]', '[part~="chart"]'],
        }), id).toEqual([]);

        // The chart fills the host it was given: a treemap that laid itself out
        // at its own 600x400 default inside a 720x460 host would leave a band of
        // the page showing through, and no DOM assertion can see that.
        const fit = await page.evaluate(() => {
          const host = document.getElementById('subject')!;
          const sr = host.shadowRoot!;
          const hostBox = host.getBoundingClientRect();
          const svg = sr.querySelector('.treemap__svg')!.getBoundingClientRect();
          const rects = [...sr.querySelectorAll('.treemap__rect')]
            .map(r => r.getBoundingClientRect());
          const covered = rects.reduce((sum, r) => sum + r.width * r.height, 0);
          return {
            host: { w: hostBox.width, h: hostBox.height },
            svg: { w: svg.width, h: svg.height },
            covered,
          };
        });
        expect(fit.svg.w).toBeGreaterThan(fit.host.w * 0.9);
        expect(fit.svg.h).toBeGreaterThan(fit.host.h * 0.8);
        // The rectangles between them cover most of the chart area.
        expect(fit.covered).toBeGreaterThan(fit.svg.w * fit.svg.h * 0.8);
      });
    }
  }

  for (const colorScheme of SCHEMES) {
    test(`scheme/${colorScheme}`, async () => {
      await mount(page, { id: `scheme/${colorScheme}`, tree: 'many', colorScheme });
      expect(await collectChartProblems(page, {
        surface: '.treemap__svg',
        marks: '.treemap__rect',
        marks_expected: 12,
        requireDistinctPositions: true,
        occlusion: true,
      }), colorScheme).toEqual([]);
    });
  }
});

test.describe('snice-treemap visual matrix (layer 1: interaction paint)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the tooltip paints over the chart only after a hover', async () => {
    await mount(page, { id: 'hover', tree: 'doc' });

    const before = await page.evaluate(() => {
      const tip = document.getElementById('subject')!.shadowRoot!
        .querySelector('.treemap__tooltip') as HTMLElement;
      const box = tip.getBoundingClientRect();
      return { opacity: Number(getComputedStyle(tip).opacity), w: box.width, h: box.height };
    });
    expect(before.opacity === 0 || before.w === 0 || before.h === 0).toBe(true);

    expect(await page.evaluate(() => (window as any).matrix.hoverRect(0))).toBe(true);

    const after = await page.evaluate(() => {
      const tip = document.getElementById('subject')!.shadowRoot!
        .querySelector('.treemap__tooltip') as HTMLElement;
      const cs = getComputedStyle(tip);
      const box = tip.getBoundingClientRect();
      return {
        display: cs.display, opacity: Number(cs.opacity),
        w: box.width, h: box.height, text: (tip.textContent ?? '').trim(),
      };
    });
    expect(after.display).not.toBe('none');
    expect(after.opacity).toBeGreaterThan(0);
    expect(after.w).toBeGreaterThan(0);
    expect(after.h).toBeGreaterThan(0);
    expect(after.text).toBe('A: 50');
  });

  test('a hovered tooltip does not permanently cover the rectangles', async () => {
    await mount(page, { id: 'hover-leave', tree: 'doc' });
    await page.evaluate(() => (window as any).matrix.hoverRect(0));
    await page.evaluate(() => (window as any).matrix.leaveRect(0));

    expect(await collectChartProblems(page, {
      surface: '.treemap__svg',
      marks: '.treemap__rect',
      marks_expected: 3,
      occlusion: true,
      hidden: ['.treemap__tooltip'],
    })).toEqual([]);
  });

  test('clicking a nested rectangle drills and relays out the chart', async () => {
    await mount(page, { id: 'drill', tree: 'deep' });
    const depth = await page.evaluate(() => (window as any).matrix.clickRect(0));
    expect(depth).toBe(1);

    expect(await collectChartProblems(page, {
      surface: '.treemap__svg',
      marks: '.treemap__rect',
      marks_expected: 2,
      requireDistinctPositions: true,
      occlusion: true,
      boxes: ['[part~="breadcrumbs"]'],
    })).toEqual([]);
  });

  test('the breadcrumb trail is laid out above the chart', async () => {
    await mount(page, { id: 'crumbs', tree: 'deep', drill: 'Branch' });
    const layout = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const crumbs = sr.querySelector('[part~="breadcrumbs"]')!.getBoundingClientRect();
      const chart = sr.querySelector('[part~="chart"]')!.getBoundingClientRect();
      const buttons = [...sr.querySelectorAll('.treemap__breadcrumb')]
        .map(b => b.getBoundingClientRect()).map(b => ({ w: b.width, h: b.height }));
      return { crumbs: { h: crumbs.height, bottom: crumbs.bottom }, chart: { top: chart.top }, buttons };
    });
    expect(layout.crumbs.h).toBeGreaterThan(0);
    expect(layout.crumbs.bottom).toBeLessThanOrEqual(layout.chart.top + 1);
    for (const button of layout.buttons) {
      expect(button.w).toBeGreaterThan(0);
      expect(button.h).toBeGreaterThan(0);
    }
  });
});

// ── LAYER 2: real pixels, four pinned combos ────────────────────────────────

test.describe('snice-treemap visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  /** Probe the centre of every painted rectangle. */
  const RECT_CENTRES = `(host) => [...host.shadowRoot.querySelectorAll('.treemap__rect')]
    .map((r) => { const b = r.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })`;

  test('every rectangle paints the colour it declares', async () => {
    // Labels are painted white ON the rectangles, so a centre probe with them
    // on would sample a glyph rather than the fill under test.
    await mount(page, { id: 'px-scheme', tree: 'many', colorScheme: 'rainbow', showLabels: false });
    const pixels = await capture(page, '#subject', 'treemap-rainbow', RECT_CENTRES);
    const declared: string[] = await page.evaluate(() =>
      [...document.getElementById('subject')!.shadowRoot!.querySelectorAll('.treemap__rect')]
        .map(rect => rect.getAttribute('fill')!));

    expect(pixels).toHaveLength(12);
    const order = (c: RGB) => [0, 1, 2].sort((a, b) => c[b] - c[a]).join('');
    pixels.forEach((pixel, index) => {
      const hex = declared[index];
      const want: RGB = [
        parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
      ];
      expect(order(pixel), `rect ${index} declares ${hex} but painted ${pixel}`).toBe(order(want));
    });
    // WHICH colour each rectangle declares is the DOM tier's question, and the
    // palette walk is wrong there — see MATRIX-treemap-1. This tier owns only
    // "the declared colour is the colour that landed on screen".
  });

  test('explicit node colours reach the pixels', async () => {
    await mount(page, { id: 'px-colored', tree: 'colored', showLabels: false });
    const pixels = await capture(page, '#subject', 'treemap-colored', RECT_CENTRES);
    // Pair each painted pixel with the fill the SAME rectangle declares, in DOM
    // order, rather than assuming which node the layout put first.
    const declared: string[] = await page.evaluate(() =>
      [...document.getElementById('subject')!.shadowRoot!.querySelectorAll('.treemap__rect')]
        .map(rect => rect.getAttribute('fill')!));

    expect(pixels).toHaveLength(3);
    expect(declared.sort()).toEqual(['#1565c0', '#2e7d32', '#e74c3c']);

    // Assert the channel ORDER a human reads rather than an exact triple, so an
    // antialiased edge cannot flake this.
    const order = (c: RGB) => [0, 1, 2].sort((a, b) => c[b] - c[a]).join('');
    const fills: string[] = await page.evaluate(() =>
      [...document.getElementById('subject')!.shadowRoot!.querySelectorAll('.treemap__rect')]
        .map(rect => rect.getAttribute('fill')!));
    pixels.forEach((pixel, index) => {
      const hex = fills[index];
      const want: RGB = [
        parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
      ];
      expect(order(pixel), `rect ${index} declares ${hex} but painted ${pixel}`).toBe(order(want));
    });
  });

  test('labels are readable against the rectangle they sit in', async () => {
    await mount(page, { id: 'px-labels', tree: 'doc', showLabels: true });
    // Sample a strip across the label plus the fill just below it, and judge
    // the darkest ink: a single centre sample lands between glyphs as often as
    // on one.
    const probe = `(host) => { const t = host.shadowRoot.querySelector('.treemap__label');
      const b = t.getBoundingClientRect();
      const points = [];
      for (let i = 1; i <= 12; i++) points.push({ x: b.left + (b.width * i) / 13, y: b.top + b.height / 2 });
      points.push({ x: b.left + b.width / 2, y: b.bottom + 10 });
      return points; }`;
    const samples = await capture(page, '#subject', 'treemap-labels', probe);
    const ground = samples[samples.length - 1];
    const best = Math.max(...samples.slice(0, -1).map(ink => contrast(ink, ground)));
    expect(best, 'best label contrast over 12 samples').toBeGreaterThan(1.6);
  });

  test('a steep drop lays both rectangles out in proportion', async () => {
    // 100000 against 1 is the combo where the small rectangle is legitimately
    // sub-pixel: the point of the check is that the layout stays PROPORTIONAL
    // and inside the chart rather than clamping the runt to a visible slab or
    // pushing it off the surface — neither of which the DOM tier can see.
    await mount(page, { id: 'px-steep', tree: 'steep', padding: 0 });

    const geometry = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const svg = sr.querySelector('.treemap__svg')!.getBoundingClientRect();
      const rects = [...sr.querySelectorAll('.treemap__rect')].map(r => {
        const b = r.getBoundingClientRect();
        return { w: b.width, h: b.height, left: b.left, top: b.top, right: b.right, bottom: b.bottom };
      });
      return { svg: { w: svg.width, h: svg.height, left: svg.left, top: svg.top, right: svg.right, bottom: svg.bottom }, rects };
    });

    expect(geometry.rects).toHaveLength(2);
    const [big, small] = [...geometry.rects].sort((a, b) => b.w * b.h - a.w * a.h);
    // Nothing is negative, nothing escapes the surface.
    for (const box of geometry.rects) {
      expect(box.w).toBeGreaterThanOrEqual(0);
      expect(box.h).toBeGreaterThanOrEqual(0);
      expect(box.left).toBeGreaterThanOrEqual(geometry.svg.left - 1);
      expect(box.right).toBeLessThanOrEqual(geometry.svg.right + 1);
      expect(box.top).toBeGreaterThanOrEqual(geometry.svg.top - 1);
      expect(box.bottom).toBeLessThanOrEqual(geometry.svg.bottom + 1);
    }
    // The dominant value takes essentially the whole surface.
    expect(big.w * big.h).toBeGreaterThan(geometry.svg.w * geometry.svg.h * 0.9);
    expect(small.w * small.h).toBeLessThan(big.w * big.h * 0.01);

    // The big rectangle is painted, not left as bare surface.
    const pixels = await capture(page, '#subject', 'treemap-steep', RECT_CENTRES);
    expect(pixels).toHaveLength(2);
    expect(sameColor(pixels[0], [255, 255, 255]), 'the dominant rectangle is unpainted').toBe(false);
  });
});
