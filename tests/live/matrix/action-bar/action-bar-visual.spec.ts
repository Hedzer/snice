/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-action-bar TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/action-bar, `npm run test:matrix`) owns
 * structure truth: the `base` part, `role="toolbar"`, the accessible name, the
 * roving tabindex, the open/close events, the Escape contract. It cannot own
 * ANY of this component's headline behaviour, because the whole component is a
 * position: the doc's first sentence is "Positioned, animated container for
 * contextual actions within a relative parent", and happy-dom performs no
 * layout — `position: absolute`, eight `position` values, `transform`,
 * `opacity`, `visibility` and `pointer-events` all read as nothing.
 *
 * So this tier asserts the two claims that only a browser can settle.
 *
 * ── Layer 1 (every combo): geometry, visibility, occlusion, computed style ──
 *   · each documented `position` really anchors the bar to the named edge(s)
 *     of the relative parent, by the SAME inset the theme defines, and centres
 *     it on the free axis (`top`/`bottom` centre horizontally, `left`/`right`
 *     centre vertically, the four corners centre on neither);
 *   · the bar never hangs outside its relative parent;
 *   · a CLOSED bar is genuinely not there — `visibility: hidden`, zero opacity,
 *     and a hit-test at its own box finds the content underneath, not the bar.
 *     An OPEN bar (and a `no-animation` bar, documented as "always visible") is
 *     the reverse on every count;
 *   · the actions sit in one horizontal row inside the toolbar, disjoint,
 *     ascending, each reachable by a pointer;
 *   · `variant="pill"` resolves to a fully rounded end, `default` to a corner;
 *   · `size="small"` really is tighter than `medium`.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   Three, on purpose — a screenshot costs two orders of magnitude more than an
 *   evaluate. They answer what computed style cannot: the bar's surface is
 *   near-white on a near-white page, so the only thing separating it from the
 *   page is a painted border and shadow, and "border-color is set" is a
 *   different claim from "a boundary was painted". Likewise `border-radius:
 *   9999px` is a style, but "the pill's corner is actually cut away" is a
 *   pixel. And a closed bar must paint literally nothing.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, luminance, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/action-bar/matrix.html';

/** Every documented `position`. */
const POSITIONS = [
  'top', 'bottom', 'left', 'right',
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
] as const;
type Position = typeof POSITIONS[number];

/**
 * The three visibility states the docs describe, as a fixture vector.
 *
 *   · `closed`        — the default: hidden, not clickable.
 *   · `open`          — `show()` / `open`: visible and clickable.
 *   · `no-animation`  — documented as "always visible, no transitions", i.e.
 *                       visible WITHOUT `open` ever being set.
 */
const MODES = [
  { id: 'closed', open: false, noAnimation: false, visible: false },
  { id: 'open', open: true, noAnimation: false, visible: true },
  { id: 'no-animation', open: false, noAnimation: true, visible: true },
] as const;
type Mode = typeof MODES[number];

interface Combo {
  id: string;
  position: Position;
  open: boolean;
  noAnimation: boolean;
  visible: boolean;
  variant: 'default' | 'pill';
  size: 'small' | 'medium';
  content: 'three' | 'one' | 'many' | 'mixed';
}

function combo(over: Partial<Combo> & { id: string }): Combo {
  return {
    position: 'bottom',
    open: false,
    noAnimation: false,
    visible: false,
    variant: 'default',
    size: 'medium',
    content: 'three',
    ...over,
  };
}

/**
 * 40 combos, sized to the component rather than to the table.
 *
 * The first 24 are the product that IS this component — eight documented
 * positions crossed with the three visibility states — because every one of
 * them is a different box in a different place and none of them can be checked
 * without layout. The remaining 16 cross the two purely presentational
 * dimensions (`variant`, `size`) with the four action sets at one fixed
 * position: those change the SHAPE of the bar, not where it goes, so pinning
 * the position keeps each of them a single-variable question.
 */
const COMBOS: Combo[] = [
  ...POSITIONS.flatMap(position => MODES.map((mode: Mode) => combo({
    id: `${position}/${mode.id}`,
    position,
    open: mode.open,
    noAnimation: mode.noAnimation,
    visible: mode.visible,
  }))),
  ...(['default', 'pill'] as const).flatMap(variant =>
    (['small', 'medium'] as const).flatMap(size =>
      (['three', 'one', 'many', 'mixed'] as const).map(content => combo({
        id: `${variant}/${size}/${content}`,
        position: 'bottom-right',
        open: true,
        visible: true,
        variant,
        size,
        content,
      })))),
];

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning EVERY violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(0);

    const host = document.getElementById('subject') as HTMLElement | null;
    const anchor = document.getElementById('anchor') as HTMLElement;
    const under = document.getElementById('under') as HTMLElement;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const base = [...sr.querySelectorAll('[part]')].find(node =>
      (node.getAttribute('part') ?? '').split(/\s+/).includes('base')) as HTMLElement | undefined;
    if (!base) { say('no part="base" painted'); return problems; }

    // ── The documented accessible shell survives into the painted tree ───────
    if (base.getAttribute('role') !== 'toolbar') {
      say(`part="base" role="${base.getAttribute('role')}", expected "toolbar"`);
    }

    const hostBox = rect(host);
    const baseBox = rect(base);
    const anchorBox = rect(anchor);

    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`toolbar renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    // The host is declared `contain: layout style` with no paint containment
    // precisely so it hugs the bar; a host that does not wrap its own toolbar
    // means the positioning below is measuring the wrong box.
    if (baseBox.left < hostBox.left - EPS || baseBox.right > hostBox.right + EPS
      || baseBox.top < hostBox.top - EPS || baseBox.bottom > hostBox.bottom + EPS) {
      say(`toolbar (${round(baseBox.left)},${round(baseBox.top)}`
        + ` ${round(baseBox.width)}x${round(baseBox.height)}) escapes its host`
        + ` (${round(hostBox.left)},${round(hostBox.top)}`
        + ` ${round(hostBox.width)}x${round(hostBox.height)})`);
    }

    // ── VISIBILITY: the three documented states ──────────────────────────────
    //
    // `open` and `no-animation` are documented as visible; the default state is
    // not. In a browser that is three separate facts — computed visibility,
    // computed opacity, and whether a pointer can reach the thing — and a
    // component can get any one of them wrong on its own.
    const hostStyle = getComputedStyle(host);
    const wantVisible = combo.visible;
    const isVisible = hostStyle.visibility === 'visible';
    const opacity = Number(hostStyle.opacity);
    const clickable = hostStyle.pointerEvents !== 'none';
    if (isVisible !== wantVisible) {
      say(`visibility "${hostStyle.visibility}" for a ${wantVisible ? 'visible' : 'hidden'} bar`);
    }
    if (wantVisible ? opacity < 1 : opacity > 0) {
      say(`opacity ${hostStyle.opacity} for a ${wantVisible ? 'visible' : 'hidden'} bar`);
    }
    if (clickable !== wantVisible) {
      say(`pointer-events "${hostStyle.pointerEvents}" for a`
        + ` ${wantVisible ? 'visible' : 'hidden'} bar`);
    }

    // OCCLUSION, both directions. A visible bar must be reachable at a point
    // inside its own padding strip (a point at a child's centre would find the
    // child, which proves nothing about the bar). A hidden one must let the
    // anchor content through at the very same point.
    const probeX = baseBox.left + 2;
    const probeY = baseBox.top + 2;
    const hit = document.elementFromPoint(probeX, probeY);
    if (wantVisible) {
      if (hit !== host) {
        say(`a pointer at the toolbar's own corner finds`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}${hit?.id ? `#${hit.id}` : ''}>,`
          + ' not the action bar');
      }
    } else if (hit === host || host.contains(hit as Node)) {
      say('a closed bar still answers the hit-test — it is not click-through');
    } else if (hit !== under) {
      say(`a closed bar lets a pointer through to`
        + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}${hit?.id ? `#${hit.id}` : ''}>,`
        + ' not the anchor content');
    }

    // ── POSITION: the bar anchors to the named edges of its relative parent ──
    //
    // The inset is read from the theme rather than hardcoded: the CSS places
    // every position at `--snice-spacing-sm`, so the assertion is "the theme's
    // own small spacing", which stays true when the theme is retuned.
    const rootStyle = getComputedStyle(document.documentElement);
    const rem = parseFloat(rootStyle.fontSize);
    const rawInset = rootStyle.getPropertyValue('--snice-spacing-sm').trim();
    const inset = rawInset.endsWith('rem') ? parseFloat(rawInset) * rem : parseFloat(rawInset);

    // Only the visible states are placed at the resting offset. A closed,
    // animating bar sits at its documented pre-entrance transform (half a rem
    // off the edge it slides in from), which is a different box on purpose.
    if (wantVisible) {
      const [vertical, horizontal] = (() => {
        const parts = combo.position.split('-');
        if (parts.length === 2) return parts as [string, string];
        return ['top', 'bottom'].includes(combo.position)
          ? [combo.position, 'centre']
          : ['centre', combo.position];
      })();

      const near = (actual: number, expected: number, what: string) => {
        // 1.5px: a centred bar of odd width lands on a half pixel, and the
        // subpixel rounding of a rem-derived inset is worth the same slack.
        if (Math.abs(actual - expected) > EPS) {
          say(`${what} is ${actual.toFixed(1)}px, expected ${expected.toFixed(1)}px`);
        }
      };

      if (vertical === 'top') near(hostBox.top - anchorBox.top, inset, 'top inset');
      else if (vertical === 'bottom') near(anchorBox.bottom - hostBox.bottom, inset, 'bottom inset');
      else {
        near(hostBox.top + hostBox.height / 2, anchorBox.top + anchorBox.height / 2,
          'vertical centre');
      }

      if (horizontal === 'left') near(hostBox.left - anchorBox.left, inset, 'left inset');
      else if (horizontal === 'right') near(anchorBox.right - hostBox.right, inset, 'right inset');
      else {
        near(hostBox.left + hostBox.width / 2, anchorBox.left + anchorBox.width / 2,
          'horizontal centre');
      }
    }

    // Whatever the state, the bar belongs INSIDE the relative parent it is
    // positioned against — a bar hanging off the anchor is a bar over the wrong
    // content.
    if (hostBox.left < anchorBox.left - EPS || hostBox.right > anchorBox.right + EPS
      || hostBox.top < anchorBox.top - EPS || hostBox.bottom > anchorBox.bottom + EPS) {
      say(`the bar (${round(hostBox.left)},${round(hostBox.top)}`
        + ` ${round(hostBox.width)}x${round(hostBox.height)}) hangs outside its relative parent`
        + ` (${round(anchorBox.left)},${round(anchorBox.top)}`
        + ` ${round(anchorBox.width)}x${round(anchorBox.height)})`);
    }

    // ── The actions form one row inside the toolbar ──────────────────────────
    const slot = sr.querySelector('slot') as HTMLSlotElement | null;
    if (!slot) say('no default slot painted');
    const actions = (slot?.assignedElements({ flatten: true }) ?? []) as HTMLElement[];
    const authored = [...host.children] as HTMLElement[];
    if (actions.length !== authored.length) {
      say(`${actions.length} actions projected, ${authored.length} authored`);
    }

    const boxes: DOMRect[] = [];
    actions.forEach((action, i) => {
      const r = rect(action);
      const name = action.id || `#${i}`;
      if (!wantVisible) return; // a hidden bar's children have boxes but no claim on them
      if (r.width <= 0 || r.height <= 0) { say(`action ${name} renders at ${r.width}x${r.height}`); return; }
      if (r.left < baseBox.left - EPS || r.right > baseBox.right + EPS
        || r.top < baseBox.top - EPS || r.bottom > baseBox.bottom + EPS) {
        say(`action ${name} escapes the toolbar`);
      }
      const cs = getComputedStyle(action);
      // The stagger animation ends at full opacity; a child still transparent
      // after the bar has settled would be invisible to the user forever.
      if (Number(cs.opacity) < 1) say(`action ${name} settled at opacity ${cs.opacity}`);
      const centreHit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (centreHit !== action && !action.contains(centreHit as Node)) {
        say(`action ${name} is occluded by`
          + ` <${centreHit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
      boxes.push(r);
    });

    // A toolbar is `inline-flex` in row direction: the actions advance to the
    // right and never pile up. Overlapping boxes are the classic symptom of a
    // flex container that collapsed.
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].left < boxes[i - 1].right - EPS) {
        say(`action ${i} (left ${round(boxes[i].left)}) overlaps action ${i - 1}`
          + ` (right ${round(boxes[i - 1].right)})`);
      }
      if (Math.abs(boxes[i].top - boxes[i - 1].top) > boxes[i].height) {
        say(`action ${i} wrapped onto a second line`);
      }
    }

    // ── variant: "pill" is a fully rounded end, "default" is a corner ────────
    const baseStyle = getComputedStyle(base);
    const radius = parseFloat(baseStyle.borderTopLeftRadius);
    const half = baseBox.height / 2;
    if (combo.variant === 'pill') {
      if (radius < half - 1) {
        say(`variant="pill" resolves to a ${radius.toFixed(1)}px radius on a`
          + ` ${baseBox.height.toFixed(1)}px-tall bar — not a pill`);
      }
    } else if (!(radius > 0 && radius < half - 1)) {
      say(`variant="default" resolves to a ${radius.toFixed(1)}px radius on a`
        + ` ${baseBox.height.toFixed(1)}px-tall bar — expected a corner, not a pill`);
    }

    // The toolbar is the surface the CSS custom properties describe: it has a
    // background, a border and a shadow, and none of them may resolve away.
    if (baseStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      say('the toolbar has no background — the anchor content reads through it');
    }
    if (baseStyle.boxShadow === 'none') say('the toolbar paints no shadow');
    if (parseFloat(baseStyle.borderTopWidth) <= 0) say('the toolbar paints no border');

    return problems;
  }, combo as any);
}

test.describe('action-bar visual matrix: layer 1', () => {
  for (const combo of COMBOS) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.open, `open state after mounting ${combo.id}`).toBe(combo.open);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

/**
 * `size="small"` is documented as a size, and the CSS spends its whole
 * definition on gap and padding. Asserted once, by comparison, because "is
 * smaller than" is a claim about two combos and belongs to neither.
 */
test.describe('action-bar visual matrix: cross-combo geometry', () => {
  test('size="small" is tighter than size="medium" for identical content', async () => {
    const measure = async (size: 'small' | 'medium') => {
      await page.evaluate(s => (window as any).matrix.mount({
        position: 'bottom', size: s, open: true, content: 'three',
      }), size);
      return page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const base = [...sr.querySelectorAll('[part]')].find(n =>
          (n.getAttribute('part') ?? '').split(/\s+/).includes('base'))!;
        const box = base.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
    };
    const small = await measure('small');
    const medium = await measure('medium');
    expect(small.height,
      `small is ${small.height}px tall, medium ${medium.height}px`)
      .toBeLessThan(medium.height);
    expect(small.width,
      `small is ${small.width}px wide, medium ${medium.width}px`)
      .toBeLessThan(medium.width);
  });

  test('Escape closes an open bar and no-escape-dismiss keeps it open', async () => {
    // The documented dismiss contract, checked where it is actually observable:
    // closing is a visual event (the bar stops being reachable), and only a
    // browser can say whether the pointer can still land on it afterwards.
    await page.evaluate(() => (window as any).matrix.mount({
      position: 'bottom', open: true, content: 'three',
    }));
    const dismissed = await page.evaluate(() => (window as any).matrix.press('Escape'));
    expect(dismissed.open, 'Escape did not close the bar').toBe(false);
    expect(await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      return getComputedStyle(host).visibility;
    }), 'the dismissed bar is still painted').toBe('hidden');

    await page.evaluate(() => (window as any).matrix.mount({
      position: 'bottom', open: true, content: 'three', noEscapeDismiss: true,
    }));
    const kept = await page.evaluate(() => (window as any).matrix.press('Escape'));
    expect(kept.open, 'no-escape-dismiss did not survive Escape').toBe(true);
  });

  test('the roving arrow keys move focus along the painted row', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      position: 'bottom', open: true, content: 'three',
    }));
    await page.evaluate(() => (window as any).matrix.focusChild('a'));
    const right = await page.evaluate(() => (window as any).matrix.press('ArrowRight'));
    expect(right.activeId, 'ArrowRight did not advance along the toolbar').toBe('b');
    const end = await page.evaluate(() => (window as any).matrix.press('End'));
    expect(end.activeId, 'End did not jump to the last action').toBe('c');
    const home = await page.evaluate(() => (window as any).matrix.press('Home'));
    expect(home.activeId, 'Home did not jump to the first action').toBe('a');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Three. Layer 1 already measured every box and every computed value; these are
// the claims that only painted pixels can settle.

test.describe('action-bar visual matrix: marquee pixels', () => {
  test('the bar paints a boundary against a page of the same colour', async () => {
    // The toolbar's surface is `--snice-color-surface-container-high`, which in
    // the light theme is a hair off the page's own white. So "the bar is
    // visible" is NOT a contrast claim about its fill — it is the claim that a
    // border and a shadow were painted along its edge. A scan across that edge
    // must therefore find something darker than the bar's own interior.
    await page.evaluate(() => (window as any).matrix.mount({
      position: 'bottom', open: true, content: 'three',
    }));
    const pixels = await capture(
      page, '#anchor', 'action-bar-boundary',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const base = [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') || '').split(/\\s+/).includes('base'));
        const box = base.getBoundingClientRect();
        const y = box.y + box.height / 2;
        // interior first, then a scan stepping outward across the left edge.
        return [12, 4, 1, 0, -1, -3, -6].map(dx => ({ x: box.x + dx, y }));
      }`,
    );
    const [interior, ...scan] = pixels;
    const darkest = scan.reduce((best, p) => (luminance(p) < luminance(best) ? p : best), scan[0]);
    expect(scan.some(p => !sameColor(p, interior)),
      `every pixel across the bar's left edge painted ${interior.join(',')} —`
      + ' no boundary was drawn').toBe(true);
    expect(luminance(interior) - luminance(darkest),
      `the darkest pixel on the bar's edge (${darkest.join(',')}) is no darker than`
      + ` its interior (${interior.join(',')})`).toBeGreaterThan(0.02);
  });

  test('variant="pill" really cuts the corner away', async () => {
    // `border-radius: 9999px` is a computed style; whether the corner pixel
    // stopped being part of the bar is not. Probe the same offset on both
    // variants: at (+3,+3) the default's 8px radius still has border on it,
    // while a pill of this height has curved well past that point.
    const cornerPixel = async (variant: 'default' | 'pill') => {
      await page.evaluate(v => (window as any).matrix.mount({
        position: 'bottom', open: true, content: 'three', variant: v,
      }), variant);
      const [corner] = await capture(
        page, '#anchor', `action-bar-corner-${variant}`,
        `() => {
          const sr = document.getElementById('subject').shadowRoot;
          const base = [...sr.querySelectorAll('[part]')]
            .find(n => (n.getAttribute('part') || '').split(/\\s+/).includes('base'));
          const box = base.getBoundingClientRect();
          return [{ x: box.x + 3, y: box.y + 3 }];
        }`,
      );
      return corner;
    };
    const plain = await cornerPixel('default');
    const pill = await cornerPixel('pill');
    expect(sameColor(plain, pill),
      `both variants painted ${plain.join(',')} at the same corner offset —`
      + ' the pill radius changed nothing').toBe(false);
    expect(luminance(pill),
      `the pill's corner painted ${pill.join(',')}, no lighter than the square`
      + ` corner's ${plain.join(',')} — the corner was not cut away`)
      .toBeGreaterThan(luminance(plain));
  });

  test('a closed bar paints nothing at all', async () => {
    // The counterpart to every visible assertion above, and the one that
    // computed style can lie about: `visibility: hidden` on the host still
    // leaves a laid-out box, and a child that re-declares `visibility: visible`
    // would paint inside it. Probe the closed bar's own box; every point must
    // be the page underneath.
    await page.evaluate(() => (window as any).matrix.mount({
      position: 'bottom-right', open: false, content: 'three',
    }));
    const pixels = await capture(
      page, '#anchor', 'action-bar-closed',
      `() => {
        const host = document.getElementById('subject');
        const box = host.getBoundingClientRect();
        return [
          { x: box.x + box.width / 2, y: box.y + box.height / 2 },
          { x: box.x + 4, y: box.y + 4 },
          { x: box.right - 4, y: box.bottom - 4 },
          // The reference: the anchor's own ground, far from the bar.
          { x: 20, y: 20 },
        ];
      }`,
    );
    const ground = pixels[3];
    for (const [i, pixel] of pixels.slice(0, 3).entries()) {
      expect(sameColor(pixel, ground),
        `probe ${i} inside the closed bar painted ${pixel.join(',')},`
        + ` not the page's ${ground.join(',')}`).toBe(true);
    }
  });
});
