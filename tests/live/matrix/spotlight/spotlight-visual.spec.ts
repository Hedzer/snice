/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-spotlight TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/spotlight, `npm run test:matrix`) owns value
 * truth: which steps exist, what the popover says, which events `start`,
 * `next`, `prev`, `goToStep`, `end`, `skip` and a vanished target emit — and it
 * pins the two documented a11y promises this component does not keep
 * (MATRIX-spotlight-1, -2). It cannot own ANY of this component's core claim,
 * because every word of that claim is geometry:
 *
 *     position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
 *     cutout — "Transparent target cutout"
 *     backdrop — "Dimmed overlay"
 *
 * happy-dom returns a zero rect for every element, so in the DOM tier a
 * spotlight that highlights nothing, points its popover at the wrong side, or
 * covers the target it is supposed to reveal is indistinguishable from a
 * correct one.
 *
 * The overlay is a PORTAL on `document.body` (it must escape ancestor
 * transforms for `position: fixed` to mean anything), not a shadow root, so the
 * probes here read `[data-snice-spotlight-portal]` and the host itself is
 * expected to paint nothing at all.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the portal exists and every documented part has a real, visible box;
 *   · the backdrop covers the viewport;
 *   · the cutout CONTAINS the target and is not the whole screen;
 *   · the popover lands on the documented side of the target — with `auto`
 *     resolved by the documented space rule — and never covers the cutout;
 *   · title, description, indicator and actions stay inside the popover, in
 *     reading order, with the buttons side by side;
 *   · the popover survives a hit test, i.e. it paints above the backdrop.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   "Dimmed overlay" and "transparent cutout" are claims about light. The only
 *   honest test is to read the page's own colour inside the cutout and outside
 *   it, from a decoded screenshot, and require that they differ in the
 *   direction the documentation states.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, luminance, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/spotlight/matrix.html';

type Position = 'top' | 'bottom' | 'left' | 'right' | 'auto';
type Placement = 'centre' | 'near-top-left' | 'near-bottom-right';
type Size = 'small' | 'large';

interface Box {
  x: number; y: number; width: number; height: number;
  top: number; left: number; right: number; bottom: number;
}

interface Geometry {
  portal: boolean;
  base: Box | null;
  backdrop: Box | null;
  cutout: Box | null;
  popover: Box | null;
  title: Box | null;
  description: Box | null;
  actions: Box | null;
  indicator: Box | null;
  indicatorText: string;
  buttons: (Box & { part: string | null; text: string | null })[];
}

interface Combo {
  id: string;
  position: Position;
  placement: Placement;
  size: Size;
  x: number; y: number; w: number; h: number;
}

const VIEWPORT = { width: 1280, height: 900 };

const ORIGIN: Record<Placement, { x: number; y: number }> = {
  'centre': { x: 520, y: 380 },
  'near-top-left': { x: 60, y: 60 },
  'near-bottom-right': { x: 940, y: 660 },
};
const EXTENT: Record<Size, { w: number; h: number }> = {
  small: { w: 90, h: 40 },
  large: { w: 260, h: 150 },
};

/**
 * position (5) x placement (3) x size (2) = 30 combos.
 *
 * `placement` is the axis that decides how much room each side has — which is
 * the whole subject of `auto`, and the thing that makes "top" a different
 * question near the top of the screen than in the middle. `size` is here
 * because the cutout is derived from the target's box, so a component that
 * hard-codes the highlight would only be caught by changing it.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const position of ['top', 'bottom', 'left', 'right', 'auto'] as Position[]) {
    for (const placement of ['centre', 'near-top-left', 'near-bottom-right'] as Placement[]) {
      for (const size of ['small', 'large'] as Size[]) {
        combos.push({
          id: `${position}/${placement}/${size}`,
          position, placement, size,
          ...ORIGIN[placement], ...EXTENT[size],
        });
      }
    }
  }
  return combos;
}

/**
 * The side `auto` resolves to, straight out of the documented behaviour: prefer
 * below when there is room, otherwise above when there is room, otherwise
 * below. Duplicated here rather than imported so the test states the rule it is
 * checking instead of asking the component what it did.
 */
function resolvePosition(position: Position, target: Box): Exclude<Position, 'auto'> {
  if (position !== 'auto') return position;
  const spaceBelow = VIEWPORT.height - target.bottom;
  const spaceAbove = target.top;
  if (spaceBelow > 200) return 'bottom';
  return spaceAbove > 200 ? 'top' : 'bottom';
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

test.afterEach(async () => {
  await page.evaluate(() => { (window as any).matrix.restoreTarget(); (window as any).matrix.end(); });
});

const overlaps = (a: Box, b: Box) =>
  a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

const contains = (outer: Box, inner: Box) =>
  outer.left <= inner.left + 1 && outer.right >= inner.right - 1
  && outer.top <= inner.top + 1 && outer.bottom >= inner.bottom - 1;

/** LAYER 1: every documented consequence of one combo, as a problem list. */
function geometryProblems(combo: Combo, g: Geometry, target: Box, hostBox: Box): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);

  if (!g.portal) { say('no [data-snice-spotlight-portal] on document.body'); return problems; }

  const parts: [string, Box | null][] = [
    ['base', g.base], ['backdrop', g.backdrop], ['cutout', g.cutout],
    ['popover', g.popover], ['title', g.title], ['description', g.description],
    ['actions', g.actions], ['step-indicator', g.indicator],
  ];
  for (const [name, box] of parts) {
    if (!box) { say(`no [part="${name}"]`); continue; }
    if (box.width <= 0 || box.height <= 0) {
      say(`[part="${name}"] renders at ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
    }
  }
  const { backdrop, cutout, popover } = g;
  if (!backdrop || !cutout || !popover) return problems;

  // ── The host itself paints nothing: the overlay lives in the portal ───────
  if (hostBox.width > 0 || hostBox.height > 0) {
    say(`the host occupies ${hostBox.width}x${hostBox.height}; the overlay is portalled`);
  }

  // ── "Dimmed overlay": the backdrop is the whole screen ────────────────────
  if (Math.round(backdrop.width) < VIEWPORT.width || Math.round(backdrop.height) < VIEWPORT.height) {
    say(`backdrop is ${backdrop.width.toFixed(0)}x${backdrop.height.toFixed(0)},`
      + ` smaller than the ${VIEWPORT.width}x${VIEWPORT.height} viewport`);
  }

  // ── "Transparent target cutout": it frames the target, and only the target ─
  if (!contains(cutout, target)) {
    say(`cutout (${cutout.left.toFixed(0)},${cutout.top.toFixed(0)},`
      + `${cutout.right.toFixed(0)},${cutout.bottom.toFixed(0)}) does not contain the target`
      + ` (${target.left.toFixed(0)},${target.top.toFixed(0)},`
      + `${target.right.toFixed(0)},${target.bottom.toFixed(0)})`);
  }
  const slack = 64;
  if (cutout.width > target.width + slack || cutout.height > target.height + slack) {
    say(`cutout is ${cutout.width.toFixed(0)}x${cutout.height.toFixed(0)} around a`
      + ` ${target.width.toFixed(0)}x${target.height.toFixed(0)} target — it is not a spotlight`);
  }

  // ── The documented side ───────────────────────────────────────────────────
  const side = resolvePosition(combo.position, target);
  const relations: Record<Exclude<Position, 'auto'>, [boolean, string]> = {
    bottom: [popover.top >= target.bottom - 1,
      `popover top ${popover.top.toFixed(1)} is not below target bottom ${target.bottom.toFixed(1)}`],
    top: [popover.bottom <= target.top + 1,
      `popover bottom ${popover.bottom.toFixed(1)} is not above target top ${target.top.toFixed(1)}`],
    left: [popover.right <= target.left + 1,
      `popover right ${popover.right.toFixed(1)} is not left of target left ${target.left.toFixed(1)}`],
    right: [popover.left >= target.right - 1,
      `popover left ${popover.left.toFixed(1)} is not right of target right ${target.right.toFixed(1)}`],
  };
  const [ok, message] = relations[side];
  if (!ok) say(`position="${combo.position}" (resolved ${side}): ${message}`);

  // ── A popover that covers the highlight defeats the highlight ────────────
  if (overlaps(popover, cutout)) {
    say(`the popover overlaps the cutout it is pointing at`);
  }

  // ── The popover's contents stay inside it, in reading order ──────────────
  const inner: [string, Box | null][] = [
    ['title', g.title], ['description', g.description],
    ['step-indicator', g.indicator], ['actions', g.actions],
  ];
  for (const [name, box] of inner) {
    if (!box) continue;
    if (!contains(popover, box)) say(`[part="${name}"] escapes the popover`);
  }
  if (g.title && g.description && g.description.top < g.title.bottom - 1) {
    say('the description overlaps the title');
  }
  if (g.description && g.actions && g.actions.top < g.description.bottom - 1) {
    say('the actions row overlaps the description');
  }
  if (g.indicator && g.actions && g.indicator.right > g.actions.left + 1) {
    say(`the step indicator (right ${g.indicator.right.toFixed(1)}) overlaps the actions`
      + ` (left ${g.actions.left.toFixed(1)})`);
  }

  // ── The action buttons sit side by side, none of them collapsed ──────────
  if (g.buttons.length === 0) say('no buttons in [part="actions"]');
  for (const [i, button] of g.buttons.entries()) {
    if (button.width <= 0 || button.height <= 0) {
      say(`button "${button.text}" renders at ${button.width.toFixed(1)}x${button.height.toFixed(1)}`);
    }
    if (i > 0 && button.left < g.buttons[i - 1].right - 1) {
      say(`button "${button.text}" overlaps "${g.buttons[i - 1].text}"`);
    }
  }

  return problems;
}

const combos = generateCombos();

test.describe('spotlight visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const geometry: Geometry = await page.evaluate(
        c => (window as any).matrix.mount(c), combo as any);
      const target: Box = await page.evaluate(() => (window as any).matrix.targetBox());
      const hostBox: Box = await page.evaluate(() => {
        const r = document.getElementById('subject')!.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height,
          top: r.top, left: r.left, right: r.right, bottom: r.bottom };
      });
      expect(geometryProblems(combo, geometry, target, hostBox), `combo ${combo.id}`).toEqual([]);

      // The popover paints ABOVE the dimmed overlay: a hit test in its middle
      // must not come back as the backdrop.
      //
      // Asked only when the popover is actually on the screen. An EXPLICIT
      // `position` is the author's instruction, and the documentation promises
      // no flipping for it — `auto` is the option that shops for room — so a
      // "top" popover against the top edge is off-screen by design and
      // `elementFromPoint` outside the viewport answers "nothing" for reasons
      // that have nothing to do with this component.
      const p = geometry.popover!;
      const onScreen = p.left >= 0 && p.top >= 0
        && p.right <= VIEWPORT.width && p.bottom <= VIEWPORT.height;
      if (onScreen) {
        const hit = await page.evaluate(({ x, y }) => {
          const node = document.elementFromPoint(x, y);
          return node ? `${node.tagName.toLowerCase()}.${String(node.className)}` : 'nothing';
        }, { x: p.left + p.width / 2, y: p.top + p.height / 2 });
        expect(hit, `combo ${combo.id}: the popover is not the topmost element at its own centre`)
          .toContain('popover');
      }
    });
  }
});

// ── Navigation: the geometry has to follow the tour ─────────────────────────

test.describe('spotlight visual matrix: the tour moves', () => {
  test('each step re-aims the cutout at that step\'s target', async () => {
    const first: Geometry = await page.evaluate(() => (window as any).matrix.startTour('bottom'));
    const b: Box = await page.evaluate(() => (window as any).matrix.targetBox('#target-b'));
    expect(contains(first.cutout!, b), 'step 1 does not frame target B').toBe(true);

    const second: Geometry = await page.evaluate(() => (window as any).matrix.next());
    const a: Box = await page.evaluate(() => (window as any).matrix.targetBox('#target-a'));
    expect(contains(second.cutout!, a), 'step 2 does not frame target A').toBe(true);
    expect(contains(second.cutout!, b), 'step 2 still frames target B').toBe(false);

    const third: Geometry = await page.evaluate(() => (window as any).matrix.next());
    const c: Box = await page.evaluate(() => (window as any).matrix.targetBox('#target-c'));
    expect(contains(third.cutout!, c), 'step 3 does not frame target C').toBe(true);

    const back: Geometry = await page.evaluate(() => (window as any).matrix.prev());
    expect(contains(back.cutout!, a), 'prev() did not return the cutout to target A').toBe(true);
  });

  test('ending the tour takes the whole overlay off the screen', async () => {
    await page.evaluate(() => (window as any).matrix.startTour('bottom'));
    await page.evaluate(() => (window as any).matrix.next());
    await page.evaluate(() => (window as any).matrix.next());
    const done: Geometry = await page.evaluate(() => (window as any).matrix.next());
    expect(done.portal, 'the portal outlived the tour it belonged to').toBe(false);
  });

  test('skipping takes the whole overlay off the screen', async () => {
    await page.evaluate(() => (window as any).matrix.startTour('bottom'));
    await page.evaluate(() => (window as any).matrix.skip());
    expect(await page.evaluate(() => (window as any).matrix.geometry().portal),
      'the portal outlived a skipped tour').toBe(false);
  });

  test('a vanished target leaves the popover where it was, not pointing at nothing', async () => {
    const before: Geometry = await page.evaluate(c => (window as any).matrix.mount(c), {
      position: 'bottom', x: 520, y: 380, w: 200, h: 120,
    } as any);
    await page.evaluate(() => (window as any).matrix.dropTarget());
    const after: Geometry = await page.evaluate(() => (window as any).matrix.geometry());
    // Documented: "popover stops instead of pointing at nothing".
    expect(after.portal, 'the overlay disappeared instead of stopping').toBe(true);
    expect(Math.round(after.cutout!.top), 'the cutout moved after its target vanished')
      .toBe(Math.round(before.cutout!.top));
    expect(Math.round(after.popover!.top), 'the popover moved after its target vanished')
      .toBe(Math.round(before.popover!.top));
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Two tests, because "dimmed" and "transparent" are the two halves of one
// pixel claim and layer 1 can only see boxes.

test.describe('spotlight visual matrix: marquee pixels', () => {
  test('the backdrop dims the page and the cutout does not', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      position: 'bottom', x: 520, y: 200, w: 260, h: 150,
    } as any);
    const [insideCutout, outsideCutout] = await capture(
      page, 'body', 'spotlight-cutout',
      `() => {
        const target = document.getElementById('target-a').getBoundingClientRect();
        return [
          // Inside the cutout, on the target's own flat colour — off the
          // centre, which is where the target's own label glyph sits.
          { x: target.x + 20, y: target.y + 20 },
          // …and on the page's flat ground, far from the target and clear of
          // the popover below it.
          { x: 80, y: 820 },
        ];
      }`,
    );
    // The fixture's ground is #f2f2f2 and the target is #d92d20; both are
    // brighter than themselves under a 50% black wash, so the only thing being
    // asserted is that one was washed and the other was not.
    expect(sameColor(insideCutout, [217, 45, 32]),
      `inside the cutout the target painted ${insideCutout.join(',')},`
      + ' not its own undimmed colour 217,45,32').toBe(true);
    expect(luminance(outsideCutout),
      `outside the cutout the page painted ${outsideCutout.join(',')}`
      + ` (luminance ${luminance(outsideCutout).toFixed(3)}), which is not dimmed`)
      .toBeLessThan(luminance([242, 242, 242]) * 0.9);
  });

  test('the popover paints its own opaque surface over the dimmed page', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      position: 'bottom', x: 520, y: 200, w: 260, h: 150,
    } as any);
    const [inPopover, onBackdrop] = await capture(
      page, 'body', 'spotlight-popover',
      `() => {
        const popover = document.querySelector('[data-snice-spotlight-portal] [part="popover"]')
          .getBoundingClientRect();
        return [
          { x: popover.x + popover.width - 6, y: popover.y + 6 },
          { x: 80, y: 820 },
        ];
      }`,
    );
    expect(sameColor(inPopover, onBackdrop),
      `the popover painted ${inPopover.join(',')}, the same as the dimmed page`).toBe(false);
    expect(luminance(inPopover),
      `the popover (${inPopover.join(',')}) is not brighter than the dimmed page`
      + ` (${onBackdrop.join(',')})`).toBeGreaterThan(luminance(onBackdrop));
  });
});
