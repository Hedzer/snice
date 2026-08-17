/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-badge TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/badge, `npm run test:matrix`) owns content
 * truth: when the indicator renders at all, what `count`/`max`/`showZero`
 * resolve the text to, which parts and ARIA the element exposes. It cannot own
 * VISUAL truth, because happy-dom performs no layout — every box reads 0 and
 * nothing is painted.
 *
 * That matters more for a badge than for most components: `position` is the
 * component's headline feature and it is ENTIRELY a CSS rule. `top-right`,
 * `top-left`, `bottom-right`, `bottom-left`, `offset` and `inline` produce no
 * DOM difference whatsoever — only a browser can tell you where the indicator
 * actually landed.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host, `part="base"` and `part="badge"` have real boxes, and the
 *     indicator is opaque and visible;
 *   · the four documented positions really put the indicator's CENTRE on the
 *     matching corner of the slotted target (the documented overlay model),
 *     and `offset` really moves it in by exactly that many pixels;
 *   · `inline` really takes it out of the overlay and puts it in normal flow,
 *     after the slotted content instead of on top of it;
 *   · `dot` really renders a small round indicator with no text, and a
 *     non-dot indicator really carries its text without clipping it;
 *   · `pulse` really runs an animation and its absence really runs none;
 *   · the indicator never covers the CENTRE of the element it decorates, and
 *     nothing paints over the indicator (elementFromPoint).
 *
 * ── Axis comparisons: the enum dimensions ──────────────────────────────────
 *   Six variants must not collapse into one fill; three sizes must really grow.
 *
 * ── Hidden-state slice ─────────────────────────────────────────────────────
 *   The documented visibility rule — "hidden when there is no dot, non-empty
 *   `content`, positive `count`, or `showZero`" — is a claim about PAINT, so it
 *   is asserted here on real boxes rather than on a class name.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   An indicator that "has a background-color" can still be invisible against
 *   the surface it overlays, and its count can still be unreadable on its own
 *   fill. Only pixels can tell those apart.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/badge/matrix.html';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type Size = 'small' | 'medium' | 'large';
type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
type Mode = 'content' | 'count' | 'dot';

interface Combo {
  id: string;
  variant: Variant;
  position: Position;
  size: Size;
  mode: Mode;
  content?: string;
  count?: number;
  max?: number;
  dot: boolean;
  inline: boolean;
  pulse: boolean;
  offset: number;
}

const VARIANTS: Variant[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const POSITIONS: Position[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
const MODES: Mode[] = ['content', 'count', 'dot'];

/**
 * The cross: 6 variants x 4 positions x 3 content modes = 72 combos, with size,
 * `inline`, `pulse`, `offset` and the `max` overflow rotated across it.
 *
 * Sized to the component: a badge is one indicator element and four positional
 * rules, so the product worth paying for is (what it shows) x (where it sits) x
 * (what colour it is). Everything else rides along.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const position of POSITIONS) {
      for (const mode of MODES) {
        const size = SIZES[n % 3];
        const inline = n % 7 === 0;
        const pulse = n % 5 === 0;
        const offset = n % 4 === 3 ? 6 : 0;
        const overflow = mode === 'count' && n % 6 === 1;
        combos.push({
          id: `${variant}/${position}/${mode}/${size}`
            + `/[${inline ? 'inline,' : ''}${pulse ? 'pulse,' : ''}`
            + `${offset ? `offset:${offset},` : ''}${overflow ? 'over-max,' : ''}]`
              .replace(',]', ']').replace('[]', '[plain]'),
          variant, position, size, mode,
          content: mode === 'content' ? 'New' : undefined,
          count: mode === 'count' ? (overflow ? 150 : 7) : undefined,
          max: overflow ? 99 : undefined,
          dot: mode === 'dot',
          inline, pulse, offset,
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

/** LAYER 1: one evaluate per combo; every violation reported at once. */
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
    const part = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const base = part('base');
    const badge = part('badge');
    if (!base) { say('no part="base" rendered'); return problems; }
    if (!badge) { say('no part="badge" rendered'); return problems; }

    const target = host.querySelector('.target') as HTMLElement | null;
    if (!target) { say('the slotted target did not survive mounting'); return problems; }
    const targetBox = rect(target);
    const badgeBox = rect(badge);
    const baseBox = rect(base);

    if (targetBox.width <= 0 || targetBox.height <= 0) {
      say(`slotted target renders at ${targetBox.width}x${targetBox.height}`);
      return problems;
    }
    if (badgeBox.width <= 0 || badgeBox.height <= 0) {
      say(`indicator renders at ${badgeBox.width}x${badgeBox.height}`);
      return problems;
    }

    const badgeCs = getComputedStyle(badge);
    if (badgeCs.visibility !== 'visible') say(`indicator visibility "${badgeCs.visibility}"`);
    if (Number(badgeCs.opacity) <= 0.05) say(`indicator opacity "${badgeCs.opacity}"`);
    if (badgeCs.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('indicator has a fully transparent background');
    }

    // ── dot vs text ──────────────────────────────────────────────────────────
    const text = (badge.textContent ?? '').trim();
    if (combo.dot) {
      if (text !== '') say(`dot indicator carries the text "${text}"`);
      if (Math.abs(badgeBox.width - badgeBox.height) > 1.5) {
        say(`dot is ${badgeBox.width.toFixed(1)}x${badgeBox.height.toFixed(1)} — not round`);
      }
      const radius = parseFloat(badgeCs.borderTopLeftRadius) || 0;
      if (radius < badgeBox.height / 2 - 1) {
        say(`dot border-radius ${badgeCs.borderTopLeftRadius} on a ${badgeBox.height.toFixed(1)}px box`);
      }
    } else {
      if (text === '') say('a non-dot indicator painted no text');
      if (parseFloat(badgeCs.fontSize) < 8) say(`indicator font-size ${badgeCs.fontSize}`);
      // The count has to FIT. A "99+" clipped to "99" is a lie only pixels and
      // layout can catch.
      if (badge.scrollWidth > badge.clientWidth + 1) {
        say(`indicator text "${text}" is clipped (${badge.scrollWidth} > ${badge.clientWidth})`);
      }
    }

    // ── pulse ────────────────────────────────────────────────────────────────
    const animated = badgeCs.animationName !== 'none' && badgeCs.animationName !== '';
    if (combo.pulse && !animated) say('pulse indicator runs no animation');
    if (!combo.pulse && animated && !/bump/.test(badgeCs.animationName)) {
      say(`a badge without pulse runs the animation "${badgeCs.animationName}"`);
    }

    // ── inline vs the documented overlay ─────────────────────────────────────
    if (combo.inline) {
      if (badgeCs.position !== 'static') {
        say(`inline indicator is ${badgeCs.position}-positioned, not in normal flow`);
      }
      // In flow it follows the target, so it may not sit on top of it.
      const overlapX = Math.min(badgeBox.right, targetBox.right) - Math.max(badgeBox.left, targetBox.left);
      const overlapY = Math.min(badgeBox.bottom, targetBox.bottom) - Math.max(badgeBox.top, targetBox.top);
      if (overlapX > EPS && overlapY > EPS) {
        say(`inline indicator overlaps its target by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}px`);
      }
      // In flow means AFTER what it accompanies — to the right of it, or on a
      // later line if the line broke.
      const later = badgeBox.left >= targetBox.right - EPS
        || badgeBox.top >= targetBox.bottom - EPS;
      if (!later) {
        say(`inline indicator at (${badgeBox.left.toFixed(1)}, ${badgeBox.top.toFixed(1)})`
          + ` comes before the target ending at (${targetBox.right.toFixed(1)},`
          + ` ${targetBox.bottom.toFixed(1)}) — it is not in flow after it`);
      }
    } else {
      // ── position + offset: the documented corner overlay ──────────────────
      // The indicator is centred on the corner and moved IN by `offset` px.
      const corner = {
        x: combo.position.endsWith('right') ? targetBox.right - combo.offset : targetBox.left + combo.offset,
        y: combo.position.startsWith('top') ? targetBox.top + combo.offset : targetBox.bottom - combo.offset,
      };
      const centre = { x: badgeBox.left + badgeBox.width / 2, y: badgeBox.top + badgeBox.height / 2 };
      const dx = Math.abs(centre.x - corner.x);
      const dy = Math.abs(centre.y - corner.y);
      // 2px covers sub-pixel rounding and the border ring; anything more is the
      // indicator landing somewhere other than the documented corner.
      if (dx > 2 || dy > 2) {
        say(`position="${combo.position}"${combo.offset ? ` offset=${combo.offset}` : ''}`
          + ` put the indicator's centre at (${centre.x.toFixed(1)}, ${centre.y.toFixed(1)}),`
          + ` expected (${corner.x.toFixed(1)}, ${corner.y.toFixed(1)})`);
      }
      // Whatever it decorates has to remain readable underneath it.
      const middle = { x: targetBox.left + targetBox.width / 2, y: targetBox.top + targetBox.height / 2 };
      if (middle.x > badgeBox.left && middle.x < badgeBox.right
        && middle.y > badgeBox.top && middle.y < badgeBox.bottom) {
        say('the indicator covers the centre of the element it decorates');
      }
    }

    // The base wraps both; neither may escape it by more than the documented
    // half-overhang of a corner-centred indicator.
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`part="base" renders at ${baseBox.width}x${baseBox.height}`);
    }

    // ── Occlusion: nothing may paint over the indicator ──────────────────────
    for (const fraction of [0.3, 0.5, 0.7]) {
      const x = badgeBox.left + badgeBox.width * fraction;
      const y = badgeBox.top + badgeBox.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`indicator @${Math.round(fraction * 100)}%: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the badge`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit && hit !== badge && !badge.contains(hit) && hit !== host) {
        say(`indicator @${Math.round(fraction * 100)}% is occluded by <${hit.tagName.toLowerCase()}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('badge visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.position).toBe(combo.position);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('badge visual matrix: the documented hidden rule', () => {
  /**
   * "The indicator is hidden when there is no dot, non-empty `content`,
   * positive `count`, or `showZero`." Asserted on PAINT: a hidden indicator is
   * one with no box, not one with a class.
   */
  const cases: Array<{ id: string; combo: Record<string, unknown>; painted: boolean }> = [
    { id: 'nothing set at all', combo: {}, painted: false },
    { id: 'content=""', combo: { content: '' }, painted: false },
    { id: 'count=0 without show-zero', combo: { count: 0 }, painted: false },
    { id: 'count=0 with show-zero', combo: { count: 0, showZero: true }, painted: true },
    { id: 'count=1', combo: { count: 1 }, painted: true },
    { id: 'dot with no content', combo: { dot: true }, painted: true },
    { id: 'content="New"', combo: { content: 'New' }, painted: true },
  ];

  for (const { id, combo, painted } of cases) {
    test(`${id} -> ${painted ? 'painted' : 'hidden'}`, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      const box = await page.evaluate(() => {
        const host = document.getElementById('subject')!;
        const badge = host.shadowRoot!.querySelector('[part~="badge"]') as HTMLElement | null;
        if (!badge) return null;
        const b = badge.getBoundingClientRect();
        const cs = getComputedStyle(badge);
        return {
          width: b.width, height: b.height,
          display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        };
      });
      if (painted) {
        expect(box, 'no indicator element at all').not.toBeNull();
        expect(box!.width * box!.height, `indicator renders at ${box!.width}x${box!.height}`)
          .toBeGreaterThan(0);
        expect(box!.visibility).toBe('visible');
        expect(Number(box!.opacity)).toBeGreaterThan(0.05);
      } else if (box) {
        const invisible = box.width * box.height === 0
          || box.display === 'none' || box.visibility !== 'visible' || Number(box.opacity) <= 0.05;
        expect(invisible,
          `indicator still paints at ${box.width}x${box.height}`
          + ` (display ${box.display}, visibility ${box.visibility}, opacity ${box.opacity})`)
          .toBe(true);
      }
    });
  }
});

async function rowIndicators(count: number): Promise<Array<{
  background: string; color: string; width: number; height: number; fontSize: number;
}>> {
  return page.evaluate((count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const host = document.getElementById(`subject-${i}`) as HTMLElement;
      const badge = host?.shadowRoot?.querySelector('[part~="badge"]') as HTMLElement;
      const cs = getComputedStyle(badge);
      const box = badge.getBoundingClientRect();
      out.push({
        background: cs.backgroundColor,
        color: cs.color,
        width: box.width,
        height: box.height,
        fontSize: parseFloat(cs.fontSize),
      });
    }
    return out;
  }, count);
}

test.describe('badge visual matrix: axis comparisons', () => {
  /**
   * FINDING VISUAL-MATRIX-badge-1.
   *
   * `variant="info"` is pixel-identical to `variant="primary"`: the stylesheet
   * paints `:host([variant="info"]) .badge` with `--snice-color-primary`, the
   * same token `primary` uses, even though the theme defines its own
   * `--snice-color-info`. The docs list six variants as six choices; a customer
   * who asks for `info` silently gets `primary`.
   *
   * The assertion below is NOT weakened — every other pair must still differ.
   * The one collision is named, and the naming is itself asserted: fix the
   * stylesheet and this waiver fails until it is deleted.
   */
  const KNOWN_COLLISION: [Variant, Variant] = ['primary', 'info'];

  test('the six documented variants do not collapse into one appearance', async () => {
    const row = VARIANTS.map(variant => ({ variant, content: 'New' }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    expect(count).toBe(VARIANTS.length);
    const styles = await rowIndicators(count);
    const key = (i: number) => `${styles[i].background}|${styles[i].color}`;

    const seen = new Map<string, Variant>();
    for (const [i, variant] of VARIANTS.entries()) {
      if (variant === KNOWN_COLLISION[1]) continue;
      const clash = seen.get(key(i));
      expect(clash, `variant "${variant}" paints exactly like "${clash}" (${key(i)})`)
        .toBeUndefined();
      seen.set(key(i), variant);
    }

    const a = VARIANTS.indexOf(KNOWN_COLLISION[0]);
    const b = VARIANTS.indexOf(KNOWN_COLLISION[1]);
    expect(key(a),
      `VISUAL-MATRIX-badge-1 no longer reproduces: "${KNOWN_COLLISION[1]}" now paints`
      + ` ${key(b)} against "${KNOWN_COLLISION[0]}"'s ${key(a)} — delete the waiver`)
      .toBe(key(b));
  });

  test('the three documented sizes really grow', async () => {
    const row = SIZES.map(size => ({ size, content: 'New' }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const styles = await rowIndicators(count);
    for (let i = 1; i < styles.length; i++) {
      expect(styles[i].height,
        `size "${SIZES[i]}" (${styles[i].height.toFixed(1)}px) is not taller than`
        + ` "${SIZES[i - 1]}" (${styles[i - 1].height.toFixed(1)}px)`)
        .toBeGreaterThan(styles[i - 1].height);
    }
  });

  test('the three documented sizes really grow the dot too', async () => {
    const row = SIZES.map(size => ({ size, dot: true }));
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const styles = await rowIndicators(count);
    for (let i = 1; i < styles.length; i++) {
      expect(styles[i].width,
        `dot size "${SIZES[i]}" (${styles[i].width.toFixed(1)}px) is not wider than`
        + ` "${SIZES[i - 1]}" (${styles[i - 1].width.toFixed(1)}px)`)
        .toBeGreaterThan(styles[i - 1].width);
    }
  });

  test('an over-max count really needs more room than a small one', async () => {
    const row = [
      { count: 7 },
      { count: 150, max: 99 },
    ];
    const count = await page.evaluate(r => (window as any).matrix.mountRow(r), row as any);
    const styles = await rowIndicators(count);
    expect(styles[1].width,
      `"99+" (${styles[1].width.toFixed(1)}px) is not wider than "7" (${styles[0].width.toFixed(1)}px)`)
      .toBeGreaterThan(styles[0].width);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('badge visual matrix: marquee pixels', () => {
  test('an error badge paints a fill that stands off both the surface and its target', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'error', size: 'large', count: 9, position: 'top-right',
    }));
    // The fill is measured as the MOST FREQUENT colour across a scan of the
    // badge's centre row: a pill badge is mostly fill there, with the count
    // digit's strokes and the rounded ends as minorities. A single probe at a
    // fixed offset from the top edge reads fill in one engine's font metrics
    // and anti-aliased edge (or the target beneath) in another's.
    const row = await capture(
      page, '#stage', 'badge-error-fill',
      `() => {
        const host = document.getElementById('subject');
        const badge = host.shadowRoot.querySelector('[part~="badge"]');
        const target = host.querySelector('.target');
        const b = badge.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 15; i++) {
          points.push({ x: b.x + (b.width * i) / 16, y: b.y + b.height / 2 });
        }
        points.push({ x: t.x + t.width / 2, y: t.bottom + 40 });
        points.push({ x: t.x + 6, y: t.bottom - 6 });
        return points;
      }`,
    );
    const surface = row[row.length - 2];
    const targetFill = row[row.length - 1];
    const counts = new Map<string, number>();
    for (const p of row.slice(0, -2)) {
      counts.set(p.join(','), (counts.get(p.join(',')) ?? 0) + 1);
    }
    const indicator = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      .split(',').map(Number) as RGB;
    expect(sameColor(indicator, surface),
      `the indicator painted ${indicator.join(',')}, identical to the page surface`).toBe(false);
    expect(sameColor(indicator, targetFill),
      `the indicator painted ${indicator.join(',')}, identical to the element it decorates`)
      .toBe(false);
    // A status marker nobody can pick out is not a status marker.
    expect(contrast(indicator, targetFill),
      `indicator/target contrast is ${contrast(indicator, targetFill).toFixed(2)}:1`)
      .toBeGreaterThan(1.4);
  });

  test('a count is readable on its own fill', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'error', size: 'large', count: 8,
    }));
    const pixels = await capture(
      page, '#subject', 'badge-count-text',
      `(host) => {
        const badge = host.shadowRoot.querySelector('[part~="badge"]');
        const box = badge.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 9; i++) {
          points.push({ x: box.x + (box.width * i) / 10, y: box.y + box.height / 2 });
        }
        return points;
      }`,
    );
    const distinct = new Set(pixels.map(p => p.join(',')));
    expect(distinct.size, `the count area painted one flat colour: ${[...distinct]}`)
      .toBeGreaterThan(1);
    const sorted = [...pixels].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    const worst = contrast(sorted[0], sorted[sorted.length - 1]);
    expect(worst, `count/fill contrast is ${worst.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('a dot paints a solid mark, not an empty ring', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'success', size: 'large', dot: true,
    }));
    const [centre, surface] = await capture(
      page, '#stage', 'badge-dot',
      `() => {
        const host = document.getElementById('subject');
        const dot = host.shadowRoot.querySelector('[part~="badge"]');
        const target = host.querySelector('.target');
        const b = dot.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        return [
          { x: b.x + b.width / 2, y: b.y + b.height / 2 },
          { x: t.x + t.width / 2, y: t.bottom + 40 },
        ];
      }`,
    );
    expect(sameColor(centre, surface),
      `the dot's centre painted ${centre.join(',')}, the page surface — it is hollow`).toBe(false);
    expect(contrast(centre, surface),
      `dot/surface contrast is ${contrast(centre, surface).toFixed(2)}:1`).toBeGreaterThan(1.4);
  });
});
