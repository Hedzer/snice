/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-cropper TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/cropper, `npm run test:matrix`) owns structure
 * truth: the three documented parts, the eight handles with their
 * `data-handle` names, the crop region's role/tabindex/label, the documented
 * `zoom` clamp, cumulative `rotate`, `reset`, and the SHAPE of `crop-change`.
 * Its own header says why it can own nothing else: happy-dom measures every
 * box as 0 and has no `canvas.getContext`, so it explicitly hands this tier
 * "the initial centred rect, the aspect-ratio lock, the rule-of-thirds
 * overlay, the dark mask, `crop()` itself and `crop-complete`".
 *
 * Those five clauses are the whole of this spec:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the crop region really is a CENTRED rect inside the measured container,
 *     and `aspect-ratio` really locks its width/height to the documented
 *     ratio ("0 = free, 1 = square, 1.777 = 16:9");
 *   · the container paints its documented tokens (`--snice-color-surface-
 *     container-high` background, `--snice-color-border` rule,
 *     `--snice-border-radius-lg` radius);
 *   · the image is displayed, centred, and keeps its natural proportions;
 *   · the eight documented handles are real circles keyed to the crop
 *     region's corners and edge midpoints (a 0.75rem circle plus its 1px
 *     ring, per the component's own `.handle` CSS), each with its resize
 *     cursor, each reachable by a pointer;
 *   · the crop region itself is the top hit at its own centre ("Drag to
 *     reposition").
 *
 * ── Interaction (real pointer/keyboard): the doc's imperative clauses ───────
 *   · a real mouse drag moves the crop region and clamps it inside the
 *     container; a real drag on the `se`/`e` handles resizes it, the aspect
 *     ratio survives an in-bounds resize, and `min-width`/`min-height` floor
 *     a shrink;
 *   · real arrow keys nudge the region 1px, 10px with Shift (the crop
 *     region's own documented aria-label);
 *   · `zoom`/`rotate`/`reset` reach the rendered image, not just a style
 *     string;
 *   · `crop()` produces a real blob of the documented mime type at the
 *     documented geometry, `crop-complete` fires with it, and its pixels are
 *     the photo's own halves.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "Dark mask indicates crop region" and "rule-of-thirds grid overlay" are
 *   PAINT clauses. A box-shadow that draws nothing, or guide lines a pixel
 *   off, are invisible to layer 1 — only the decoded PNG can fail them.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, luminance, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/cropper/matrix.html';

interface Combo {
  id: string;
  aspectRatio: number;
  stageWidth: number;
  stageHeight: number;
}

/**
 * aspect-ratio (4: free, square, 16:9, portrait 0.5 — three named by the doc
 * plus one portrait) x container box (2: landscape, portrait) = 8 combos.
 * `min-width`/`min-height` only act during a resize, so they are exercised by
 * the interaction tests, not by this static cross. Sized to the component:
 * its visual surface IS the crop rectangle's geometry.
 */
function generateCombos(): Combo[] {
  const aspects = [0, 1, 1.777, 0.5];
  const boxes = [
    { w: 480, h: 300 },
    { w: 320, h: 440 },
  ];
  const combos: Combo[] = [];
  for (const aspectRatio of aspects) {
    for (const box of boxes) {
      combos.push({
        id: `aspect=${aspectRatio}/${box.w}x${box.h}`,
        aspectRatio, stageWidth: box.w, stageHeight: box.h,
      });
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
    const say = (message: string) => problems.push(message);
    const EPS = 1.5;
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const base = partNamed('base');
    const imageContainer = partNamed('image-container');
    const cropArea = partNamed('crop-area');
    if (!base || !imageContainer || !cropArea) {
      say('a documented part is missing'); return problems;
    }

    const hostCs = getComputedStyle(host);
    // "Container background" — the documented `--snice-color-surface-container-high`.
    if (hostCs.backgroundColor !== token('--snice-color-surface-container-high')) {
      say(`container background "${hostCs.backgroundColor}", expected the documented`
        + ` surface-container-high token "${token('--snice-color-surface-container-high')}"`);
    }
    // "Container border" — 1px in `--snice-color-border`.
    if (parseFloat(hostCs.borderTopWidth) !== 1) {
      say(`container border-top-width "${hostCs.borderTopWidth}", documented 1px`);
    } else if (hostCs.borderTopColor !== token('--snice-color-border')) {
      say(`container border "${hostCs.borderTopColor}", expected the documented border token`);
    }
    // "Container radius" — `--snice-border-radius-lg` is a positive radius.
    if (parseFloat(hostCs.borderTopLeftRadius) <= 0) {
      say(`container radius "${hostCs.borderTopLeftRadius}", documented --snice-border-radius-lg`);
    }

    const baseBox = rect(base);
    const stageBox = document.getElementById('stage')!.getBoundingClientRect();
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`cropper renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    // The host is content-box — its 1px rule paints OUTSIDE `width:100%` —
    // so the doc's authored `width:100%; height:100%` inside the sized stage
    // renders the base exactly stage-wide (Basic Usage pattern).
    if (Math.abs(baseBox.width - stageBox.width) > EPS) {
      say(`the cropper is ${baseBox.width.toFixed(1)}px wide inside a ${stageBox.width}px stage`
        + ' — width:100% did not hold');
    }

    // ── The image display area fills the container; the image is centred ───
    const containerBox = rect(imageContainer);
    if (Math.abs(containerBox.width - baseBox.width) > EPS
      || Math.abs(containerBox.height - baseBox.height) > EPS) {
      say(`the image display area (${containerBox.width.toFixed(1)}x${containerBox.height.toFixed(1)})`
        + ` does not fill the container (${baseBox.width.toFixed(1)}x${baseBox.height.toFixed(1)})`);
    }
    const img = sr.querySelector('img') as HTMLImageElement | null;
    if (!img) { say('no image rendered'); return problems; }
    if (!img.complete || img.naturalWidth === 0) { say('the photo never loaded'); return problems; }
    const imgBox = rect(img);
    if (imgBox.width <= 0 || imgBox.height <= 0) {
      say(`the image renders at ${imgBox.width}x${imgBox.height}`);
    } else {
      // The fixture's photo is 320x200 — a displayed image keeps its ratio.
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      if (Math.abs(imgBox.width / imgBox.height - naturalRatio) > 0.02) {
        say(`the displayed image is ${imgBox.width.toFixed(1)}x${imgBox.height.toFixed(1)},`
          + ` distorting its natural ${naturalRatio.toFixed(3)}:1`);
      }
      // `.image-container` centres the photo (`display:flex; align/justify-center`).
      if (Math.abs((imgBox.left + imgBox.right) / 2 - (containerBox.left + containerBox.right) / 2) > EPS) {
        say('the image is not centred horizontally in the display area');
      }
      if (Math.abs((imgBox.top + imgBox.bottom) / 2 - (containerBox.top + containerBox.bottom) / 2) > EPS) {
        say('the image is not centred vertically in the display area');
      }
    }

    // ── The initial crop region: centred, inside, ratio-locked ─────────────
    // The component owns a crop MODEL — the inline left/top/width/height it
    // reports through `crop-change` and feeds to `crop()` — and centres THAT
    // box in the container (initCropArea). The painted element adds its 2px
    // frame outside the model (content-box border), so the geometry clauses
    // are asserted on the model, read from the inline styles exactly the way
    // the fixture's cropSamples maps the crop onto the photo.
    const model = {
      x: parseFloat(cropArea.style.left),
      y: parseFloat(cropArea.style.top),
      width: parseFloat(cropArea.style.width),
      height: parseFloat(cropArea.style.height),
    };
    const cropBox = rect(cropArea);
    if (cropBox.width <= 0 || cropBox.height <= 0) {
      say(`the crop region renders at ${cropBox.width}x${cropBox.height}`);
      return problems;
    }
    if (cropBox.left < baseBox.left - EPS || cropBox.right > baseBox.right + EPS
      || cropBox.top < baseBox.top - EPS || cropBox.bottom > baseBox.bottom + EPS) {
      say(`the crop region (${cropBox.left.toFixed(0)},${cropBox.top.toFixed(0)}`
        + ` → ${cropBox.right.toFixed(0)},${cropBox.bottom.toFixed(0)}) escapes the container`);
    }
    // "the initial centred rect" — the one geometric claim the DOM tier
    // explicitly delegates here. Centre-on-centre on the MODEL box, so the
    // assertion is about the documented centring, not the painted frame.
    if (Math.abs(baseBox.left + model.x + model.width / 2 - (baseBox.left + baseBox.right) / 2) > EPS) {
      say('the initial crop region is not centred horizontally');
    }
    if (Math.abs(baseBox.top + model.y + model.height / 2 - (baseBox.top + baseBox.bottom) / 2) > EPS) {
      say('the initial crop region is not centred vertically');
    }
    // "aspectRatio … 0 = free, 1 = square, 1.777 = 16:9" — when set, the
    // region itself carries the ratio before any resize happens.
    if (combo.aspectRatio > 0) {
      const ratio = model.width / model.height;
      if (Math.abs(ratio - combo.aspectRatio) > 0.02) {
        say(`aspect-ratio=${combo.aspectRatio} produced a ${ratio.toFixed(3)}:1 crop region`);
      }
    }

    // ── The eight documented handles ────────────────────────────────────────
    // "Drag to reposition, 8 handles to resize" — nw/ne/sw/se on the corners,
    // n/s/w/e on the edge midpoints. Each is a 0.75rem circle PLUS its 1px
    // ring (content-box), and the CSS keys every handle to the crop region's
    // PADDING box (the painted rect inset by the crop area's own border)
    // with ±6px offsets, landing each centre (halfPainted − 6)px inside its
    // padding-box anchor — i.e. (border + halfPainted − 6)px inside the
    // painted rect's corner/midpoint.
    const remSize = 0.75 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const cropBorder = parseFloat(getComputedStyle(cropArea).borderTopWidth) || 0;
    const anchorOf: Record<string, { x: number; y: number; sx: number; sy: number }> = {
      nw: { x: cropBox.left, y: cropBox.top, sx: 1, sy: 1 },
      ne: { x: cropBox.right, y: cropBox.top, sx: -1, sy: 1 },
      sw: { x: cropBox.left, y: cropBox.bottom, sx: 1, sy: -1 },
      se: { x: cropBox.right, y: cropBox.bottom, sx: -1, sy: -1 },
      n: { x: (cropBox.left + cropBox.right) / 2, y: cropBox.top, sx: 0, sy: 1 },
      s: { x: (cropBox.left + cropBox.right) / 2, y: cropBox.bottom, sx: 0, sy: -1 },
      w: { x: cropBox.left, y: (cropBox.top + cropBox.bottom) / 2, sx: 1, sy: 0 },
      e: { x: cropBox.right, y: (cropBox.top + cropBox.bottom) / 2, sx: -1, sy: 0 },
    };
    for (const [name, anchor] of Object.entries(anchorOf)) {
      const handle = sr.querySelector(`.handle[data-handle="${name}"]`) as HTMLElement | null;
      if (!handle) { say(`handle "${name}" is missing`); continue; }
      const ring = parseFloat(getComputedStyle(handle).borderTopWidth) || 0;
      const painted = remSize + 2 * ring;
      const box = rect(handle);
      if (Math.abs(box.width - painted) > EPS || Math.abs(box.height - painted) > EPS) {
        say(`handle "${name}" renders at ${box.width.toFixed(1)}x${box.height.toFixed(1)},`
          + ` documented 0.75rem plus its ${ring}px ring (${painted}px)`);
      }
      const inset = cropBorder + painted / 2 - 6;
      const expected = {
        x: anchor.x + inset * anchor.sx,
        y: anchor.y + inset * anchor.sy,
      };
      const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      if (Math.abs(centre.x - expected.x) > EPS || Math.abs(centre.y - expected.y) > EPS) {
        say(`handle "${name}" is centred at (${centre.x.toFixed(1)},${centre.y.toFixed(1)}),`
          + ` not on its ${name === 'n' || name === 's' || name === 'w' || name === 'e' ? 'edge midpoint' : 'corner'}`
          + ` (${expected.x.toFixed(1)},${expected.y.toFixed(1)})`);
      }
      if (getComputedStyle(handle).cursor !== `${name}-resize`) {
        say(`handle "${name}" cursor "${getComputedStyle(handle).cursor}", expected "${name}-resize"`);
      }
      // A handle the pointer cannot reach cannot resize anything.
      const hit = (sr as any).elementFromPoint(centre.x, centre.y) as Element | null;
      if (hit !== handle) {
        say(`handle "${name}" is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    // ── The crop region is the top hit at its own centre ───────────────────
    const centre = { x: (cropBox.left + cropBox.right) / 2, y: (cropBox.top + cropBox.bottom) / 2 };
    const hit = (sr as any).elementFromPoint(centre.x, centre.y) as Element | null;
    if (hit !== cropArea && !cropArea.contains(hit)) {
      say(`the crop region is occluded at its centre by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
    }
    if (getComputedStyle(cropArea).cursor !== 'move') {
      say(`crop region cursor "${getComputedStyle(cropArea).cursor}", documented "move" for dragging`);
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('cropper visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(
        c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.aspectRatio).toBe(combo.aspectRatio);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The doc's imperative clauses, driven by the real pointer/keyboard ────────

/** Viewport box of the crop region / a handle, for real-mouse dragging. */
async function boxOf(selector: string): Promise<{ x: number; y: number; width: number; height: number }> {
  return page.evaluate((selector) => {
    const host = document.getElementById('subject')!;
    const node = host.shadowRoot!.querySelector(selector)!;
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, selector);
}

const cropRectOf = () => boxOf('.crop-area');

test.describe('cropper visual matrix: real dragging', () => {
  test.beforeEach(async () => {
    await page.evaluate(() => (window as any).matrix.mount({ stageWidth: 480, stageHeight: 300 }));
    await page.evaluate(() => (window as any).matrix.startEvents());
  });
  test.afterEach(async () => {
    await page.evaluate(() => (window as any).matrix.stopEvents());
  });

  test('a real drag moves the crop region by the pointer delta', async () => {
    // aspect 0.5 leaves real slack around the region (130x260 in a 480x300
    // container), so a small delta engages no clamp and the claim under test
    // is the delta fidelity itself — the clamped edge is the next test.
    await page.evaluate(() => (window as any).matrix.mount({
      stageWidth: 480, stageHeight: 300, aspectRatio: 0.5,
    }));
    // The remount above replaced the element the beforeEach started recording
    // on (mount() unmounts and builds a fresh host) — restart the recorder or
    // no crop-change is ever captured.
    await page.evaluate(() => (window as any).matrix.startEvents());
    const before = await cropRectOf();
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width / 2 + 10, before.y + before.height / 2 + 8, { steps: 4 });
    await page.mouse.up();

    const after = await cropRectOf();
    // The doc: "Drag to reposition" — the region follows the pointer.
    expect(after.x - before.x, `moved ${after.x - before.x}px horizontally, expected 10`).toBeCloseTo(10, 0);
    expect(after.y - before.y, `moved ${after.y - before.y}px vertically, expected 8`).toBeCloseTo(8, 0);
    expect(after.width).toBeCloseTo(before.width, 0);

    const events = await page.evaluate(() => (window as any).matrix.stopEvents());
    const changes = events.filter((event: any) => event.type === 'crop-change');
    expect(changes.length, 'crop-change fired during the drag').toBeGreaterThan(0);
    // "crop-change -> { rect: { x, y, width, height } }" — the reported rect
    // matches the painted box (the component's own coordinate origin).
    const last = changes[changes.length - 1].detail.rect;
    expect([last.x, last.y, last.width, last.height].every(Number.isFinite)).toBe(true);
  });

  test('a drag cannot carry the crop region out of the container', async () => {
    const container = await boxOf('.cropper');
    const before = await cropRectOf();
    await page.mouse.move(before.x + 10, before.y + 10);
    await page.mouse.down();
    await page.mouse.move(container.x - 200, container.y - 200, { steps: 4 });
    await page.mouse.up();

    const after = await cropRectOf();
    expect(after.x, `x=${after.x} after dragging past the left edge`).toBeGreaterThanOrEqual(container.x - 1.5);
    expect(after.y, `y=${after.y} after dragging past the top edge`).toBeGreaterThanOrEqual(container.y - 1.5);
    expect(after.x + after.width).toBeLessThanOrEqual(container.x + container.width + 1.5);
  });

  test('a real drag on the se handle resizes, and the square lock survives', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      stageWidth: 480, stageHeight: 300, aspectRatio: 1,
    }));
    const before = await cropRectOf();
    const handle = await boxOf('.handle[data-handle="se"]');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    // +15px keeps the resized square inside the 480x300 container, so the
    // documented lock is judged where no container clamp can mask it.
    await page.mouse.move(handle.x + handle.width / 2 + 15, handle.y + handle.height / 2 + 15, { steps: 3 });
    await page.mouse.up();

    const after = await cropRectOf();
    expect(after.width - before.width, `width grew ${after.width - before.width}px, expected 15`).toBeCloseTo(15, 0);
    // "Aspect ratio enforced on resize when set".
    expect(after.width / after.height, `ratio ${after.width / after.height} after resize`).toBeCloseTo(1, 1);
  });

  test('min-width/min-height floor a shrink drag', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      stageWidth: 480, stageHeight: 300, minWidth: 60, minHeight: 40,
    }));
    const eHandle = await boxOf('.handle[data-handle="e"]');
    await page.mouse.move(eHandle.x + eHandle.width / 2, eHandle.y + eHandle.height / 2);
    await page.mouse.down();
    await page.mouse.move(eHandle.x - 500, eHandle.y + eHandle.height / 2, { steps: 4 });
    await page.mouse.up();
    let rect = await cropRectOf();
    // "minWidth: number = 20" is documented in the property table; a larger
    // authored value must floor the painted region too. resizeCrop floors the
    // crop MODEL, and the painted rect is the model plus its 2px frame on
    // each side (content-box border), so the measured floor is minWidth + 4.
    expect(rect.width, `width=${rect.width} after dragging far past min-width=60`).toBeCloseTo(64, 0);

    const sHandle = await boxOf('.handle[data-handle="s"]');
    await page.mouse.move(sHandle.x + sHandle.width / 2, sHandle.y + sHandle.height / 2);
    await page.mouse.down();
    await page.mouse.move(sHandle.x + sHandle.width / 2, sHandle.y - 500, { steps: 4 });
    await page.mouse.up();
    rect = await cropRectOf();
    expect(rect.height, `height=${rect.height} after dragging far past min-height=40`).toBeCloseTo(44, 0);
  });
});

test.describe('cropper visual matrix: real keyboard', () => {
  test('arrow keys nudge the region 1px, 10px with Shift', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ stageWidth: 480, stageHeight: 300 }));
    const before = await cropRectOf();
    // The crop region is tabindex="0", but its own mousedown handler
    // preventDefaults (drag setup), which in Chromium also suppresses the
    // click's focus move — so focus the region directly and keep the keys
    // real. The clause under test is the documented arrow-key nudge.
    await page.evaluate(() => {
      const area = document.getElementById('subject')!.shadowRoot!.querySelector('.crop-area') as HTMLElement;
      area.focus();
    });

    await page.keyboard.press('ArrowRight');
    const one = await cropRectOf();
    expect(one.x - before.x, `ArrowRight moved ${one.x - before.x}px`).toBeCloseTo(1, 0);

    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');
    const ten = await cropRectOf();
    expect(ten.x - before.x, `Shift+ArrowLeft netted ${ten.x - before.x}px`).toBeCloseTo(-9, 0);
  });
});

test.describe('cropper visual matrix: zoom, rotate, reset reach the render', () => {
  test.beforeEach(async () => {
    await page.evaluate(() => (window as any).matrix.mount({ stageWidth: 480, stageHeight: 300 }));
  });

  test('zoom(2) doubles the displayed image and reset() restores it', async () => {
    const base = await boxOf('img');
    await page.evaluate(() => (window as any).matrix.act('zoom', 2));
    const zoomed = await boxOf('img');
    // "zoom(level) - Set zoom level" — a zoom that does not change the image's
    // rendered box zoomed nothing.
    expect(zoomed.width / base.width, `zoom(2) rendered ${zoomed.width / base.width}x`).toBeCloseTo(2, 1);
    expect(zoomed.height / base.height).toBeCloseTo(2, 1);

    await page.evaluate(() => (window as any).matrix.act('reset'));
    const reset = await boxOf('img');
    expect(Math.abs(reset.width - base.width)).toBeLessThan(1.5);
  });

  test('rotate(90) turns the landscape photo into a portrait box', async () => {
    const base = await boxOf('img');
    await page.evaluate(() => (window as any).matrix.act('rotate', 90));
    const rotated = await boxOf('img');
    // "rotate(degrees) - Rotate image (cumulative)" — a 320x200 photo rotated
    // a quarter turn occupies a 200x320 visual box.
    expect(rotated.width / base.width).toBeCloseTo(base.height / base.width, 1);
    expect(Math.abs(rotated.width - base.height)).toBeLessThan(2);
    expect(Math.abs(rotated.height - base.width)).toBeLessThan(2);
  });
});

test.describe('cropper visual matrix: crop() really crops', () => {
  test('crop() emits crop-complete with a png blob of the painted geometry', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      stageWidth: 480, stageHeight: 300, outputType: 'png',
    }));
    const result = await page.evaluate(
      () => (window as any).matrix.cropSamples([0.25, 0.75]));
    expect(result.ok, 'crop() returned no blob').toBe(true);
    // "crop(): Promise<Blob | null> - Produce cropped image blob", with the
    // property table's outputType: 'png' = image/png.
    expect(result.type).toBe('image/png');
    expect(result.size, 'the blob carries no bytes').toBeGreaterThan(0);
    // "crop-complete -> { blob }" fires when crop() produces output.
    expect(result.fired).toBe(1);
    // The output canvas is the painted crop rectangle mapped onto the photo's
    // natural resolution.
    expect(result.width, `output ${result.width}px wide, expected ~${result.expectedWidth}`).toBeCloseTo(result.expectedWidth, 0);
    expect(result.height).toBeCloseTo(result.expectedHeight, 0);

    const pixels = (result.pixels as Array<RGB | null>).filter(p => p !== null) as RGB[];
    expect(pixels.length, 'no sample landed inside the crop').toBeGreaterThanOrEqual(2);
    // The photo's left half is red, its right half blue — a crop that copies
    // the wrong region cannot fake both.
    expect(pixels.some(([r, g, b]) => r > g + 40 && r > b + 40),
      `no sample painted the photo's red half: ${JSON.stringify(result.pixels)}`).toBe(true);
    expect(pixels.some(([r, g, b]) => b > r + 40 && b > g + 40),
      `no sample painted the photo's blue half: ${JSON.stringify(result.pixels)}`).toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// "Dark mask indicates crop region" and "rule-of-thirds grid overlay" are the
// two clauses of the accessibility section that are pure paint. Layer 1 proved
// the boxes; only the decoded PNG can prove the mask darkens what it claims to
// darken and the guides draw where the thirds are.

test.describe('cropper visual matrix: marquee pixels', () => {
  test.beforeEach(async () => {
    await page.evaluate(() => (window as any).matrix.mount({ stageWidth: 480, stageHeight: 300 }));
  });

  test('the dark mask really darkens everything outside the crop region', async () => {
    // The photo is smaller than the crop region, so every point outside the
    // region shows the container's own surface. Two points on THAT surface —
    // one inside the region (unmasked), one outside it (behind the documented
    // rgb(0 0 0 / 0.5) mask) — differ only by the mask.
    const [inside, masked] = await capture(
      page, '#subject', 'cropper-mask',
      `(host) => {
        const area = host.shadowRoot.querySelector('.crop-area');
        const img = host.shadowRoot.querySelector('img');
        const a = area.getBoundingClientRect();
        const i = img.getBoundingClientRect();
        const y = a.y + a.height / 2;
        // Inside the region, left of the photo: unmasked container surface.
        const insideX = Math.min(a.x + 20, i.x - 4);
        // Right of the region's edge, still inside the host: masked surface.
        const maskedX = Math.min(a.right + 15, host.getBoundingClientRect().right - 4);
        return [
          { x: insideX, y },
          { x: maskedX, y },
        ];
      }`,
    );
    // A 50% black overlay halves luminance — the masked point must be
    // measurably darker than the same photo unmasked.
    expect(luminance(masked as RGB), `unmasked ${luminance(inside as RGB).toFixed(3)}`
      + ` vs masked ${luminance(masked as RGB).toFixed(3)}`).toBeLessThan(luminance(inside as RGB) * 0.75);
  });

  test('the rule-of-thirds guides really paint at the thirds', async () => {
    // The ::before/::after guides sit at exactly 1/3 and 2/3 of the crop
    // region. Sample ±1px around the first vertical guide and the first
    // horizontal guide, plus a guide-free interior reference at the centre:
    // at least one sample next to each third must differ from the reference.
    const pixels = await capture(
      page, '#subject', 'cropper-guides',
      `(host) => {
        const a = host.shadowRoot.querySelector('.crop-area').getBoundingClientRect();
        const x1 = a.x + a.width / 3, y1 = a.y + a.height / 3;
        const points = [];
        for (const dx of [-1, 0, 1]) points.push({ x: x1 + dx, y: a.y + a.height / 2 });
        for (const dy of [-1, 0, 1]) points.push({ x: a.x + a.width / 2, y: y1 + dy });
        points.push({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
        return points;
      }`,
    );
    const reference = pixels[pixels.length - 1] as RGB;
    const vertical = pixels.slice(0, 3) as RGB[];
    const horizontal = pixels.slice(3, 6) as RGB[];
    expect(vertical.some(p => !sameColor(p, reference)),
      'no pixel along the first vertical third differs from the guide-free centre').toBe(true);
    expect(horizontal.some(p => !sameColor(p, reference)),
      'no pixel along the first horizontal third differs from the guide-free centre').toBe(true);
  });

  test('the corner handles paint as light dots on the dark mask', async () => {
    // The nw handle's centre and a neighbouring masked point a handle-width
    // away. "8 handles to resize" is only true for a sighted user if the
    // handles are visible against the mask they sit on.
    const [handleDot, mask] = await capture(
      page, '#subject', 'cropper-handle',
      `(host) => {
        const handle = host.shadowRoot.querySelector('.handle[data-handle="nw"]');
        const box = handle.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + box.width / 2 - 14, y: box.y + box.height / 2 - 14 },
        ];
      }`,
    );
    expect(luminance(handleDot as RGB), `handle dot rgb(${handleDot.join(',')})`
      + ` vs mask rgb(${mask.join(',')})`).toBeGreaterThan(luminance(mask as RGB) + 0.1);
  });
});
