/**
 * snice-qr-reader TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/qr-reader, 68 combos) owns which
 * part exists in which state, which facingMode a camera value maps to, and
 * what `qr-scan` carries. It cannot own any of the below, because happy-dom
 * performs no layout AND has no media stack: the `<video>` there has no
 * frames, the viewport reads 0x0, and the scanning frame's four corner markers
 * are just four divs with no positions to compare.
 *
 * LAYER 1 — geometry / occlusion / computed style, for
 *   {4 mode vectors} x {2 cameras} x {idle, scanning} = 16 combos, plus the
 * five measurements that are the reason this tier exists for a camera surface:
 * the video really fills the viewport, the scan frame really is a frame, the
 * controls really sit over the video rather than under it, the result banner
 * really does not bury the controls, and a denied camera really shows its
 * error on screen.
 *
 * LAYER 2 — real screenshots, two pinned combos only.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  openChartStage, mount, collectChartProblems, type ChartProbe,
} from '../chart-visual-support';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/qr-reader/matrix.html';

const MODES = [
  { id: 'plain', flags: {} },
  { id: 'pick-first', flags: { pickFirst: true } },
  { id: 'manual-snap', flags: { manualSnap: true } },
  { id: 'tap-start', flags: { tapStart: true } },
];

interface Combo {
  id: string;
  camera: 'front' | 'back';
  start: boolean;
  pickFirst?: boolean;
  manualSnap?: boolean;
  tapStart?: boolean;
}

function combos(): Combo[] {
  const out: Combo[] = [];
  for (const mode of MODES) {
    for (const camera of ['back', 'front'] as const) {
      for (const start of [false, true]) {
        out.push({
          id: `${mode.id}/${camera}/${start ? 'scanning' : 'idle'}`,
          camera, start, ...mode.flags,
        });
      }
    }
  }
  return out;
}

/**
 * The reader's marks are its control buttons. Occlusion is the check with no
 * DOM equivalent here: the controls sit ON TOP of a full-bleed video, so a
 * z-index or stacking-context mistake makes every button unclickable while
 * leaving the DOM perfectly correct.
 */
const PROBE: ChartProbe = {
  surface: '.qr-reader-container',
  marks: '.qr-btn',
  minMarks: 2,
  requireDistinctPositions: true,
  occlusion: true,
  boxes: ['[part~="viewport"]', '[part~="video"]', '[part~="controls"]'],
};

test.describe('snice-qr-reader visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const combo of combos()) {
    test(combo.id, async () => {
      await mount(page, combo);
      expect(await collectChartProblems(page, PROBE), combo.id).toEqual([]);
    });
  }
});

test.describe('snice-qr-reader visual matrix (layer 1: measured geometry)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the live video fills the viewport it is framed by', async () => {
    // A camera preview that leaves letterbox gaps, or that overflows its
    // rounded viewport, is the classic object-fit regression — and it is
    // invisible to every DOM assertion because the markup is identical.
    await mount(page, { id: 'fill', camera: 'back', start: true });
    const geometry = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const viewport = sr.querySelector('[part~="viewport"]')!.getBoundingClientRect();
      const video = sr.querySelector('[part~="video"]')! as HTMLVideoElement;
      const box = video.getBoundingClientRect();
      return {
        viewport: { width: viewport.width, height: viewport.height, left: viewport.left, top: viewport.top },
        video: { width: box.width, height: box.height, left: box.left, top: box.top },
        objectFit: getComputedStyle(video).objectFit,
        hasFrames: video.videoWidth > 0 && video.videoHeight > 0,
      };
    });

    expect(geometry.hasFrames, 'the video element never received a frame').toBe(true);
    expect(geometry.video.width).toBeGreaterThan(0);
    expect(geometry.video.height).toBeGreaterThan(0);
    // Within a pixel of the frame it is supposed to fill.
    expect(Math.abs(geometry.video.width - geometry.viewport.width)).toBeLessThan(1.5);
    expect(Math.abs(geometry.video.height - geometry.viewport.height)).toBeLessThan(1.5);
  });

  test('the scan frame really is a frame: one marker per corner', async () => {
    // Four absolutely-positioned corner markers are trivially "present" in the
    // DOM and can still all land on top of each other. Only boxes prove they
    // bracket the viewport.
    await mount(page, { id: 'corners', camera: 'back', start: true });
    const corners = await page.evaluate(() => (window as any).matrix.cornerBoxes());
    const viewport = await page.evaluate(() => {
      const b = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="viewport"]')!.getBoundingClientRect();
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    });

    expect(corners.length).toBe(4);
    const centreX = (viewport.left + viewport.right) / 2;
    const centreY = (viewport.top + viewport.bottom) / 2;
    const quadrant = (c: any) => `${c.left < centreX ? 'l' : 'r'}${c.top < centreY ? 't' : 'b'}`;
    expect(new Set(corners.map(quadrant)).size, 'corner markers do not occupy four quadrants').toBe(4);
    for (const corner of corners) {
      expect(corner.width, 'a corner marker has no width').toBeGreaterThan(0);
      expect(corner.height, 'a corner marker has no height').toBeGreaterThan(0);
    }
  });

  test('the controls sit over the video, not under it', async () => {
    await mount(page, { id: 'controls-over', camera: 'back', start: true });
    const problems = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const out: string[] = [];
      for (const button of sr.querySelectorAll('.qr-btn')) {
        const box = button.getBoundingClientRect();
        const hit = (sr as any).elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        if (!hit) { out.push('nothing hit-tests at a control centre'); continue; }
        if (hit !== button && !button.contains(hit)) {
          out.push(`a control is covered by <${hit.tagName.toLowerCase()} class="${hit.className}">`);
        }
      }
      return out;
    });
    expect(problems).toEqual([]);
  });

  test('the result banner does not bury the controls', async () => {
    // `result` is documented as an output surface, not a modal: a page that
    // scanned one code must still be able to stop the reader.
    await mount(page, { id: 'result', camera: 'back', start: true, decodes: 'https://example.com' } as any);
    const state = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const result = sr.querySelector('[part~="result"]');
      if (!result) return { hasResult: false, covered: [] as string[] };
      const covered: string[] = [];
      for (const button of sr.querySelectorAll('.qr-btn')) {
        const box = button.getBoundingClientRect();
        const hit = (sr as any).elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        if (hit && hit !== button && !button.contains(hit)) covered.push(String((hit as HTMLElement).className));
      }
      const box = result.getBoundingClientRect();
      return { hasResult: true, covered, width: box.width, height: box.height };
    });
    expect(state.hasResult, 'a decoded code produced no result banner').toBe(true);
    expect(state.covered).toEqual([]);
    expect(state.width).toBeGreaterThan(0);
    expect(state.height).toBeGreaterThan(0);
  });

  test('a denied camera shows its error on screen', async () => {
    await mount(page, { id: 'denied', camera: 'back', start: true, deny: true } as any);
    const error = await page.evaluate(() => {
      const node = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="error-text"]') as HTMLElement | null;
      if (!node) return null;
      const box = node.getBoundingClientRect();
      const cs = getComputedStyle(node);
      return {
        text: (node.textContent ?? '').trim(),
        width: box.width, height: box.height,
        display: cs.display, opacity: Number(cs.opacity), fontSize: parseFloat(cs.fontSize),
      };
    });
    expect(error, 'no part="error-text" rendered for a denied camera').not.toBeNull();
    expect(error!.text.length).toBeGreaterThan(0);
    expect(error!.width).toBeGreaterThan(0);
    expect(error!.height).toBeGreaterThan(0);
    expect(error!.display).not.toBe('none');
    expect(error!.opacity).toBeGreaterThan(0);
    expect(error!.fontSize).toBeGreaterThanOrEqual(8);
  });

  test('tap-start starts the camera from a real click on the viewport', async () => {
    // The DOM tier can dispatch a synthetic click; only a browser proves the
    // viewport is actually the topmost element at its own centre, which is
    // what makes the documented gesture reachable.
    await mount(page, { id: 'tap', camera: 'back', start: false, tapStart: true });
    expect(await page.evaluate(() => (window as any).matrix.tapViewport())).toBe(true);
    const scanning = await page.evaluate(() => !!(document.getElementById('subject') as any).scanning);
    expect(scanning).toBe(true);
  });
});

// ── LAYER 2: real pixels, two pinned combos ─────────────────────────────────

test.describe('snice-qr-reader visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the live preview really paints camera frames', async () => {
    // The video element can have a stream, a box and a computed style and
    // still paint nothing. Two probes into regions the synthetic frame paints
    // differently is the only proof that pixels arrived.
    await mount(page, { id: 'px-preview', camera: 'back', start: true });
    const probe = `(host) => { const v = host.shadowRoot.querySelector('[part~="video"]');
      const b = v.getBoundingClientRect();
      return [{ x: b.left + b.width * 0.12, y: b.top + b.height * 0.12 },
              { x: b.left + b.width * 0.75, y: b.top + b.height * 0.75 }]; }`;
    const [patch, ground] = await capture(page, '#subject', 'qr-reader-preview', probe);
    expect(sameColor(patch, ground), 'the preview paints one flat colour, so no frame arrived').toBe(false);
  });

  test('a control icon is legible against the preview behind it', async () => {
    await mount(page, { id: 'px-controls', camera: 'back', start: true });
    const probe = `(host) => { const b = host.shadowRoot.querySelector('.qr-btn').getBoundingClientRect();
      return [{ x: b.left + b.width / 2, y: b.top + b.height / 2 },
              { x: b.left + b.width / 2, y: b.top - 12 }]; }`;
    const [button, behind] = await capture(page, '#subject', 'qr-reader-controls', probe);
    // A control chrome that paints the same as the video behind it is
    // invisible; this is a floor on "can a human find the button", not a WCAG
    // certification.
    expect(contrast(button, behind)).toBeGreaterThan(1.15);
  });
});
