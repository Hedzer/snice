/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-avatar TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/avatar, `npm run test:matrix`) owns
 * structure truth: which parts exist, what the fallback reads, which attributes
 * reflected. It cannot own visual truth, because happy-dom performs no layout —
 * every box reads 0, nothing is painted, and the image layer never decodes.
 *
 * The avatar is largely presentational, so per .ai/fuzzing.md this matrix is
 * deliberately modest (36 layer-1 combos, not the table's 1152). It is also the
 * only tier that can check the things this component actually promises:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the documented SIZE REFERENCE is exact — `xs` really is 24px, `xxl`
 *     really is 96px — and the avatar is square in both axes;
 *   · `shape` really rounds: circle = 50% of the box, square = 0, rounded =
 *     somewhere strictly between;
 *   · overflow is clipped, so a loaded image cannot escape a circular frame;
 *   · exactly ONE layer is visible — the image OR the fallback, never both,
 *     never neither — checked through computed visibility/opacity and through
 *     a shadow-root hit test at the avatar's centre;
 *   · the initials are actually inside the frame (not clipped away) and scale
 *     with `size`, per the documented font-size column.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "the fallback has a background-color" and "the avatar is visible" are
 *   different claims. The marquee captures decode the PNG inside the browser
 *   under test and assert the fallback really paints, that `fallback-background`
 *   paints the colour that was asked for, that a loaded image paints its own
 *   pixels rather than the fallback's, and that the corner of a circular avatar
 *   is really transparent to the page behind it.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/avatar/matrix.html';

type Size = 'xs' | 'small' | 'medium' | 'large' | 'xl' | 'xxl';
type Shape = 'circle' | 'square' | 'rounded';
type Image = 'none' | 'ok' | 'broken';

interface Combo {
  id: string;
  size: Size;
  shape: Shape;
  image: Image;
  name: string;
  fallbackBackground: string;
}

/** The documented Size Reference table: dimension / font-size, in px. */
const SIZE_PX: Record<Size, { box: number; font: number }> = {
  xs: { box: 24, font: 10 },
  small: { box: 32, font: 12 },
  medium: { box: 40, font: 14 },
  large: { box: 48, font: 16 },
  xl: { box: 64, font: 20 },
  xxl: { box: 96, font: 32 },
};

/**
 * The cross: size x shape x image-state = 6 * 3 * 3 = 54... trimmed to the 36
 * that can differ. Every size is crossed with every shape (18) — that pair is
 * the whole geometry contract — and the three image states are rotated across
 * them so each appears twelve times, with `name` and `fallback-background`
 * rotated on top. Sized to a component whose render function has one branch.
 */
function generateCombos(): Combo[] {
  const sizes: Size[] = ['xs', 'small', 'medium', 'large', 'xl', 'xxl'];
  const shapes: Shape[] = ['circle', 'square', 'rounded'];
  const images: Image[] = ['none', 'ok', 'broken'];
  const names = ['John Doe', '', 'Cher'];
  const combos: Combo[] = [];
  let n = 0;
  for (const size of sizes) {
    for (const shape of shapes) {
      for (const pass of [0, 1]) {
        const image = images[(n + pass) % images.length];
        const name = names[n % names.length];
        const fallbackBackground = n % 4 === 1 ? 'rgb(59, 130, 246)' : '';
        combos.push({
          id: `${size}/${shape}/image:${image}`
            + `/[name:${name || '∅'}${fallbackBackground ? ',fallback-bg' : ''}]`,
          size, shape, image, name, fallbackBackground,
        });
        n++;
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo, sizePx: { box: number; font: number }): Promise<string[]> {
  return page.evaluate(({ combo, sizePx }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partsNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const base = partsNamed('base')[0];
    if (!base) { say('no part="base"'); return problems; }
    const box = rect(base);
    const cs = getComputedStyle(base);

    // ── The documented Size Reference ────────────────────────────────────────
    if (Math.abs(box.width - sizePx.box) > EPS || Math.abs(box.height - sizePx.box) > EPS) {
      say(`size="${combo.size}" rendered ${box.width.toFixed(1)}x${box.height.toFixed(1)},`
        + ` documented as ${sizePx.box}x${sizePx.box}`);
    }
    if (Math.abs(box.width - box.height) > EPS) {
      say(`avatar is not square: ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
    }
    // The font-size column of the same table drives the initials.
    const fontPx = parseFloat(cs.fontSize);
    if (Math.abs(fontPx - sizePx.font) > 0.6) {
      say(`size="${combo.size}" font-size is ${cs.fontSize}, documented as ${sizePx.font}px`);
    }

    // ── shape: the documented three ─────────────────────────────────────────
    const radius = cs.borderTopLeftRadius;
    const radiusPx = radius.endsWith('%')
      ? (parseFloat(radius) / 100) * box.width
      : parseFloat(radius) || 0;
    if (combo.shape === 'circle') {
      if (Math.abs(radiusPx - box.width / 2) > 1) {
        say(`shape="circle" border-radius resolves to ${radiusPx.toFixed(1)}px on a`
          + ` ${box.width.toFixed(0)}px box — a circle needs half`);
      }
    } else if (combo.shape === 'square') {
      if (radiusPx > 0.5) say(`shape="square" has border-radius ${radius}`);
    } else {
      if (radiusPx <= 0.5 || radiusPx >= box.width / 2 - 0.5) {
        say(`shape="rounded" resolves to ${radiusPx.toFixed(1)}px, which is`
          + ` ${radiusPx <= 0.5 ? 'square' : 'a full circle'}, not rounded`);
      }
    }
    // A shape is only a shape if the content is clipped to it.
    if (cs.overflow !== 'hidden' && cs.overflowX !== 'hidden') {
      say(`part="base" overflow is "${cs.overflow}" — a loaded image would escape the frame`);
    }

    // ── Exactly one layer is shown ──────────────────────────────────────────
    const img = partsNamed('image')[0] as HTMLImageElement | undefined;
    const fallback = partsNamed('fallback')[0];
    const shown = (el: Element | undefined) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility === 'visible' && Number(s.opacity) > 0.01;
    };
    const imageShown = shown(img);
    const fallbackShown = shown(fallback);
    const wantImage = combo.image === 'ok';
    if (wantImage && !imageShown) say('a loaded image is not displayed');
    if (!wantImage && imageShown) {
      say(combo.image === 'broken'
        ? 'a BROKEN image is still displayed'
        : 'an image layer is displayed although no src was given');
    }
    if (wantImage && fallbackShown) say('the fallback is painted over a loaded image');
    if (!wantImage && !fallbackShown) say('neither the image nor the fallback is visible');

    if (wantImage && img) {
      if (!img.complete || img.naturalWidth === 0) {
        say(`the image never decoded (complete=${img.complete}, naturalWidth=${img.naturalWidth})`);
      }
      const ib = rect(img);
      if (Math.abs(ib.width - box.width) > EPS || Math.abs(ib.height - box.height) > EPS) {
        say(`the image is ${ib.width.toFixed(1)}x${ib.height.toFixed(1)} inside a`
          + ` ${box.width.toFixed(1)}px frame — it does not fill it`);
      }
      if (getComputedStyle(img).objectFit !== 'cover') {
        say(`the image object-fit is "${getComputedStyle(img).objectFit}", expected cover`);
      }
    }

    // ── The fallback content really fits inside the frame ───────────────────
    if (!wantImage && fallback) {
      const fb = rect(fallback);
      if (fb.width <= 0 || fb.height <= 0) {
        say(`fallback renders at ${fb.width}x${fb.height}`);
      } else if (fb.left < box.left - EPS || fb.right > box.right + EPS
        || fb.top < box.top - EPS || fb.bottom > box.bottom + EPS) {
        say('the fallback layer spills outside part="base"');
      }
      if (!combo.name) {
        const icon = fallback.querySelector('svg');
        if (!icon) {
          say('no name and no image, yet the default person icon is absent');
        } else {
          const ib = rect(icon);
          if (ib.width <= 0 || ib.height <= 0) say(`the person icon renders at ${ib.width}x${ib.height}`);
          if (ib.width > box.width + EPS) say('the person icon is wider than the avatar');
        }
      }
    }

    // ── Occlusion: the centre of the avatar belongs to the shown layer ──────
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const outer = document.elementFromPoint(cx, cy);
    if (outer !== host) {
      say(`the avatar's centre hit-tests to <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
        + ' not the avatar');
    } else {
      const hit = (sr as any).elementFromPoint(cx, cy) as Element | null;
      const want = wantImage ? img : fallback;
      if (hit !== want && !want?.contains(hit as Node)) {
        say(`the avatar's centre is owned by <${hit?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ` expected the ${wantImage ? 'image' : 'fallback'} layer`);
      }
    }

    // ── fallback-background overrides the auto colour ───────────────────────
    if (!wantImage && combo.fallbackBackground) {
      const painted = getComputedStyle(base).backgroundColor;
      if (painted !== combo.fallbackBackground) {
        say(`fallback-background="${combo.fallbackBackground}" resolved to`
          + ` background-color "${painted}"`);
      }
    }

    return problems;
  }, { combo, sizePx });
}

const combos = generateCombos();

test.describe('avatar visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted).toBe(true);
      expect(await visualProblems(combo, SIZE_PX[combo.size]), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// four exist because "the fallback has a background-color" and "the fallback is
// visible" are different claims, and only pixels can tell them apart.

test.describe('avatar visual matrix: marquee pixels', () => {
  test('the initials fallback paints, and contrasts with its own background', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'xxl', shape: 'circle', name: 'John Doe',
    }));
    // Centre of the badge (where a glyph stroke lands) against a point just
    // inside the frame's edge (pure background). "Initials" that paint the
    // background colour are initials nobody can read.
    const [glyph, field] = await capture(
      page, '#subject', 'avatar-initials',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + box.width / 2, y: box.y + box.height * 0.12 },
        ];
      }`,
    );
    expect(sameColor(glyph, field),
      `initials painted ${glyph.join(',')}, identical to the badge field`).toBe(false);
    expect(contrast(glyph, field),
      `initials contrast is ${contrast(glyph, field).toFixed(2)}:1`).toBeGreaterThan(2);
  });

  test('fallback-background paints the colour that was asked for', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'xxl', shape: 'square', name: 'Custom',
      fallbackBackground: 'rgb(220, 38, 38)', fallbackColor: 'rgb(255, 255, 255)',
    }));
    const [field] = await capture(
      page, '#subject', 'avatar-fallback-bg',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [{ x: box.x + box.width * 0.12, y: box.y + box.height * 0.12 }];
      }`,
    );
    const [r, g, b] = field as RGB;
    expect(r > g + 40 && r > b + 40,
      `fallback-background="rgb(220,38,38)" painted rgb(${r},${g},${b})`).toBe(true);
  });

  test('a loaded image paints its own pixels, not the fallback', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'xxl', shape: 'square', name: 'John Doe', image: 'ok',
    }));
    // The fixture's image is two saturated colours; the fallback for this name
    // is a palette colour plus white text. Probing the two halves proves the
    // IMAGE is what covers the frame: two distinct colours, neither of them a
    // flat fallback field.
    const pixels = await capture(
      page, '#subject', 'avatar-image',
      `(host) => {
        const box = host.getBoundingClientRect();
        return [
          { x: box.x + box.width * 0.25, y: box.y + box.height * 0.25 },
          { x: box.x + box.width * 0.75, y: box.y + box.height * 0.75 },
        ];
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `the image area painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
  });

  // A circular avatar really clips its corners: the strongest form of the
  // shape claim, judged in pixels.
  test('a circular avatar really clips its corners', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'xxl', shape: 'circle', name: 'John Doe', image: 'ok',
    }));
    // The extreme corner of a circle's bounding box is OUTSIDE the circle, so
    // it must show the page surface rather than the image. This is the one
    // claim `border-radius: 50%` in a computed style cannot make on its own —
    // an unclipped child paints straight over the rounding.
    //
    // The capture is of #stage, not of the avatar, so the same image contains
    // both the corner under test and a patch of untouched page surface to
    // compare it against. "The corner differs from the centre" would be a much
    // weaker claim — an unclipped image whose corner quadrant is a different
    // colour would satisfy it — so the assertion is the strong one: the corner
    // IS the surface.
    const [corner, surface] = await capture(
      page, '#stage', 'avatar-circle-clip',
      `(stage) => {
        const box = document.getElementById('subject').getBoundingClientRect();
        return [
          { x: box.x + 1, y: box.y + 1 },
          { x: box.right + 40, y: box.y + 4 },
        ];
      }`,
    );
    const distance = Math.max(...corner.map((c, i) => Math.abs(c - surface[i])));
    expect(distance <= 4,
      `the corner of a circular avatar painted ${corner.join(',')} where the page`
      + ` surface is ${surface.join(',')} — the frame never clipped it`).toBe(true);
  });
});
