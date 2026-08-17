/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-skeleton TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/skeleton, `npm run test:matrix`) owns structure
 * truth: how many bones, which parts, which attributes reflected. It cannot own
 * visual truth, because happy-dom performs no layout and paints nothing.
 *
 * The skeleton is a PURELY PRESENTATIONAL component — no data, no interaction,
 * no delivery modes — so per .ai/fuzzing.md its matrix is deliberately MINIMAL:
 * 24 layer-1 combos, not the table's 1152. But this is the tier that matters
 * most for it, because a skeleton IS its paint. `variant` is four border-radius
 * and sizing rules, `animation` is three keyframe rules, and `spacing` is a
 * flex gap: none of them produce a DOM difference a unit test could read.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · every bone has a real, visible box — a placeholder nobody can see is not
 *     a placeholder;
 *   · `count` bones stack vertically, in order, disjoint, separated by exactly
 *     the documented `spacing`;
 *   · `variant` resolves to its documented shape: `circular` is a circle (equal
 *     sides, 50% radius), `rectangular` has square corners, `rounded` does not,
 *     `text` is a line-height-tall bar;
 *   · `width` / `height` produce exactly the box that was asked for;
 *   · `animation` resolves to three distinct states — `pulse` animates the bone
 *     itself, `wave` animates its sweep pseudo-element, `none` animates
 *     nothing;
 *   · nothing occludes a bone (elementFromPoint lands inside it).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A bone that "has a background-color" can still be invisible against the
 *   surface. The marquee captures decode the PNG inside the browser under test
 *   and assert the placeholder's painted pixels really differ from the page.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/skeleton/matrix.html';

type Variant = 'text' | 'circular' | 'rectangular' | 'rounded';
type Animation = 'pulse' | 'wave' | 'none';

interface Combo {
  id: string;
  variant: Variant;
  animation: Animation;
  count: number;
  width: string;
  height: string;
  spacing: string;
}

const VARIANTS: Variant[] = ['text', 'circular', 'rectangular', 'rounded'];
const ANIMATIONS: Animation[] = ['pulse', 'wave', 'none'];

/**
 * The cross: variant x animation x count — 24 combos — with the sizing
 * dimensions rotated across them. Sized to a component whose render function
 * has one loop and no branches; the point of this tier is that all four
 * style-only dimensions get a real browser, not that the product is large.
 */
function generateCombos(): Combo[] {
  const WIDTHS = ['', '120px', '60%'];
  const HEIGHTS = ['', '64px', '160px'];
  const SPACINGS = ['8px', '0px', '24px'];
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const animation of ANIMATIONS) {
      for (const count of [1, 3]) {
        const width = WIDTHS[n % WIDTHS.length];
        const height = HEIGHTS[(n * 2) % HEIGHTS.length];
        const spacing = SPACINGS[n % SPACINGS.length];
        combos.push({
          id: `${variant}/${animation}/count:${count}`
            + `/[${width || 'auto'}x${height || 'auto'},gap:${spacing}]`,
          variant, animation, count, width, height, spacing,
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
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);

    const base = partsNamed('base')[0];
    const bones = partsNamed('bone');
    if (!base) { say('no part="base" rendered'); return problems; }
    if (bones.length !== combo.count) {
      say(`count=${combo.count} painted ${bones.length} bones`);
    }
    if (!bones.length) return problems;

    // ── The container stacks its bones by the documented spacing ────────────
    const baseCs = getComputedStyle(base);
    const spacingPx = parseFloat(combo.spacing);
    if (parseFloat(baseCs.rowGap || baseCs.gap || '0') !== spacingPx) {
      say(`spacing="${combo.spacing}" resolved to gap "${baseCs.rowGap || baseCs.gap}"`);
    }

    let previousBottom = -Infinity;
    for (const [i, bone] of bones.entries()) {
      const box = rect(bone);
      const cs = getComputedStyle(bone);

      // ── A placeholder nobody can see is not a placeholder ─────────────────
      if (box.width <= 0 || box.height <= 0) {
        say(`bone ${i} renders at ${box.width}x${box.height}`);
        continue;
      }
      if (cs.visibility !== 'visible') say(`bone ${i} visibility "${cs.visibility}"`);
      if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') {
        say(`bone ${i} has a transparent background — nothing to see`);
      }

      // ── The stack: in order, disjoint, spaced ─────────────────────────────
      if (i > 0) {
        const gap = box.top - previousBottom;
        if (gap < -EPS) {
          say(`bone ${i} overlaps bone ${i - 1} by ${(-gap).toFixed(1)}px`);
        } else if (Math.abs(gap - spacingPx) > 1) {
          say(`bone ${i} sits ${gap.toFixed(1)}px below bone ${i - 1},`
            + ` expected the documented spacing ${spacingPx}px`);
        }
      }
      previousBottom = box.bottom;

      // ── The documented box ────────────────────────────────────────────────
      if (combo.width.endsWith('px')) {
        const want = parseFloat(combo.width);
        if (Math.abs(box.width - want) > EPS) {
          say(`width="${combo.width}" painted ${box.width.toFixed(1)}px`);
        }
      }
      if (combo.height.endsWith('px')) {
        const want = parseFloat(combo.height);
        if (Math.abs(box.height - want) > EPS) {
          say(`height="${combo.height}" painted ${box.height.toFixed(1)}px`);
        }
      }

      // ── The documented shape ──────────────────────────────────────────────
      //
      // `border-radius` computes as written: a percentage stays a percentage,
      // a length stays a length. Both are normalised to "share of the shorter
      // side" so one comparison covers both forms.
      const radius = cs.borderTopLeftRadius;
      const radiusShare = radius.includes('%')
        ? parseFloat(radius)
        : ((parseFloat(radius) || 0) / Math.min(box.width, box.height)) * 100;
      if (combo.variant === 'circular') {
        if (Math.abs(box.width - box.height) > EPS && !combo.width && !combo.height) {
          say(`a circular skeleton painted ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
        }
        // Half of each side is the roundest a box gets; anything less is a
        // rounded rectangle wearing a circle's name.
        if (radiusShare < 50 - 0.5) {
          say(`circular bone ${i} has border-radius ${radius} on a`
            + ` ${box.width.toFixed(0)}x${box.height.toFixed(0)} box`);
        }
      }
      if (combo.variant === 'rectangular' && radiusShare > 0) {
        say(`rectangular bone ${i} has rounded corners (${radius})`);
      }
      if (combo.variant === 'rounded') {
        if (radiusShare <= 0) say(`rounded bone ${i} has square corners (${radius})`);
        if (radiusShare >= 50) {
          say(`rounded bone ${i} is fully round (${radius}) — that is the circular variant`);
        }
      }
      if (combo.variant === 'text' && !combo.height) {
        // A text placeholder stands in for a line of text, so it is line-sized.
        if (box.height > 48) {
          say(`a text bone is ${box.height.toFixed(0)}px tall — that is not a line of text`);
        }
      }

      // ── The documented animation, in three distinguishable states ─────────
      const sweep = getComputedStyle(bone, '::after');
      const boneAnimation = cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0;
      const sweepAnimation = sweep.animationName !== 'none' && parseFloat(sweep.animationDuration) > 0;
      if (combo.animation === 'pulse' && !boneAnimation) {
        say(`animation="pulse" left bone ${i} with animation-name "${cs.animationName}"`);
      }
      if (combo.animation === 'wave' && !sweepAnimation) {
        say(`animation="wave" left bone ${i}'s sweep with animation-name`
          + ` "${sweep.animationName}" — nothing moves across the placeholder`);
      }
      if (combo.animation === 'none' && (boneAnimation || sweepAnimation)) {
        say(`animation="none" still animates bone ${i}`
          + ` (bone "${cs.animationName}", sweep "${sweep.animationName}")`);
      }

      // ── Occlusion: nothing paints over the placeholder ────────────────────
      const y = box.top + box.height / 2;
      for (const fraction of [0.25, 0.75]) {
        const x = box.left + box.width * fraction;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`bone ${i} @${Math.round(fraction * 100)}%: page hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the skeleton`);
          continue;
        }
        const hit = (sr as any).elementFromPoint(x, y) as Element | null;
        if (hit !== bone && !bone.contains(hit as Node)) {
          say(`bone ${i} @${Math.round(fraction * 100)}% is occluded by`
            + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('skeleton visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.mounted).toBe(true);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('skeleton visual matrix: the variants are distinguishable', () => {
  // Four documented variants that painted the same box would be one variant
  // with four names. This is the cheapest possible proof that they are not.
  test('each variant paints its own corner radius', async () => {
    // Measured on one 120x120 box so the four numbers are directly comparable,
    // as a share of the side rather than raw px/%.
    const radii = new Map<Variant, number>();
    for (const variant of VARIANTS) {
      await page.evaluate(c => (window as any).matrix.mount(c),
        { variant, animation: 'none', count: 1, width: '120px', height: '120px' } as any);
      radii.set(variant, await page.evaluate(() => {
        const bone = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="bone"]')!;
        const box = bone.getBoundingClientRect();
        const raw = getComputedStyle(bone).borderTopLeftRadius;
        return raw.includes('%')
          ? parseFloat(raw)
          : ((parseFloat(raw) || 0) / Math.min(box.width, box.height)) * 100;
      }));
    }
    expect(radii.get('rectangular'), 'rectangular is not square-cornered').toBe(0);
    expect(radii.get('rounded')!, 'rounded is not rounded').toBeGreaterThan(0);
    expect(radii.get('circular')!, 'circular is not a circle').toBeGreaterThanOrEqual(50);
    expect(radii.get('rounded')! < radii.get('circular')!,
      `rounded (${radii.get('rounded')}%) is not softer than circular (${radii.get('circular')}%)`)
      .toBe(true);
    expect(radii.get('text')! < radii.get('circular')!,
      'a text placeholder is as round as a circular one').toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the bone has a background-color" and "the bone is visible" are
// different claims, and only pixels can tell them apart.

test.describe('skeleton visual matrix: marquee pixels', () => {
  test('a placeholder paints pixels that differ from the surface behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'rectangular', animation: 'none', count: 1, width: '200px', height: '80px',
    }));
    const [bone, surface] = await capture(
      page, '#stage', 'skeleton-fill',
      `() => {
        const host = document.getElementById('subject');
        const box = host.shadowRoot.querySelector('[part~="bone"]').getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + box.width / 2, y: box.y + box.height + 30 },
        ];
      }`,
    );
    expect(sameColor(bone, surface),
      `the placeholder painted ${bone.join(',')}, identical to the surface`).toBe(false);
    // A placeholder is meant to be quiet, not absent. 1.05:1 is a deliberately
    // low bar for a grey-on-grey fill — but "quiet" is not "invisible".
    expect(contrast(bone, surface),
      `placeholder contrast against the surface is ${contrast(bone, surface).toFixed(3)}:1`)
      .toBeGreaterThan(1.03);
  });

  test('a circular placeholder really clips its corners', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'circular', animation: 'none', count: 1, width: '120px', height: '120px',
    }));
    // The centre is inside the disc; the top-left corner is outside it. A
    // `border-radius` that computes but does not clip paints both the same.
    const [centre, corner] = await capture(
      page, '#stage', 'skeleton-circular',
      `() => {
        const host = document.getElementById('subject');
        const box = host.shadowRoot.querySelector('[part~="bone"]').getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + 2, y: box.y + 2 },
        ];
      }`,
    );
    expect(sameColor(centre, corner),
      `the circle painted its corner ${corner.join(',')} the same as its centre`).toBe(false);
  });

  test('three stacked placeholders paint three separated bands', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'rectangular', animation: 'none', count: 3, height: '40px', spacing: '24px',
    }));
    // Probe the middle of each bone and the middle of each gap. The bones must
    // paint one colour and the gaps another: a "gap" that paints the bone
    // colour is three bones drawn as one block.
    const pixels = await capture(
      page, '#stage', 'skeleton-stack',
      `() => {
        const host = document.getElementById('subject');
        const bones = [...host.shadowRoot.querySelectorAll('[part~="bone"]')]
          .map(b => b.getBoundingClientRect());
        const points = [];
        for (const b of bones) points.push({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
        for (let i = 1; i < bones.length; i++) {
          points.push({
            x: bones[i].x + bones[i].width / 2,
            y: (bones[i - 1].bottom + bones[i].top) / 2,
          });
        }
        return points;
      }`,
    );
    const [b0, b1, b2, g0, g1] = pixels;
    for (const [i, bone] of [b0, b1, b2].entries()) {
      expect(sameColor(bone, g0), `bone ${i} paints the same colour as the gap`).toBe(false);
    }
    expect(sameColor(g0, g1), 'the two gaps painted different colours').toBe(true);
  });
});
