/**
 * snice-paint TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/paint, 82 combos) owns which controls exist,
 * which stroke a gesture becomes, and what the history does. It cannot own any
 * of the below: happy-dom lays nothing out (every swatch and button reads 0x0)
 * and rasterises nothing (its 2D context is a call recorder).
 *
 * LAYER 1 — geometry / computed style / occlusion, for
 *   {6 control subsets} x {enabled, disabled} = 12 combos, plus the toolbar /
 *   canvas split and the pointer-mapping probe. The interesting axis is the
 *   toolbar: it shares the host's height with the canvas, so a toolbar that
 *   grows silently steals the drawing surface.
 *
 * LAYER 2 — real pixels, four pinned combos: the swatches paint their own
 * colours, the background colour fills the canvas, ink lands where the pointer
 * went, and the eraser paints the background back.
 */
import { test, expect, type Page } from '@playwright/test';
import { openChartStage, mount, collectChartProblems } from '../chart-visual-support';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/paint/matrix.html';

const CONTROL_SETS = [
  { id: 'all', controls: undefined },
  { id: 'colors-only', controls: 'colors' },
  { id: 'size-only', controls: 'size' },
  { id: 'history', controls: 'undo,redo,clear' },
  { id: 'eraser+clear', controls: 'eraser,clear' },
  { id: 'with-selects', controls: 'colors,size,clear', colorSelects: 3 },
] as const;

test.describe('snice-paint visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const set of CONTROL_SETS) {
    for (const disabled of [false, true]) {
      const id = `${set.id}/${disabled ? 'disabled' : 'enabled'}`;
      test(id, async () => {
        await mount(page, { id, ...set, disabled, strokes: 'many' });

        expect(await collectChartProblems(page, {
          surface: '[part~="base"]',
          marks: 'canvas',
          marks_expected: 1,
          occlusion: true,
          boxes: ['[part~="base"]', '.paint-canvas-wrap'],
        }), `${id}: shell`).toEqual([]);

        const layout = await page.evaluate(() => {
          const host = document.getElementById('subject')!;
          const sr = host.shadowRoot!;
          const box = (selector: string) => {
            const el = sr.querySelector(selector) as HTMLElement | null;
            if (!el) return null;
            const b = el.getBoundingClientRect();
            return {
              top: b.top, bottom: b.bottom, left: b.left, right: b.right,
              w: b.width, h: b.height,
            };
          };
          const canvas = sr.querySelector('canvas') as HTMLCanvasElement;
          return {
            host: host.getBoundingClientRect().height,
            toolbar: box('.paint-toolbar'),
            wrap: box('.paint-canvas-wrap'),
            canvas: box('canvas'),
            buffer: { w: canvas.width, h: canvas.height },
            dpr: window.devicePixelRatio,
            swatches: [...sr.querySelectorAll('.paint-swatch')]
              .map(s => s.getBoundingClientRect()).map(b => ({ w: b.width, h: b.height })),
            selects: [...sr.querySelectorAll('.paint-swatch-select')]
              .map(s => s.getBoundingClientRect()).map(b => ({ w: b.width, h: b.height })),
            buttons: [...sr.querySelectorAll('button.paint-btn')]
              .map(b => ({ title: b.getAttribute('title'), ...b.getBoundingClientRect().toJSON() })),
          };
        });

        // The toolbar is a rail BESIDE the canvas and never overlaps it: an
        // overlap is a drawing surface the user cannot reach.
        if (layout.toolbar) {
          expect(layout.toolbar.h, `${id}: toolbar height`).toBeGreaterThan(0);
          expect(layout.toolbar.w, `${id}: toolbar width`).toBeGreaterThan(0);
          expect(layout.toolbar.right, `${id}: toolbar overlaps the canvas`)
            .toBeLessThanOrEqual(layout.wrap!.left + 1);
          // And it does not eat the host: the canvas keeps most of the width.
          expect(layout.wrap!.w).toBeGreaterThan(layout.toolbar.w);
        }

        // The canvas keeps a real drawing area, and its buffer matches its box.
        expect(layout.canvas!.w).toBeGreaterThan(0);
        expect(layout.canvas!.h).toBeGreaterThan(0);
        expect(layout.buffer.w).toBeCloseTo(layout.wrap!.w * layout.dpr, 0);
        expect(layout.buffer.h).toBeCloseTo(layout.wrap!.h * layout.dpr, 0);

        // Every control the combo asked for is a real, tappable target.
        for (const swatch of [...layout.swatches, ...layout.selects]) {
          expect(swatch.w, `${id}: swatch width`).toBeGreaterThan(0);
          expect(swatch.h, `${id}: swatch height`).toBeGreaterThan(0);
        }
        for (const button of layout.buttons) {
          expect(button.width, `${id}: "${button.title}" width`).toBeGreaterThan(0);
          expect(button.height, `${id}: "${button.title}" height`).toBeGreaterThan(0);
        }
      });
    }
  }
});

test.describe('snice-paint visual matrix (layer 1: hit targets and slots)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('every toolbar control is hit-testable at its own centre', async () => {
    await mount(page, { id: 'hit', colorSelects: 2 });
    const problems = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const root = sr as unknown as { elementFromPoint(x: number, y: number): Element | null };
      const bad: string[] = [];
      const targets = sr.querySelectorAll('button.paint-btn, .paint-swatch, .paint-swatch-select, .paint-size-slider');
      for (const target of targets) {
        const b = target.getBoundingClientRect();
        const hit = root.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (hit !== target && !target.contains(hit!)) {
          bad.push(`${target.className}: occluded by <${hit?.tagName.toLowerCase()} class="${hit?.className}">`);
        }
      }
      return bad;
    });
    expect(problems).toEqual([]);
  });

  test('a slotted tool button is laid out inside the toolbar', async () => {
    await mount(page, { id: 'slotted', slotted: true });
    const placement = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const mine = host.querySelector('#mine')!.getBoundingClientRect();
      const toolbar = host.shadowRoot!.querySelector('.paint-toolbar')!.getBoundingClientRect();
      return {
        mine: { w: mine.width, h: mine.height, top: mine.top, bottom: mine.bottom },
        toolbar: { top: toolbar.top, bottom: toolbar.bottom },
      };
    });
    expect(placement.mine.w).toBeGreaterThan(0);
    expect(placement.mine.h).toBeGreaterThan(0);
    expect(placement.mine.top).toBeGreaterThanOrEqual(placement.toolbar.top - 1);
    expect(placement.mine.bottom).toBeLessThanOrEqual(placement.toolbar.bottom + 1);
  });

  test('a real gesture paints where the pointer went', async () => {
    await mount(page, { id: 'gesture', strokes: 'none' });
    const count = await page.evaluate(() => (window as any).matrix.draw([
      [100, 100], [300, 200], [500, 120],
    ]));
    expect(count).toBe(1);

    const points = await page.evaluate(() => (window as any).matrix.el.getStrokes()[0].points);
    expect(points[0].x).toBeCloseTo(100, 0);
    expect(points[0].y).toBeCloseTo(100, 0);
    expect(points[points.length - 1].x).toBeCloseTo(500, 0);
  });

  test('a disabled canvas ignores the same gesture', async () => {
    await mount(page, { id: 'gesture-disabled', disabled: true, strokes: 'none' });
    expect(await page.evaluate(() => (window as any).matrix.draw([
      [100, 100], [300, 200], [500, 120],
    ]))).toBe(0);
  });
});

// ── LAYER 2: real pixels, four pinned combos ────────────────────────────────

test.describe('snice-paint visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('each swatch paints its own colour', async () => {
    await mount(page, { id: 'px-swatches', strokes: 'none' });
    const probe = `(host) => [...host.shadowRoot.querySelectorAll('.paint-swatch')]
      .slice(0, 4)
      .map((s) => { const b = s.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })`;
    const pixels = await capture(page, '#subject', 'paint-swatches', probe);
    expect(pixels).toHaveLength(4);

    // The documented default palette starts blue, red, green, amber: compare
    // the channel ORDER a human reads rather than exact triples, so the border
    // radius antialiasing cannot flake this.
    const order = (c: RGB) => [0, 1, 2].sort((a, b) => c[b] - c[a]).join('');
    const expected = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'].map((hex): RGB => [
      parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16),
    ]);
    for (let i = 0; i < pixels.length; i++) {
      expect(order(pixels[i]), `swatch ${i} painted ${pixels[i]}`).toBe(order(expected[i]));
    }
  });

  test('the background colour fills the whole canvas', async () => {
    await mount(page, { id: 'px-background', backgroundColor: '#102030', strokes: 'none' });
    const pixels = await Promise.all([[10, 10], [300, 200], [590, 380]].map(([x, y]) =>
      page.evaluate(([px, py]) => (window as any).matrix.pixel(px, py), [x, y])));
    for (const pixel of pixels) {
      expect(pixel, `painted ${pixel}`).toEqual([16, 32, 48, 255]);
    }
  });

  test('a loaded stroke paints in its own colour', async () => {
    await mount(page, { id: 'px-strokes', backgroundColor: '#ffffff', strokes: 'line' });
    const ink: RGB = await page.evaluate(() => (window as any).matrix.pixel(160, 140));
    const ground: RGB = await page.evaluate(() => (window as any).matrix.pixel(560, 360));
    expect(ground.slice(0, 3)).toEqual([255, 255, 255]);
    // #ef4444 is a warm red.
    expect(ink[0]).toBeGreaterThan(ink[1]);
    expect(ink[0]).toBeGreaterThan(ink[2]);
    expect(sameColor(ink.slice(0, 3) as RGB, ground.slice(0, 3) as RGB)).toBe(false);
  });

  test('the eraser paints the background back over the ink', async () => {
    await mount(page, { id: 'px-eraser', backgroundColor: '#204060', strokes: 'none' });
    await page.evaluate(() => (window as any).matrix.draw([[100, 100], [300, 100], [500, 100]]));
    const painted: RGB = await page.evaluate(() => (window as any).matrix.pixel(300, 100));
    expect(painted.slice(0, 3), `ink painted ${painted}`).not.toEqual([32, 64, 96]);

    await page.evaluate(() => (window as any).matrix.press('Eraser'));
    await page.evaluate(() => (window as any).matrix.draw([[100, 100], [300, 100], [500, 100]]));
    const erased: RGB = await page.evaluate(() => (window as any).matrix.pixel(300, 100));
    // "eraser" is only an eraser because it paints `backgroundColor`.
    expect(erased.slice(0, 3), `erased to ${erased}`).toEqual([32, 64, 96]);
  });
});
