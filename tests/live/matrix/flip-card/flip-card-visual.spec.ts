/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-flip-card TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/flip-card, `npm run test:matrix`) owns state
 * truth: which parts exist, what `flip()` and `flipTo()` do, what the
 * `flip-change` payload carries. It cannot own visual truth, and for THIS
 * component the gap is total: a flip card is a 3D transform and a
 * `backface-visibility` rule. In happy-dom both faces are equally "there", the
 * card is never turned, and "which side is the user looking at" is a question
 * nothing in the DOM tier can even ask.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · both faces stack exactly on the card's box — a flip card whose back face
 *     is offset is two cards in a trench coat;
 *   · `flipped` really turns the card: the base's resolved transform matrix is
 *     a half turn, and `direction` decides WHICH axis it turns around;
 *   · `duration` reaches the transition through `--flip-duration`;
 *   · both faces hide their backs (`backface-visibility: hidden`), which is
 *     what makes the turn show one face rather than a mirror-image of both;
 *   · the face the user is looking at is the one the CURSOR would touch —
 *     elementFromPoint through a 3D transform is the browser's own answer to
 *     "which side is showing", and it has no DOM equivalent.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The fixture paints its two faces in two saturated, different colours, so
 *   the marquee captures can answer the only question that finally matters:
 *   after a flip, whose pixels are on the screen?
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/flip-card/matrix.html';

type Direction = 'horizontal' | 'vertical';

interface Combo {
  id: string;
  flipped: boolean;
  clickToFlip: boolean;
  direction: Direction;
  duration: number;
}

const DIRECTIONS: Direction[] = ['horizontal', 'vertical'];
const DURATIONS = [600, 120];

/** The fixture's two face colours. */
const FRONT: RGB = [37, 99, 235];
const BACK: RGB = [217, 70, 239];

/**
 * The cross: direction x flipped x clickToFlip x duration — 16 combos. A flip
 * card has one render function with no branches and four properties, so this is
 * the small end of the scale `.ai/fuzzing.md` describes; what it buys is that
 * every documented dimension is measured in a browser that can actually
 * perform a 3D transform.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const direction of DIRECTIONS) {
    for (const flipped of [false, true]) {
      for (const clickToFlip of [true, false]) {
        for (const duration of DURATIONS) {
          combos.push({
            id: `${direction}/${flipped ? 'back' : 'front'}`
              + `/${clickToFlip ? 'clickable' : 'static'}/duration:${duration}`,
            flipped, clickToFlip, direction, duration,
          });
        }
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

    const base = partsNamed('base')[0];
    const front = partsNamed('front')[0];
    const back = partsNamed('back')[0];
    if (!base || !front || !back) { say('the card is missing a documented part'); return problems; }

    const hostBox = rect(host);
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`the card renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    // The card fills the box its author gave it (the documented usage sets one
    // on the host); a card that shrinks to nothing has no faces to turn.
    if (Math.abs(baseBox.width - hostBox.width) > EPS
      || Math.abs(baseBox.height - hostBox.height) > EPS) {
      say(`the card (${baseBox.width.toFixed(0)}x${baseBox.height.toFixed(0)}) does not fill`
        + ` its host (${hostBox.width.toFixed(0)}x${hostBox.height.toFixed(0)})`);
    }

    // ── The two faces occupy the same box ───────────────────────────────────
    for (const [name, face] of [['front', front], ['back', back]] as const) {
      const faceBox = rect(face);
      const cs = getComputedStyle(face);
      if (faceBox.width <= 0 || faceBox.height <= 0) {
        say(`the ${name} face renders at ${faceBox.width}x${faceBox.height}`);
        continue;
      }
      if (Math.abs(faceBox.width - baseBox.width) > 2
        || Math.abs(faceBox.height - baseBox.height) > 2) {
        say(`the ${name} face (${faceBox.width.toFixed(0)}x${faceBox.height.toFixed(0)})`
          + ` is not the size of the card (${baseBox.width.toFixed(0)}x${baseBox.height.toFixed(0)})`);
      }
      // Without this, a turned card shows a mirrored copy of the other face.
      const backface = cs.backfaceVisibility || (cs as any).webkitBackfaceVisibility;
      if (backface !== 'hidden') {
        say(`the ${name} face has backface-visibility "${backface}"`);
      }
    }

    // ── The turn itself ─────────────────────────────────────────────────────
    //
    // A half turn about Y leaves m11 = -1 with m33 = -1; about X it is
    // m22 = -1. Reading the resolved matrix is the only way to know the card
    // really turned, and around which axis.
    const matrix = new DOMMatrixReadOnly(getComputedStyle(base).transform);
    const round = (n: number) => Math.round(n * 100) / 100;
    if (combo.flipped) {
      if (combo.direction === 'horizontal') {
        if (round(matrix.m11) !== -1 || round(matrix.m22) !== 1) {
          say(`a flipped horizontal card resolved to m11=${round(matrix.m11)}`
            + ` m22=${round(matrix.m22)}, expected a half turn about Y`);
        }
      } else if (round(matrix.m22) !== -1 || round(matrix.m11) !== 1) {
        say(`a flipped vertical card resolved to m11=${round(matrix.m11)}`
          + ` m22=${round(matrix.m22)}, expected a half turn about X`);
      }
    } else if (round(matrix.m11) !== 1 || round(matrix.m22) !== 1) {
      say(`an unflipped card is already turned (m11=${round(matrix.m11)},`
        + ` m22=${round(matrix.m22)})`);
    }

    // ── duration reaches the transition ─────────────────────────────────────
    const custom = host.style.getPropertyValue('--flip-duration').trim();
    const transition = getComputedStyle(base).transitionDuration;
    const transitionMs = transition.endsWith('ms')
      ? parseFloat(transition) : parseFloat(transition) * 1000;
    if (custom && Math.abs(transitionMs - combo.duration) > 1) {
      say(`duration=${combo.duration} but the card transitions over ${transition}`);
    }
    if (!custom && combo.duration !== 600) {
      say(`duration=${combo.duration} never reached --flip-duration`);
    }

    // ── Occlusion: the visible face is the one the cursor touches ───────────
    const x = baseBox.left + baseBox.width / 2;
    const y = baseBox.top + baseBox.height / 2;
    const outer = document.elementFromPoint(x, y);
    // The faces are SLOTTED, so the page-level hit-test legitimately lands on
    // the author's own light-DOM child rather than on the host itself.
    if (outer !== host && !host.contains(outer as Node)) {
      say(`the card's hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
        + ' not the flip card');
    } else {
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      const showing = combo.flipped ? back : front;
      const hidden = combo.flipped ? front : back;
      // The faces are SLOTTED, so the hit is usually the author's own child
      // rather than the shadow container that holds its slot. Its `slot`
      // attribute is what names the face the user is actually looking at.
      const slotted = (hit as HTMLElement | null)?.closest?.('[slot]');
      const facing = slotted?.getAttribute('slot');
      const wanted = combo.flipped ? 'back' : 'front';
      if (facing && facing !== wanted) {
        say(`the ${facing} face is facing the user on a card showing its ${wanted}`);
      } else if (!facing && hidden.contains(hit as Node)) {
        say(`the ${wanted === 'back' ? 'front' : 'back'} face is facing the user`
          + ` on a card showing its ${wanted}`);
      } else if (!facing && hit !== showing && !showing.contains(hit as Node) && hit !== base) {
        say(`the visible face is not the hit target — found`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('flip-card visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.flipped).toBe(combo.flipped);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('flip-card visual matrix: a real pointer really flips', () => {
  test('a click turns the card and announces the new side', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ duration: 120 }));
    const point = await page.evaluate(() => {
      const box = document.getElementById('subject')!.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    await page.mouse.click(point.x, point.y);
    await page.evaluate(() => (window as any).matrix.rest());
    const state = await page.evaluate(() => {
      const el = (window as any).matrix.el;
      const base = el.shadowRoot.querySelector('[part~="base"]');
      const matrix = new DOMMatrixReadOnly(getComputedStyle(base).transform);
      return {
        flipped: el.flipped,
        events: (window as any).matrix.events,
        m11: Math.round(matrix.m11 * 100) / 100,
      };
    });
    expect(state.flipped).toBe(true);
    expect(state.events).toEqual([{ flipped: true, side: 'back' }]);
    expect(state.m11, 'the card never turned').toBe(-1);
  });

  test('a static card ignores a real click', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      clickToFlip: false, duration: 120,
    }));
    const point = await page.evaluate(() => {
      const box = document.getElementById('subject')!.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    await page.mouse.click(point.x, point.y);
    await page.evaluate(() => (window as any).matrix.rest());
    const state = await page.evaluate(() => ({
      flipped: (window as any).matrix.el.flipped,
      events: (window as any).matrix.events,
    }));
    expect(state.flipped).toBe(false);
    expect(state.events).toEqual([]);
  });

  test('Enter on the focused card flips it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ duration: 120 }));
    await page.evaluate(() => {
      const base = (window as any).matrix.el.shadowRoot.querySelector('[part~="base"]');
      base.focus();
    });
    await page.keyboard.press('Enter');
    await page.evaluate(() => (window as any).matrix.rest());
    expect(await page.evaluate(() => (window as any).matrix.el.flipped)).toBe(true);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose, and for this component the most important layer there is:
// everything above measures the model the browser built, and only pixels can
// say which face the model ended up showing.

test.describe('flip-card visual matrix: marquee pixels', () => {
  const centreProbe = `(host) => {
    const box = host.getBoundingClientRect();
    return [
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      { x: box.x + box.width * 0.2, y: box.y + box.height * 0.25 },
    ];
  }`;

  /**
   * Which documented face is on the screen, judged by nearest colour.
   *
   * The claim under test is the documented one — "`flipped` … whether back face
   * is showing" — and nearest-colour is the honest way to ask it. An exact
   * triple would be asserting something the docs never promise: a face turned a
   * half turn is composited by the engine against the page behind it (a fully
   * turned layer measures as a partial coverage of its own colour in Chromium,
   * with or without the other face present), so the pixel is the face's hue,
   * lightened. Hue is what identifies the face; the exact blend is the
   * renderer's business.
   */
  const distance = (a: RGB, b: RGB) =>
    Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const showing = (pixel: RGB): 'front' | 'back' =>
    distance(pixel, FRONT) <= distance(pixel, BACK) ? 'front' : 'back';

  test('a front-facing card paints its front face', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ duration: 120 }));
    const [centre, corner] = await capture(page, '#subject', 'flip-card-front', centreProbe);
    // The un-turned face is composited flat, so this one IS an exact match.
    for (const [name, pixel] of [['centre', centre], ['corner', corner]] as const) {
      expect(sameColor(pixel, FRONT),
        `the ${name} painted ${pixel.join(',')}, not the front face's own colour`).toBe(true);
    }
  });

  // FINDING VISUAL-MATRIX-flip-card-1 — FIXED. A flipped card used to paint
  // its front, not its back, in Firefox and WebKit. `snice-flip-card.css`
  // gave `.front` a `z-index: 2`, and a z-index on a child of a
  // `preserve-3d` element forces a stacking context that flattens the 3D
  // sorting in those two engines, so `backface-visibility: hidden` stopped
  // hiding the turned front face and the z-index kept it ON TOP of the back —
  // the card never visually flipped. The z-index is replaced by a
  // `translateZ(1px)` lift, which stacks the front over the back in Chromium
  // without flattening the 3D context; the assertions below are unchanged.
  test('a flipped card paints its back face (fixed: VISUAL-MATRIX-flip-card-1)', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ flipped: true, duration: 120 }));
    const [centre, corner] = await capture(page, '#subject', 'flip-card-back', centreProbe);
    for (const [name, pixel] of [['centre', centre], ['corner', corner]] as const) {
      expect(showing(pixel), `the ${name} painted ${pixel.join(',')}`).toBe('back');
    }
  });

  // FINDING VISUAL-MATRIX-flip-card-1 (vertical variant, fixed) — same root
  // cause as the horizontal pin above: the `.front` z-index flattened the 3D
  // context in Firefox and WebKit, so the turned front face stayed on screen.
  test('a vertical flip also lands on the back face (fixed: VISUAL-MATRIX-flip-card-1)', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      flipped: true, direction: 'vertical', duration: 120,
    }));
    const [centre] = await capture(page, '#subject', 'flip-card-vertical-back', centreProbe);
    expect(showing(centre), `a vertically flipped card painted ${centre.join(',')}`).toBe('back');
  });

  test('flipping back returns the front face to the screen', async () => {
    await page.evaluate(async () => {
      await (window as any).matrix.mount({ duration: 120 });
      (window as any).matrix.el.flip();
      await (window as any).matrix.rest();
      (window as any).matrix.el.flip();
      await (window as any).matrix.rest();
    });
    const [centre] = await capture(page, '#subject', 'flip-card-round-trip', centreProbe);
    expect(sameColor(centre, FRONT),
      `after a round trip the card painted ${centre.join(',')}`).toBe(true);
  });
});
