/**
 * snice-draw TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/draw, 89 combos) owns the stroke MODEL: which
 * gesture becomes which `DrawStroke`, what undo/redo do to the history, what
 * `setStrokes` reloads. It cannot own any of the below, because happy-dom
 * neither lays out the canvas nor rasterises a single line — its 2D context is
 * a call recorder, so "the component asked for a stroke" is all a DOM test can
 * ever prove.
 *
 * LAYER 1 — geometry / computed style / occlusion, for
 *   {6 tools} x {enabled, disabled} = 12 combos, plus the buffer-sizing and
 *   pointer-mapping probes. The interesting axis is the canvas BUFFER: the
 *   component sizes it from the measured box times devicePixelRatio, and a
 *   mismatch there is exactly the bug that makes ink land away from the cursor.
 *
 * LAYER 2 — real pixels, four pinned combos: ink is painted where the pointer
 * went, the background colour fills the canvas, the eraser paints background
 * rather than colour, and `clear()` puts the background back.
 */
import { test, expect, type Page } from '@playwright/test';
import { openChartStage, mount, collectChartProblems } from '../chart-visual-support';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/draw/matrix.html';

const TOOLS = ['pen', 'eraser', 'line', 'rectangle', 'circle', 'text'] as const;

test.describe('snice-draw visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  /**
   * FINDING VISUAL-MATRIX-draw-4 (engines with devicePixelRatio ≠ 1).
   *
   * The buffer claim this layer owns — "the drawing buffer matches the box in
   * device pixels" — is broken for real wherever the device grid is finer
   * than 1:1. `initCanvas()` sizes the bitmap to box × devicePixelRatio and
   * then assigns `this.width`/`this.height` (both `@property`), and the render
   * those writes schedule re-emits the canvas's `width`/`height` ATTRIBUTES at
   * the LOGICAL size — which per the HTML spec resets the bitmap. At dpr 1
   * that stomp is invisible in geometry and only the transparency half shows
   * (that is FINDING MATRIX-draw-3 below). At dpr ≠ 1 — Playwright's WebKit
   * on a scaled display reports 2 — the same defect clamps the buffer back to
   * 1× FOREVER, so the still-applied `ctx.scale(dpr, dpr)` paints every
   * stroke at the wrong scale and ink lands away from the pointer.
   *
   * Chromium, this tier's default engine, runs at dpr 1 and cannot expose it,
   * which is why the DOM tier never saw it either. The assertion stays as
   * written; the affected engines pin it, and a fixed component turns the pin
   * red ("expected to fail but passed") exactly like MATRIX-draw-3's.
   */
  for (const tool of TOOLS) {
    for (const disabled of [false, true]) {
      const id = `${tool}/${disabled ? 'disabled' : 'enabled'}`;
      test(id, async () => {
        test.fail(await page.evaluate(() => window.devicePixelRatio !== 1),
          'VISUAL-MATRIX-draw-4: the re-emitted 1× width/height attributes'
          + ' stomp the devicePixelRatio-sized buffer (see the finding comment)');
        await mount(page, { id, tool, disabled, strokes: 'many' });

        expect(await collectChartProblems(page, {
          surface: '[part~="base"]',
          marks: '[part~="canvas"]',
          marks_expected: 1,
          occlusion: true,
          boxes: ['[part~="base"]', '[part~="canvas"]'],
        }), `${id}: shell`).toEqual([]);

        const geometry = await page.evaluate(() => {
          const host = document.getElementById('subject')!;
          const sr = host.shadowRoot!;
          const canvas = sr.querySelector('canvas') as HTMLCanvasElement;
          const box = canvas.getBoundingClientRect();
          const hostBox = host.getBoundingClientRect();
          const cs = getComputedStyle(canvas);
          return {
            box: { w: box.width, h: box.height },
            host: { w: hostBox.width, h: hostBox.height },
            buffer: { w: canvas.width, h: canvas.height },
            dpr: window.devicePixelRatio,
            cursor: cs.cursor,
            opacity: Number(cs.opacity),
          };
        });

        // The canvas fills the host it was given.
        expect(geometry.box.w).toBeCloseTo(geometry.host.w, 0);
        expect(geometry.box.h).toBeCloseTo(geometry.host.h, 0);
        // The drawing buffer matches the box in device pixels; anything else
        // means ink lands away from the cursor.
        expect(geometry.buffer.w).toBeCloseTo(geometry.box.w * geometry.dpr, 0);
        expect(geometry.buffer.h).toBeCloseTo(geometry.box.h * geometry.dpr, 0);
        // A disabled canvas says so, and a live one offers a drawing cursor.
        expect(geometry.cursor, `${id}: cursor`).not.toBe('auto');
        if (disabled) expect(geometry.opacity).toBeLessThan(1);
        else expect(geometry.opacity).toBe(1);
      });
    }
  }
});

test.describe('snice-draw visual matrix (layer 1: pointer mapping)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('a real gesture records a stroke that tracks the pointer', async () => {
    await mount(page, { id: 'gesture', strokes: 'none' });
    const count = await page.evaluate(() => (window as any).matrix.draw([
      [100, 100], [300, 200], [500, 120],
    ]));
    expect(count).toBe(1);

    const points = await page.evaluate(() =>
      (window as any).matrix.el.getStrokes()[0].points);
    // Sampled in canvas space: the mapping from client coordinates has to land
    // inside the buffer, which is the whole reason the box is measured.
    expect(points.length).toBeGreaterThan(1);
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1280);
      expect(point.y).toBeLessThanOrEqual(960);
    }
    expect(Math.max(...points.map((p: any) => p.x))).toBeGreaterThan(200);
  });

  test('a disabled canvas ignores the same gesture', async () => {
    await mount(page, { id: 'gesture-disabled', disabled: true, strokes: 'none' });
    const count = await page.evaluate(() => (window as any).matrix.draw([
      [100, 100], [300, 200], [500, 120],
    ]));
    expect(count).toBe(0);
  });
});

// ── LAYER 2: real pixels, four pinned combos ────────────────────────────────

test.describe('snice-draw visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  /**
   * FINDING MATRIX-draw-3 (browser-only).
   *
   * `backgroundColor: string = '#ffffff'` is documented as the canvas's
   * background — it is what an exported PNG shows behind the strokes and what
   * the eraser paints with. `initCanvas()` does fill it, and then immediately
   * loses it: the same method assigns `this.width` and `this.height` (both
   * `@property`), and the render those writes schedule re-emits the canvas's
   * `width`/`height` ATTRIBUTES, which resets the bitmap to fully transparent
   * per the HTML spec. A freshly mounted canvas is therefore transparent, and
   * `toDataURL()` on it exports a transparent PNG rather than the documented
   * background, until the first `clear()` or stroke repaints it.
   *
   * (happy-dom cannot see this: its 2D context is a call recorder with no
   * bitmap to reset, which is exactly why the finding belongs to this tier.)
   */
  test('MATRIX-draw-3: the background colour fills the whole canvas', async () => {
    test.fail();
    await mount(page, { id: 'px-background', backgroundColor: '#102030', strokes: 'none' });
    const probe = `(host) => { const b = host.shadowRoot.querySelector('canvas').getBoundingClientRect();
      return [{ x: b.left + 4, y: b.top + 4 },
              { x: b.left + b.width / 2, y: b.top + b.height / 2 },
              { x: b.right - 4, y: b.bottom - 4 }]; }`;
    const pixels = await capture(page, '#subject', 'draw-background', probe);
    // #102030 exactly: a background that is merely "not the stage colour" could
    // still be the browser's default white.
    for (const pixel of pixels) {
      expect(pixel, `painted ${pixel}`).toEqual([16, 32, 48]);
    }
  });

  test('MATRIX-draw-3 reproduces: a freshly mounted canvas is transparent', async () => {
    await mount(page, { id: 'px-background-repro', backgroundColor: '#102030', strokes: 'none' });
    const fresh = await page.evaluate(() => (window as any).matrix.pixel(10, 10));
    expect(fresh, 'alpha 0 everywhere').toEqual([0, 0, 0, 0]);

    // The very first repaint restores it, which is why the defect is easy to
    // miss: only the untouched canvas is wrong.
    await page.evaluate(async () => {
      (window as any).matrix.el.clear();
      await (window as any).matrix.settle();
    });
    expect(await page.evaluate(() => (window as any).matrix.pixel(10, 10)))
      .toEqual([16, 32, 48, 255]);
  });

  test('a repainted canvas fills the documented background everywhere', async () => {
    await mount(page, { id: 'px-background-clear', backgroundColor: '#102030', strokes: 'none' });
    await page.evaluate(async () => {
      (window as any).matrix.el.clear();
      await (window as any).matrix.settle();
    });

    const probe = `(host) => { const b = host.shadowRoot.querySelector('canvas').getBoundingClientRect();
      return [{ x: b.left + 4, y: b.top + 4 },
              { x: b.left + b.width / 2, y: b.top + b.height / 2 },
              { x: b.right - 4, y: b.bottom - 4 }]; }`;
    const pixels = await capture(page, '#subject', 'draw-background-cleared', probe);
    for (const pixel of pixels) {
      expect(pixel, `painted ${pixel}`).toEqual([16, 32, 48]);
    }
  });

  test('a loaded stroke paints in its own colour', async () => {
    await mount(page, { id: 'px-strokes', backgroundColor: '#ffffff', strokes: 'line' });
    // The stroke runs (80,80) → (240,200) → (400,100) in canvas space, drawn as
    // quadratic segments through the MIDPOINTS of those points.
    const ink: RGB = await page.evaluate(() => (window as any).matrix.pixel(160, 140));
    const ground: RGB = await page.evaluate(() => (window as any).matrix.pixel(600, 380));
    expect(ground.slice(0, 3)).toEqual([255, 255, 255]);
    // #e11d48 is a warm red.
    expect(ink[0]).toBeGreaterThan(ink[1]);
    expect(ink[0]).toBeGreaterThan(ink[2]);
    expect(sameColor(ink.slice(0, 3) as RGB, ground.slice(0, 3) as RGB)).toBe(false);
  });

  test('the eraser paints the background, not the colour', async () => {
    // "eraser" is documented as a tool, and the only thing that makes it an
    // eraser rather than a white pen is that it follows `backgroundColor`.
    await mount(page, { id: 'px-eraser', backgroundColor: '#204060', color: '#ff0000', strokes: 'none' });
    await page.evaluate(() => (window as any).matrix.el.tool = 'eraser');
    await page.evaluate(() => (window as any).matrix.settle());
    await page.evaluate(() => (window as any).matrix.draw([[100, 100], [300, 100], [500, 100]]));

    const onPath: RGB = await page.evaluate(() => (window as any).matrix.pixel(300, 100));
    expect(onPath.slice(0, 3), `eraser painted ${onPath}`).toEqual([32, 64, 96]);
  });

  test('clear() paints the background back over the ink', async () => {
    await mount(page, { id: 'px-clear', backgroundColor: '#ffffff', strokes: 'line' });
    const before: RGB = await page.evaluate(() => (window as any).matrix.pixel(160, 140));
    expect(before.slice(0, 3)).not.toEqual([255, 255, 255]);

    await page.evaluate(async () => {
      (window as any).matrix.el.clear();
      await (window as any).matrix.settle();
    });
    const after: RGB = await page.evaluate(() => (window as any).matrix.pixel(160, 140));
    expect(after.slice(0, 3), `after clear ${after}`).toEqual([255, 255, 255]);
  });
});
