/**
 * snice-camera TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/camera, 66 combos) owns which parts
 * exist, which constraints `start()` sends and what `capture()` returns. It
 * cannot own any of the below, because happy-dom performs no layout and has no
 * media stack: the `<video>` there has no frames, `controls-position` is a
 * class name with no position behind it, `object-fit` is a string, and
 * `mirror` is a boolean nobody can see.
 *
 * LAYER 1 — geometry / occlusion / computed style, for
 *   {9 control positions} + {2 object-fits x 3 aspect ratios} = 15 combos,
 * plus the measurements that only a real engine can make: the controls really
 * land on the side they name, the preview really fills (or fits inside) its
 * host, a slotted overlay really sits above the built-in bar, and every
 * control is really clickable through the video underneath it.
 *
 * LAYER 2 — real screenshots, two pinned combos: the preview really paints
 * camera frames, and `mirror` really flips them.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/camera/matrix.html';

const POSITIONS = [
  'auto', 'bottom', 'right', 'left', 'top',
  'bottom-left', 'bottom-right', 'top-left', 'top-right',
] as const;

const PROBE: ChartProbe = {
  surface: '.camera-container',
  marks: '.camera-btn',
  minMarks: 1,
  requireDistinctPositions: true,
  occlusion: true,
  boxes: ['[part~="base"]', '[part~="controls"]', 'video'],
};

test.describe('snice-camera visual matrix (layer 1: control placement)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const controlsPosition of POSITIONS) {
    test(`controls-position=${controlsPosition}`, async () => {
      await mount(page, { id: controlsPosition, controlsPosition, start: true });
      expect(await collectChartProblems(page, PROBE), controlsPosition).toEqual([]);
    });
  }

  test('each named edge really puts the controls on that edge', async () => {
    // Nine documented placements that all render at the same coordinates would
    // satisfy every DOM assertion and be a single placement. Only boxes tell
    // them apart, and the check is the DIRECTION each name promises.
    const measured: Record<string, { cx: number; cy: number }> = {};
    for (const controlsPosition of POSITIONS.filter(p => p !== 'auto')) {
      await mount(page, { id: controlsPosition, controlsPosition, start: true });
      measured[controlsPosition] = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const host = document.getElementById('subject')!.getBoundingClientRect();
        const bar = sr.querySelector('[part~="controls"]')!.getBoundingClientRect();
        return {
          cx: (bar.left + bar.right) / 2 - (host.left + host.right) / 2,
          cy: (bar.top + bar.bottom) / 2 - (host.top + host.bottom) / 2,
        };
      });
    }

    const problems: string[] = [];
    const check = (name: string, ok: boolean) => { if (!ok) problems.push(name); };
    check('bottom is not below centre', measured.bottom.cy > 0);
    check('top is not above centre', measured.top.cy < 0);
    check('left is not left of centre', measured.left.cx < 0);
    check('right is not right of centre', measured.right.cx > 0);
    check('bottom-left is not bottom-left', measured['bottom-left'].cx < 0 && measured['bottom-left'].cy > 0);
    check('bottom-right is not bottom-right', measured['bottom-right'].cx > 0 && measured['bottom-right'].cy > 0);
    check('top-left is not top-left', measured['top-left'].cx < 0 && measured['top-left'].cy < 0);
    check('top-right is not top-right', measured['top-right'].cx > 0 && measured['top-right'].cy < 0);
    expect(problems).toEqual([]);
  });
});

test.describe('snice-camera visual matrix (layer 1: framing)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const objectFit of ['cover', 'contain'] as const) {
    for (const aspectRatio of ['auto', '16:9', '1:1'] as const) {
      test(`object-fit=${objectFit}/aspect-ratio=${aspectRatio}`, async () => {
        await mount(page, { id: `${objectFit}-${aspectRatio}`, objectFit, aspectRatio, start: true });
        expect(await collectChartProblems(page, PROBE), `${objectFit}/${aspectRatio}`).toEqual([]);
      });
    }
  }

  /**
   * VISUAL-MATRIX-camera-1 (FIXED) — writing the documented default
   * `aspect-ratio="auto"` used to collapse the camera to a zero-height box:
   * the stylesheet gave the explicit `auto` selector `height: 100%` of a
   * height-less parent while the omitted default got the 4:3 padding-bottom
   * box. `auto` now selects the same default-box rules the omitted attribute
   * does, so spelling the default out renders exactly what omitting it does.
   */
  test('VISUAL-MATRIX-camera-1 (fixed): aspect-ratio="auto" renders the same visible camera as omitting it', async () => {
    await mount(page, { id: 'implicit', start: true });
    const implicit = await page.evaluate(() => {
      const b = document.getElementById('subject')!.getBoundingClientRect();
      return { width: b.width, height: b.height };
    });

    await mount(page, { id: 'explicit-auto', aspectRatio: 'auto', start: true });
    const explicit = await page.evaluate(() => {
      const b = document.getElementById('subject')!.getBoundingClientRect();
      return { width: b.width, height: b.height };
    });

    expect(implicit.height, 'the implicit default renders no height either').toBeGreaterThan(0);
    expect(explicit.height, 'aspect-ratio="auto" renders a zero-height camera').toBeGreaterThan(0);
  });

  test('object-fit is applied to the preview, and the two values differ', async () => {
    // `objectFit: 'contain'|'cover' = 'cover'`. In happy-dom this is a string
    // on an element; only a real engine resolves it to a paint behaviour, and
    // a component that forgot to wire it up looks identical in the DOM.
    const seen: Record<string, string> = {};
    for (const objectFit of ['cover', 'contain'] as const) {
      await mount(page, { id: objectFit, objectFit, aspectRatio: '1:1', start: true });
      seen[objectFit] = await page.evaluate(() => getComputedStyle(
        document.getElementById('subject')!.shadowRoot!.querySelector('video')!,
      ).objectFit);
    }
    expect(seen.cover).toBe('cover');
    expect(seen.contain).toBe('contain');
  });

  test('every documented aspect-ratio shapes the camera to that ratio', async () => {
    // `aspectRatio: string = 'auto' — 'auto','16:9','9:16','4:3','1:1','21:9'`.
    // A ratio is a LAYOUT fact and nothing else: in happy-dom all six render
    // the same 0x0 box, so this tier is the only place the property means
    // anything. The stage fixes the width, so the height is the component's
    // own answer.
    const RATIOS: Array<[string, number]> = [
      ['16:9', 16 / 9], ['9:16', 9 / 16], ['4:3', 4 / 3], ['1:1', 1], ['21:9', 21 / 9],
    ];
    const problems: string[] = [];
    for (const [aspectRatio, expected] of RATIOS) {
      await mount(page, { id: `ratio-${aspectRatio}`, aspectRatio, start: true });
      const measured = await page.evaluate(() => {
        const box = document.getElementById('subject')!
          .shadowRoot!.querySelector('.camera-container')!.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
      if (measured.height <= 0) { problems.push(`${aspectRatio}: container has no height`); continue; }
      const ratio = measured.width / measured.height;
      // 1% of the ratio covers sub-pixel rounding at these sizes.
      if (Math.abs(ratio - expected) / expected > 0.01) {
        problems.push(`${aspectRatio}: rendered ${ratio.toFixed(3)}, expected ${expected.toFixed(3)}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test('the preview fills the box the aspect ratio produced', async () => {
    // Whatever shape the ratio chose, the camera feed must occupy it: a
    // preview that leaves a band of the container's own background is the
    // letterbox regression, and it is invisible to every DOM assertion.
    const problems: string[] = [];
    for (const objectFit of ['cover', 'contain'] as const) {
      for (const aspectRatio of ['16:9', '9:16', '4:3', '1:1', '21:9'] as const) {
        // `auto` is excluded here and pinned by VISUAL-MATRIX-camera-1 above: it
        // renders no box at all, so there is no box for a preview to fill.
        await mount(page, { id: 'fit', objectFit, aspectRatio, start: true });
        const gap = await page.evaluate(() => {
          const sr = document.getElementById('subject')!.shadowRoot!;
          const container = sr.querySelector('.camera-container')!.getBoundingClientRect();
          const video = sr.querySelector('video')!.getBoundingClientRect();
          return {
            width: Math.abs(video.width - container.width),
            height: Math.abs(video.height - container.height),
            escapes: video.left < container.left - 1 || video.right > container.right + 1
              || video.top < container.top - 1 || video.bottom > container.bottom + 1,
          };
        });
        if (gap.escapes) problems.push(`${objectFit}/${aspectRatio}: preview escapes its container`);
        if (gap.width > 1.5 || gap.height > 1.5) {
          problems.push(`${objectFit}/${aspectRatio}: preview leaves a ${gap.width.toFixed(1)}x${gap.height.toFixed(1)} gap`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('a slotted overlay sits above the built-in controls', async () => {
    // "Slots — controls: Custom controls overlay (full viewport, positioned
    // absolutely)". "Overlay" is a stacking claim, and stacking is invisible
    // to the DOM.
    await mount(page, { id: 'slotted', slotted: true, controlsPosition: 'bottom-left', start: true });
    const hit = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const button = host.querySelector('#mine')!.getBoundingClientRect();
      const x = button.left + button.width / 2;
      const y = button.top + button.height / 2;
      const found = document.elementFromPoint(x, y);
      return found ? (found as HTMLElement).id || found.tagName.toLowerCase() : null;
    });
    // The custom button is light DOM, so `document.elementFromPoint` reaches it
    // directly when nothing of the component's own is painted over it.
    expect(hit).toBe('mine');
  });
});

// ── LAYER 2: real pixels, two pinned combos ─────────────────────────────────

test.describe('snice-camera visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  /** Probe a point 15% from each side of the preview, vertically centred. */
  const EDGES = `(host) => { const b = host.shadowRoot.querySelector('video').getBoundingClientRect();
    return [{ x: b.left + b.width * 0.15, y: b.top + b.height / 2 },
            { x: b.left + b.width * 0.85, y: b.top + b.height / 2 }]; }`;

  test('the preview paints real camera frames', async () => {
    // The synthetic frame is red on the left and green on the right, so two
    // probes prove both that pixels arrived and that they arrived the right
    // way round.
    await mount(page, {
      id: 'px-frames', facingMode: 'environment', mirror: false,
      objectFit: 'cover', aspectRatio: '16:9', start: true,
    });
    const [left, right] = await capture(page, '#subject', 'camera-preview-unmirrored', EDGES);
    expect(sameColor(left, right), 'the preview is one flat colour, so no frame arrived').toBe(false);
    expect(left[0], 'the left edge is not the red side of the frame').toBeGreaterThan(left[1]);
    expect(right[1], 'the right edge is not the green side of the frame').toBeGreaterThan(right[0]);
  });

  test('mirror flips the preview left-to-right', async () => {
    // `mirror: boolean = true` has no DOM-visible effect whatsoever: it is a
    // transform on painted pixels. Red and green must swap sides.
    await mount(page, {
      id: 'px-mirror', facingMode: 'user', mirror: true,
      objectFit: 'cover', aspectRatio: '16:9', start: true,
    });
    const [left, right] = await capture(page, '#subject', 'camera-preview-mirrored', EDGES);
    expect(left[1], 'the mirrored preview does not show green on the left').toBeGreaterThan(left[0]);
    expect(right[0], 'the mirrored preview does not show red on the right').toBeGreaterThan(right[1]);
  });
});
