/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-rating TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/rating, `npm run test:matrix`) owns structure
 * and behaviour truth: how many stars, which are aria-checked, what a click or
 * an arrow key commits. It cannot own visual truth, because happy-dom performs
 * no layout and paints nothing — and for a star rating the whole point IS the
 * paint. A "3.5 of 5" that renders four identical stars is correct in the DOM
 * and wrong on the screen.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · `max` stars sit in a row, in order, each with a real box, none
 *     overlapping;
 *   · `size` resolves to the documented `--rating-size` scale — small 1rem,
 *     medium 1.5rem, large 2rem;
 *   · the filled layer paints `--rating-color` and the empty layer
 *     `--rating-color-empty`, the two documented custom properties;
 *   · a fractional value clips its star part-way, so a half star is really half
 *     painted (`precision: 'half'`);
 *   · every star is the element the cursor would touch — the glyph layers are
 *     absolutely positioned on top of the star, and a layer that swallows the
 *     pointer is a rating nobody can set;
 *   · a real pointer click really commits the documented value.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "The filled layer has color: amber" and "the star is amber on screen" are
 *   different claims — the glyph may be clipped away, painted under its own
 *   empty layer, or drawn at zero size. The marquee captures decode the PNG
 *   inside the browser under test and read the star's actual pixels.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/rating/matrix.html';

type Size = 'small' | 'medium' | 'large';
type Precision = 'full' | 'half';

interface Combo {
  id: string;
  value: number;
  max: number;
  size: Size;
  precision: Precision;
  readonly: boolean;
  icon: string;
}

const SIZES: Size[] = ['small', 'medium', 'large'];
const PRECISIONS: Precision[] = ['full', 'half'];
const VALUES = [0, 3, 3.5, 5];

/** The documented `--rating-size` scale, in px at the default 16px root. */
const SIZE_PX: Record<Size, number> = { small: 16, medium: 24, large: 32 };

/**
 * The cross: size x precision x value-shape — 24 combos, every dimension that
 * changes what is painted or how much of it — with `max`, `readonly` and the
 * icon form rotated across them. Sized to a small interactive control, per
 * .ai/fuzzing.md.
 */
function generateCombos(): Combo[] {
  const ICONS = ['star', '❤'];
  const combos: Combo[] = [];
  let n = 0;
  for (const size of SIZES) {
    for (const precision of PRECISIONS) {
      for (const value of VALUES) {
        combos.push({
          id: `${size}/${precision}/value:${value}`
            + `/[max:${n % 3 === 2 ? 3 : 5},icon:${ICONS[n % ICONS.length]}`
            + `${n % 4 === 3 ? ',readonly' : ''}]`,
          value,
          max: n % 3 === 2 ? 3 : 5,
          size, precision,
          readonly: n % 4 === 3,
          icon: ICONS[n % ICONS.length],
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
async function visualProblems(combo: Combo, sizePx: number): Promise<string[]> {
  return page.evaluate(({ combo, sizePx }) => {
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

    const base = partsNamed('base')[0];
    const stars = partsNamed('star');
    if (!base) { say('no part="base" rendered'); return problems; }
    if (stars.length !== combo.max) {
      say(`max=${combo.max} painted ${stars.length} stars`);
    }
    if (!stars.length) return problems;

    // ── The documented size scale ────────────────────────────────────────────
    const ratingSize = getComputedStyle(host).getPropertyValue('--rating-size').trim();
    const ratingSizePx = ratingSize.endsWith('rem')
      ? parseFloat(ratingSize) * parseFloat(getComputedStyle(document.documentElement).fontSize)
      : parseFloat(ratingSize);
    if (Math.abs(ratingSizePx - sizePx) > 0.5) {
      say(`size="${combo.size}" resolved --rating-size to "${ratingSize}" (${ratingSizePx}px),`
        + ` expected ${sizePx}px`);
    }

    let previousRight = -Infinity;
    for (const [i, star] of stars.entries()) {
      const box = rect(star);
      if (box.width <= 0 || box.height <= 0) {
        say(`star ${i} renders at ${box.width}x${box.height}`);
        continue;
      }
      if (Math.abs(box.width - sizePx) > 1 || Math.abs(box.height - sizePx) > 1) {
        say(`star ${i} paints ${box.width.toFixed(1)}x${box.height.toFixed(1)},`
          + ` expected ${sizePx}x${sizePx}`);
      }
      // A row, in order, with no overlap.
      if (box.left < previousRight - EPS) {
        say(`star ${i} overlaps star ${i - 1}`);
      }
      previousRight = box.right;
      if (!base.contains(star)) say(`star ${i} is painted outside part="base"`);

      // ── The two documented colour layers ──────────────────────────────────
      const full = star.querySelector('.star-full') as HTMLElement | null;
      const empty = star.querySelector('.star-empty') as HTMLElement | null;
      if (!full || !empty) {
        say(`star ${i} has no filled/empty layer pair`);
      } else {
        const filledColor = getComputedStyle(full).color;
        const emptyColor = getComputedStyle(empty).color;
        if (filledColor === emptyColor) {
          say(`star ${i} paints its filled and empty layers the same colour (${filledColor})`);
        }
        // The documented fill fraction, as the browser resolved it.
        const fraction = Math.max(0, Math.min(1, combo.value - i));
        const clip = getComputedStyle(full).clipPath;
        const inset = /inset\(0(?:px)? ([\d.]+)%/.exec(clip);
        if (!inset) {
          say(`star ${i} has clip-path "${clip}" — the fill cannot be partial`);
        } else {
          const painted = 1 - parseFloat(inset[1]) / 100;
          if (Math.abs(painted - fraction) > 0.02) {
            say(`value=${combo.value}: star ${i} paints ${(painted * 100).toFixed(0)}% of its`
              + ` glyph, expected ${(fraction * 100).toFixed(0)}%`);
          }
        }
      }

      // ── Occlusion: the star itself is the hit target ──────────────────────
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`star ${i}: page hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
          + ' not the rating');
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== star && !star.contains(hit as Node)) {
        say(`star ${i} is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, { combo, sizePx });
}

const combos = generateCombos();

test.describe('rating visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.max).toBe(combo.max);
      expect(await visualProblems(combo, SIZE_PX[combo.size]), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('rating visual matrix: a real pointer really rates', () => {
  // The DOM tier fires a synthetic click with a hand-made rect, because
  // happy-dom has no layout. This is the same contract measured against real
  // geometry: the browser decides which star the cursor is over, and the
  // half-precision rule is applied to a real box.
  test('clicking the fourth star commits 4', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large' }));
    const box = await page.evaluate(() => {
      const stars = [...document.getElementById('subject')!.shadowRoot!
        .querySelectorAll('[part~="star"]')];
      const b = stars[3].getBoundingClientRect();
      return { x: b.x + b.width * 0.75, y: b.y + b.height / 2 };
    });
    await page.mouse.click(box.x, box.y);
    const state = await page.evaluate(() => ({
      value: (window as any).matrix.el.value,
      events: (window as any).matrix.events,
    }));
    expect(state.value).toBe(4);
    expect(state.events).toEqual([{ value: 4 }]);
  });

  test('clicking the left half of a half-precision star commits a half step', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large', precision: 'half' }));
    const box = await page.evaluate(() => {
      const stars = [...document.getElementById('subject')!.shadowRoot!
        .querySelectorAll('[part~="star"]')];
      const b = stars[2].getBoundingClientRect();
      return { x: b.x + b.width * 0.25, y: b.y + b.height / 2 };
    });
    await page.mouse.click(box.x, box.y);
    expect(await page.evaluate(() => (window as any).matrix.el.value)).toBe(2.5);
  });

  test('a readonly rating ignores a real click', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'large', value: 2, readonly: true,
    }));
    const box = await page.evaluate(() => {
      const stars = [...document.getElementById('subject')!.shadowRoot!
        .querySelectorAll('[part~="star"]')];
      const b = stars[4].getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    });
    await page.mouse.click(box.x, box.y);
    const state = await page.evaluate(() => ({
      value: (window as any).matrix.el.value,
      events: (window as any).matrix.events,
    }));
    expect(state.value).toBe(2);
    expect(state.events).toEqual([]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the filled layer is amber" and "the star looks filled" are
// different claims, and only pixels can tell them apart.

test.describe('rating visual matrix: marquee pixels', () => {
  test('a filled star and an empty star paint different pixels', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large', value: 3, max: 5 }));
    // A grid over each star: a glyph is mostly whitespace, so a single centre
    // probe can land in a gap and call a painted star blank.
    const pixels = await capture(
      page, '#subject', 'rating-filled-vs-empty',
      `(host) => {
        const stars = [...host.shadowRoot.querySelectorAll('[part~="star"]')];
        const points = [];
        for (const index of [0, 4]) {
          const box = stars[index].getBoundingClientRect();
          for (let ix = 0; ix < 8; ix++) {
            for (let iy = 0; iy < 8; iy++) {
              points.push({
                x: box.x + box.width * ((ix + 0.5) / 8),
                y: box.y + box.height * ((iy + 0.5) / 8),
              });
            }
          }
        }
        return points;
      }`,
    );
    const filled = pixels.slice(0, 64);
    const empty = pixels.slice(64);
    // The documented filled colour is amber — red and green well above blue.
    const amber = filled.filter(([r, g, b]) => r > 150 && g > 100 && b < 120);
    expect(amber.length, 'a filled star painted no amber ink at all').toBeGreaterThan(0);
    const amberInEmpty = empty.filter(([r, g, b]) => r > 150 && g > 100 && b < 120);
    expect(amberInEmpty.length, 'an unfilled star painted the filled colour').toBe(0);
  });

  test('a half star is painted half', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      size: 'large', value: 3.5, max: 5, precision: 'half',
    }));
    // Star index 3 is the half one. Its left half must carry the filled
    // colour and its right half must not — that is the whole meaning of
    // `precision: 'half'`, and no DOM assertion can see it.
    const pixels = await capture(
      page, '#subject', 'rating-half',
      `(host) => {
        const star = [...host.shadowRoot.querySelectorAll('[part~="star"]')][3];
        const box = star.getBoundingClientRect();
        const points = [];
        for (const side of [0.05, 0.55]) {
          for (let ix = 0; ix < 8; ix++) {
            for (let iy = 0; iy < 10; iy++) {
              points.push({
                x: box.x + box.width * (side + 0.4 * ((ix + 0.5) / 8)),
                y: box.y + box.height * ((iy + 0.5) / 10),
              });
            }
          }
        }
        return points;
      }`,
    );
    const isAmber = ([r, g, b]: number[]) => r > 150 && g > 100 && b < 120;
    const left = pixels.slice(0, 80).filter(isAmber);
    const right = pixels.slice(80).filter(isAmber);
    expect(left.length, 'the left half of a half star painted no filled ink').toBeGreaterThan(0);
    expect(right.length, 'the right half of a half star painted filled ink too').toBe(0);
  });

  test('every star of a full rating paints, not just the first', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ size: 'large', value: 5, max: 5 }));
    const pixels = await capture(
      page, '#subject', 'rating-full',
      `(host) => {
        const stars = [...host.shadowRoot.querySelectorAll('[part~="star"]')];
        const points = [];
        for (const star of stars) {
          const box = star.getBoundingClientRect();
          for (let ix = 0; ix < 6; ix++) {
            for (let iy = 0; iy < 6; iy++) {
              points.push({
                x: box.x + box.width * ((ix + 0.5) / 6),
                y: box.y + box.height * ((iy + 0.5) / 6),
              });
            }
          }
        }
        return points;
      }`,
    );
    for (let star = 0; star < 5; star++) {
      const own = pixels.slice(star * 36, (star + 1) * 36);
      const amber = own.filter(([r, g, b]) => r > 150 && g > 100 && b < 120);
      expect(amber.length, `star ${star} of a 5-of-5 rating painted no ink`).toBeGreaterThan(0);
    }
    // And the row is not one wide amber smear: a star is a GLYPH, so its own
    // box must contain unpainted pixels as well as ink.
    const amberAll = pixels.filter(([r, g, b]) => r > 150 && g > 100 && b < 120).length;
    expect(amberAll, 'no ink anywhere in the row').toBeGreaterThan(0);
    expect(amberAll, 'every probed pixel is ink — the stars painted as solid blocks')
      .toBeLessThan(pixels.length);
  });
});
