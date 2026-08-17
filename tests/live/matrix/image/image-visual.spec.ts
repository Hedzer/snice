/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-image TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/image, `npm run test:matrix`) owns structure
 * truth: which parts exist, which src the img carries, which attributes
 * reflected. It cannot own visual truth — happy-dom performs no layout, decodes
 * no image, and paints nothing, so the entire documented styling surface of
 * this component (`variant`, `size`, `fit`, the reveal of a loaded image over
 * its placeholder) is invisible to it.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the rendered layer has a real, visible box, and a LOADED image is fully
 *     opaque — the component reveals with an opacity transition, so "the img
 *     element exists" and "the photo is on screen" are different claims;
 *   · `variant` resolves to its documented shape: `circle` is fully round,
 *     `square` has square corners, `rounded` is between the two;
 *   · `fit` resolves to the documented `object-fit`;
 *   · `size` gives the container a real box, and the rendered layer fills it;
 *   · explicit `width`/`height` win over the size class;
 *   · nothing occludes the image (elementFromPoint lands on it, not on a
 *     placeholder that never got out of the way).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   An `<img>` with a correct src, a correct box and `opacity: 1` can still
 *   paint nothing. The marquee captures decode the PNG inside the browser under
 *   test and assert the photo's own pixels are on the page, that a circle
 *   really clips, and that the source-less placeholder is visible.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/image/matrix.html';

type Variant = 'rounded' | 'square' | 'circle';
type Size = 'small' | 'medium' | 'large';
type Fit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

interface Combo {
  id: string;
  variant: Variant;
  size: Size;
  image: 'ok' | 'none';
  fit: Fit;
  width: string;
  height: string;
}

const VARIANTS: Variant[] = ['rounded', 'square', 'circle'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const FITS: Fit[] = ['cover', 'contain', 'fill', 'none', 'scale-down'];

/**
 * The cross: variant x size x source-present — 18 combos, the dimensions that
 * change the painted shape, the painted box, or which layer is painted at all
 * — with `fit` and the explicit box rotated across them. `.ai/fuzzing.md` sizes
 * the matrix to the component: an image is a wrapper round `<img>` with two
 * render shapes, so the whole product of its twelve properties would be the
 * table's budget spent here.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const image of ['none', 'ok'] as const) {
        const fit = FITS[n % FITS.length];
        const boxed = n % 6 === 1;
        combos.push({
          id: `${variant}/${size}/${image === 'ok' ? 'loaded' : 'placeholder'}`
            + `/[fit:${fit}${boxed ? ',boxed' : ''}]`,
          variant, size, image, fit,
          width: boxed ? '150px' : '',
          height: boxed ? '150px' : '',
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

    const hostCs = getComputedStyle(host);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);

    const container = partsNamed('container')[0];
    if (!container) { say('no part="container" rendered'); return problems; }
    const containerBox = rect(container);
    if (containerBox.width <= 0 || containerBox.height <= 0) {
      say(`the container renders at ${containerBox.width}x${containerBox.height}`);
      return problems;
    }

    // The painted layer: the img when there is a source, the placeholder when
    // there is not (docs: "placeholder — shown when loading or no src").
    const layer = combo.image === 'ok'
      ? partsNamed('image')[0]
      : partsNamed('placeholder')[0];
    if (!layer) {
      say(`no ${combo.image === 'ok' ? 'part="image"' : 'part="placeholder"'} rendered`);
      return problems;
    }
    const box = rect(layer);
    const cs = getComputedStyle(layer);
    if (box.width <= 0 || box.height <= 0) {
      say(`the painted layer renders at ${box.width}x${box.height}`);
      return problems;
    }
    if (cs.visibility !== 'visible') say(`the painted layer visibility "${cs.visibility}"`);
    // A loaded image reveals with an opacity transition; one that never
    // finishes is an image nobody sees.
    if (Number(cs.opacity) < 0.99) {
      say(`the painted layer is at opacity ${cs.opacity} — it never became visible`);
    }

    // ── The documented box ───────────────────────────────────────────────────
    if (combo.width) {
      const want = parseFloat(combo.width);
      if (Math.abs(box.width - want) > EPS) {
        say(`width="${combo.width}" painted ${box.width.toFixed(1)}px`);
      }
    }
    if (combo.height) {
      const want = parseFloat(combo.height);
      if (Math.abs(box.height - want) > EPS) {
        say(`height="${combo.height}" painted ${box.height.toFixed(1)}px`);
      }
    }
    if (!combo.width && Math.abs(box.width - box.height) > EPS) {
      // Every documented size sets one length for both sides.
      say(`size="${combo.size}" painted a ${box.width.toFixed(0)}x${box.height.toFixed(0)} box`);
    }
    if (box.width > containerBox.width + EPS || box.height > containerBox.height + EPS) {
      say(`the painted layer (${box.width.toFixed(0)}x${box.height.toFixed(0)}) overflows its`
        + ` container (${containerBox.width.toFixed(0)}x${containerBox.height.toFixed(0)})`);
    }

    // ── The documented shape ─────────────────────────────────────────────────
    const raw = cs.borderTopLeftRadius;
    const radiusShare = raw.includes('%')
      ? parseFloat(raw)
      : ((parseFloat(raw) || 0) / Math.min(box.width, box.height)) * 100;
    if (combo.variant === 'circle' && radiusShare < 50 - 0.5) {
      say(`variant="circle" painted border-radius ${raw} — that is not a circle`);
    }
    if (combo.variant === 'square' && radiusShare > 0) {
      say(`variant="square" painted rounded corners (${raw})`);
    }
    if (combo.variant === 'rounded' && (radiusShare <= 0 || radiusShare >= 50)) {
      say(`variant="rounded" painted border-radius ${raw}`);
    }

    // ── The documented fit ───────────────────────────────────────────────────
    if (combo.image === 'ok' && cs.objectFit !== combo.fit) {
      say(`fit="${combo.fit}" resolved to object-fit "${cs.objectFit}"`);
    }

    // ── Occlusion: the painted layer is the one the cursor would touch ───────
    for (const [fx, fy] of [[0.5, 0.5], [0.35, 0.65]] as const) {
      const x = box.left + box.width * fx;
      const y = box.top + box.height * fy;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`hit-test at (${fx}, ${fy}) found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the image');
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== layer && !layer.contains(hit as Node)) {
        say(`the painted layer is occluded at (${fx}, ${fy}) by`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}`
          + `${hit ? `.${String((hit as HTMLElement).className).split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('image visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted).toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('image visual matrix: the documented size scale', () => {
  async function boxOf(size: Size): Promise<number> {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { variant: 'square', size, image: 'ok', fit: 'cover' } as any);
    return page.evaluate(() => {
      const img = document.getElementById('subject')!.shadowRoot!
        .querySelector('[part~="image"]')!;
      return img.getBoundingClientRect().width;
    });
  }

  // MATRIX-image-1 — `size="large"` paints a SMALLER image than
  // `size="medium"`, and exactly the same box as `size="small"`. The three
  // documented sizes are meant to be a scale ("small / medium / large" in the
  // Properties block and three separate usage examples); `.image--large` reads
  // `var(--snice-spacing-3xl, 12rem)`, but `--snice-spacing-3xl` is the theme's
  // 4rem token — the same one `.image--small` uses — so `large` and `small`
  // render identically and both are half of `medium`. Per .ai/fuzzing.md the
  // assertion is NOT weakened and the component is NOT changed.
  test('MATRIX-image-1: small < medium < large', async () => {
    test.fail();
    const small = await boxOf('small');
    const medium = await boxOf('medium');
    const large = await boxOf('large');
    expect(small, `small=${small} medium=${medium} large=${large}`).toBeLessThan(medium);
    expect(medium, `small=${small} medium=${medium} large=${large}`).toBeLessThan(large);
  });

  test('every documented size still paints a real box', async () => {
    for (const size of SIZES) {
      expect(await boxOf(size), `size="${size}" painted nothing`).toBeGreaterThan(0);
    }
  });
});

test.describe('image visual matrix: every documented fit reaches the paint', () => {
  for (const fit of FITS) {
    test(`fit="${fit}" resolves to object-fit: ${fit}`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant: 'square', size: 'medium', image: 'ok', fit, width: '200px', height: '100px' } as any);
      const resolved = await page.evaluate(() => {
        const img = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="image"]')!;
        return getComputedStyle(img).objectFit;
      });
      expect(resolved).toBe(fit);
    });
  }
});

test.describe('image visual matrix: the low-res placeholder gets out of the way', () => {
  // "placeholder — shown when loading": once the real image has loaded, the
  // low-res copy must stop covering it. A placeholder that stays opaque is a
  // blurred image the user never gets past, and no DOM test can see it.
  test('a loaded image is not covered by its own placeholder', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'square', size: 'large', image: 'ok', fit: 'cover', placeholder: 'low',
    }));
    const state = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const low = sr.querySelector('[part~="placeholder"]') as HTMLElement | null;
      const img = sr.querySelector('[part~="image"]') as HTMLElement;
      const box = img.getBoundingClientRect();
      const hit = (sr as any).elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return {
        lowOpacity: low ? Number(getComputedStyle(low).opacity) : null,
        imageOpacity: Number(getComputedStyle(img).opacity),
        hitIsImage: hit === img,
      };
    });
    expect(state.imageOpacity, 'the loaded image never became opaque').toBeGreaterThan(0.99);
    if (state.lowOpacity !== null) {
      expect(state.lowOpacity, 'the low-res placeholder still covers the image').toBeLessThan(0.01);
    }
    expect(state.hitIsImage, 'the placeholder still swallows the pointer').toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the img has a src and opacity 1" and "the photo is on the
// screen" are different claims, and only pixels can tell them apart.

test.describe('image visual matrix: marquee pixels', () => {
  test('a loaded image paints its own pixels, not the placeholder', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'square', size: 'large', image: 'ok', fit: 'fill', width: '160px', height: '160px',
    }));
    // The fixture's image is a 2x2 of two saturated colours, so a `fill` at
    // 160px paints four large quadrants. Probing two of them proves the DECODED
    // image is on screen — a grey placeholder would read one flat colour.
    const [topLeft, bottomRight, outside] = await capture(
      page, '#stage', 'image-loaded',
      `() => {
        const host = document.getElementById('subject');
        const box = host.shadowRoot.querySelector('[part~="image"]').getBoundingClientRect();
        return [
          { x: box.x + box.width * 0.25, y: box.y + box.height * 0.25 },
          { x: box.x + box.width * 0.75, y: box.y + box.height * 0.75 },
          { x: box.x + box.width / 2, y: box.y + box.height + 40 },
        ];
      }`,
    );
    expect(sameColor(topLeft, bottomRight),
      `the image painted one flat colour (${topLeft.join(',')}) — that is a placeholder`)
      .toBe(false);
    expect(sameColor(topLeft, outside),
      'the image painted the page surface').toBe(false);
  });

  test('a circle-variant image really clips its corners', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'circle', size: 'large', image: 'ok', fit: 'fill', width: '160px', height: '160px',
    }));
    const [centre, corner] = await capture(
      page, '#stage', 'image-circle',
      `() => {
        const host = document.getElementById('subject');
        const box = host.shadowRoot.querySelector('[part~="image"]').getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height * 0.25 },
          { x: box.x + 2, y: box.y + 2 },
        ];
      }`,
    );
    expect(sameColor(centre, corner),
      `the circle painted its corner ${corner.join(',')} the same as its face`).toBe(false);
  });

  test('the source-less placeholder is visible against the surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'rounded', size: 'large', image: 'none', fit: 'cover',
      width: '160px', height: '160px',
    }));
    const [field, surface] = await capture(
      page, '#stage', 'image-placeholder',
      `() => {
        const host = document.getElementById('subject');
        const box = host.shadowRoot.querySelector('[part~="placeholder"]').getBoundingClientRect();
        return [
          { x: box.x + box.width * 0.2, y: box.y + box.height * 0.2 },
          { x: box.x + box.width / 2, y: box.y + box.height + 40 },
        ];
      }`,
    );
    expect(sameColor(field, surface),
      `the placeholder painted ${field.join(',')}, identical to the surface`).toBe(false);
    expect(contrast(field, surface),
      `placeholder contrast against the surface is ${contrast(field, surface).toFixed(3)}:1`)
      .toBeGreaterThan(1.03);
  });
});
