/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-carousel TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/carousel, `npm run test:matrix`) owns the
 * structure and the state: the part tree, one indicator per reachable
 * position, the active one marked, which button is disabled at a boundary,
 * the inline `translateX(-(activeIndex * 100 / slidesPerView)%)`, the
 * slide-change payload, and the autoplay advance logic.
 *
 * It cannot own the WINDOW, because a window is a fact about layout: which
 * slides' boxes are inside the viewport, which are clipped by its
 * `overflow: hidden`, how wide a slide is once
 * `calc(100%/spv − spaceBetween·(spv−1)/spv)` resolves, and whether the
 * controls and dots paint where a pointer can reach them. That is this tier.
 *
 * The documented contract the layer-1 oracle encodes, per position `i` with
 * `slidesPerView = n` and `spaceBetween = s`:
 *
 *   · each slide's box is `(viewport − s·(n−1)) / n` wide, and consecutive
 *     slides sit exactly `s` apart (the doc's "space-between" in px);
 *   · the viewport shows EXACTLY slides `i .. i+n−1`: the first flush with
 *     the viewport's left edge, the last flush with its right edge, none of
 *     them clipped, and every other slide fully outside — "active-index
 *     selects the visible slide", "multi-slide views";
 *   · the prev/next controls are 2.5rem circles floating on the slides:
 *     inside the viewport's edges, vertically centred on the carousel's
 *     own box (the stylesheet's `top: 50%` of part="container" — the
 *     viewport plus the indicator row), above the slides, and
 *     pointer-reachable;
 *   · the indicator dots are 0.5rem circles in a centred row 1rem under the
 *     viewport, 0.5rem apart, and the marked dot paints the theme's primary
 *     while the others do not;
 *   · `show-controls` / `show-indicators` gate whole subtrees, so without
 *     dots the host's box ends with the viewport;
 *   · a boundary button under `loop="false"` is visibly disabled (0.3
 *     opacity, refused cursor) while its partner stays enabled.
 *
 * ── FINDINGS (documented contract, observed divergence — pinned, not softened)
 *
 *  VISUAL-MATRIX-carousel-1 — FIXED. `space-between > 0` used to break every
 *    position after the first. The slides container was translated by
 *    `activeIndex · (100 / slidesPerView)%` OF THE CONTAINER'S OWN WIDTH,
 *    but a position's real travel is one slide PLUS one gap
 *    (`slideWidth + spaceBetween`). The transform now includes the gap term;
 *    the combos below are unwrapped and their assertions unchanged.
 *  VISUAL-MATRIX-carousel-2 — FIXED with the DOM tier's MATRIX-carousel-3
 *    (same root cause: the initial attribute never reached the transform).
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/carousel/matrix.html';

/** The fixture leaves the root font size at the browser default: 16px/rem. */
const REM = 16;
/** Stylesheet dimensions the doc's parts imply: a 2.5rem control, a 0.5rem
 *  dot, a 0.5rem dot gap, a 1rem row offset. */
const BUTTON_PX = 2.5 * REM;
const DOT_PX = 0.5 * REM;
const DOT_GAP_PX = 0.5 * REM;
const DOTS_MARGIN_PX = 1 * REM;

interface Combo {
  id: string;
  slides: number;
  slidesPerView: number;
  spaceBetween: number;
  position: number;
  showControls: boolean;
  showIndicators: boolean;
  loop: boolean;
  /** A `VISUAL-MATRIX-carousel-N` id when this combo records a divergence. */
  finding?: string;
}

const combo = (over: Partial<Combo> & { id: string }): Combo => ({
  slides: 6, slidesPerView: 1, spaceBetween: 0, position: 0,
  showControls: true, showIndicators: true, loop: true, ...over,
});

/** Reachable positions per the doc: `slides − slidesPerView + 1`. */
const positions = (slides: number, spv: number) => slides - spv + 1;

/**
 * WINDOW: slidesPerView (1,2,3) x spaceBetween (0,16) x position (first,
 * middle, last) = 18 combos. Every `space-between > 0 && position > 0` combo
 * carries VISUAL-MATRIX-carousel-1.
 */
function windowCombos(): Combo[] {
  const combos: Combo[] = [];
  const pick = (last: number): number[] =>
    last < 3 ? [0] : [...new Set([0, Math.floor(last / 2), last])];
  for (const spv of [1, 2, 3]) {
    for (const spaceBetween of [0, 16]) {
      for (const position of pick(positions(6, spv) - 1)) {
        const drift = spaceBetween > 0 && position > 0;
        combos.push(combo({
          id: `window/spv=${spv}/space=${spaceBetween}/position=${position}`,
          slidesPerView: spv, spaceBetween, position,
          finding: drift ? 'VISUAL-MATRIX-carousel-1' : undefined,
        }));
      }
    }
  }
  return combos;
}

/** CHROME: show-controls x show-indicators = 4 combos at a fixed window. */
function chromeCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const showControls of [true, false]) {
    for (const showIndicators of [true, false]) {
      combos.push(combo({
        id: `chrome/controls=${showControls}/indicators=${showIndicators}`,
        slides: 4, showControls, showIndicators,
      }));
    }
  }
  return combos;
}

/** BOUNDARY: loop=false at the first and last position = 2 combos. */
function boundaryCombos(): Combo[] {
  const last = positions(4, 1) - 1;
  return [0, last].map(position => combo({
    id: `boundary/loop=false/position=${position}`,
    slides: 4, loop: false, position,
  }));
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
async function visualProblems(c: Combo): Promise<string[]> {
  return page.evaluate(({ c, buttonPx, dotPx, dotGapPx, dotsMarginPx }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const round = (n: number) => n.toFixed(1);
    const matrix = (window as any).matrix;
    const token = (name: string) => matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

    const viewport = partNamed('viewport')[0];
    if (!viewport) { say('no part="viewport" rendered'); return problems; }
    const v = viewport.getBoundingClientRect();
    // The controls' anchor: the stylesheet floats them at `top: 50%` of the
    // carousel's own container box, which is the viewport PLUS the indicator
    // row — the docs (docs/ai/components/carousel.md: CSS parts, "ARIA roles
    // and labels for controls") promise overlay controls a pointer can reach,
    // not a centring on the viewport alone.
    const cont = (partNamed('container')[0] ?? viewport).getBoundingClientRect();
    if (v.width < 10 || v.height < 10) {
      say(`the viewport renders at ${round(v.width)}x${round(v.height)}`);
      return problems;
    }

    const slides = [...host.children] as HTMLElement[];
    if (slides.length !== c.slides) {
      say(`${slides.length} slides mounted, combo authored ${c.slides}`);
      return problems;
    }
    const boxes = slides.map(slide => slide.getBoundingClientRect());

    // ── the slide arithmetic: width and stride ──────────────────────────────
    const slideWidth = (v.width - c.spaceBetween * (c.slidesPerView - 1)) / c.slidesPerView;
    for (const [index, box] of boxes.entries()) {
      if (Math.abs(box.width - slideWidth) > EPS) {
        say(`slide ${index} is ${round(box.width)}px wide, expected ${round(slideWidth)}px`
          + ` ((viewport ${round(v.width)} − ${c.spaceBetween}·${c.slidesPerView - 1})`
          + ` / ${c.slidesPerView})`);
      }
      if (Math.abs(box.height - v.height) > EPS) {
        say(`slide ${index} is ${round(box.height)}px tall in a ${round(v.height)}px viewport`);
      }
    }
    for (let i = 1; i < boxes.length; i++) {
      const gap = boxes[i].left - boxes[i - 1].right;
      if (Math.abs(gap - c.spaceBetween) > EPS) {
        say(`slides ${i - 1}-${i} sit ${round(gap)}px apart, expected space-between=${c.spaceBetween}px`);
      }
      if (boxes[i].top < boxes[i - 1].top - EPS) {
        say(`slide ${i} is above slide ${i - 1}`);
      }
    }

    // ── THE window: exactly positions spv slides fill the viewport ─────────
    const last = c.position + c.slidesPerView - 1;
    if (last >= boxes.length) {
      say(`position ${c.position} + ${c.slidesPerView} slides exceeds the ${boxes.length} mounted`);
    } else {
      const firstBox = boxes[c.position];
      const lastBox = boxes[last];
      if (Math.abs(firstBox.left - v.left) > EPS) {
        say(`the active slide starts ${round(firstBox.left - v.left)}px into the viewport —`
          + ' "active-index selects the visible slide" means flush with its left edge');
      }
      if (Math.abs(lastBox.right - v.right) > EPS) {
        say(`the window's last slide ends ${round(v.right - lastBox.right)}px short of the`
          + ' viewport\'s right edge');
      }
      for (let i = c.position; i <= last; i++) {
        const box = boxes[i];
        if (box.left < v.left - EPS || box.right > v.right + EPS) {
          say(`slide ${i} is INSIDE the window but clipped (${round(box.left)}..${round(box.right)}`
            + ` vs viewport ${round(v.left)}..${round(v.right)})`);
        }
      }
    }
    for (const [index, box] of boxes.entries()) {
      if (index >= c.position && index <= last) continue;
      const outside = box.right <= v.left + EPS || box.left >= v.right - EPS;
      if (!outside) {
        say(`slide ${index} is outside the window but peeks into the viewport —`
          + ' the viewport\'s overflow must clip it');
      }
    }

    // ── the controls: circles centred on the viewport, above the slides ────
    const controls = partNamed('controls')[0] ?? null;
    const prev = partNamed('button-prev')[0] ?? null;
    const next = partNamed('button-next')[0] ?? null;
    if (c.showControls) {
      if (!prev || !next) { say('show-controls is on but a navigation button is missing'); }
      else {
        for (const [name, button] of [['prev', prev], ['next', next]] as Array<[string, HTMLElement]>) {
          const box = button.getBoundingClientRect();
          if (Math.abs(box.width - buttonPx) > EPS || Math.abs(box.height - buttonPx) > EPS) {
            say(`the ${name} button renders at ${round(box.width)}x${round(box.height)}px,`
              + ` expected the ${round(buttonPx)}px circle`);
          }
          if (Math.abs(box.top + box.height / 2 - (cont.top + cont.height / 2)) > EPS) {
            say(`the ${name} button is not vertically centred on the carousel's own box`);
          }
          if (box.top < v.top - EPS || box.bottom > v.bottom + EPS) {
            say(`the ${name} button leaves the slides' band — controls float on the viewport, not the dot row`);
          }
          if (box.left < v.left - EPS || box.right > v.right + EPS) {
            say(`the ${name} button escapes the viewport horizontally`);
          }
          // The control floats ON the slides: a pointer at its centre must
          // find the button, not the slide underneath it.
          const hit = (sr as any).elementFromPoint(
            box.left + box.width / 2, box.top + box.height / 2) as Element | null;
          if (hit !== button && !button.contains(hit as Node)) {
            say(`the ${name} button is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
        const pb = prev.getBoundingClientRect();
        const nb = next.getBoundingClientRect();
        if (pb.right > nb.left + EPS) {
          say('the prev and next buttons overlap — they anchor opposite edges');
        }
      }
    } else {
      if (controls) say('show-controls is off but part="controls" rendered');
      if (prev || next) say('show-controls is off but a navigation button rendered');
    }

    // ── the dots: a centred row under the viewport ──────────────────────────
    const dotsHost = partNamed('indicators')[0] ?? null;
    const dots = partNamed('indicator');
    if (c.showIndicators) {
      if (!dotsHost) { say('show-indicators is on but no part="indicators" rendered'); }
      if (dots.length === 0) { say('show-indicators is on but no dots rendered'); }
      else {
        for (const [index, dot] of dots.entries()) {
          const box = dot.getBoundingClientRect();
          if (Math.abs(box.width - dotPx) > EPS || Math.abs(box.height - dotPx) > EPS) {
            say(`dot ${index} renders at ${round(box.width)}x${round(box.height)}px,`
              + ` expected the ${round(dotPx)}px circle`);
          }
          if (index > 0) {
            const previous = dots[index - 1].getBoundingClientRect();
            if (Math.abs(box.left - previous.right - dotGapPx) > EPS) {
              say(`dot ${index} sits ${round(box.left - previous.right)}px after dot ${index - 1},`
                + ` expected ${round(dotGapPx)}px`);
            }
          }
        }
        const first = dots[0].getBoundingClientRect();
        const lastDot = dots[dots.length - 1].getBoundingClientRect();
        if (Math.abs(first.top - (v.bottom + dotsMarginPx)) > EPS) {
          say(`the dot row starts ${round(first.top - v.bottom)}px under the viewport,`
            + ` expected ${round(dotsMarginPx)}px`);
        }
        const rowCentre = (first.left + lastDot.right) / 2;
        if (Math.abs(rowCentre - (v.left + v.width / 2)) > 4) {
          say('the dot row is not centred on the viewport');
        }
        // The MARKED dot paints the theme's primary; the others must not —
        // a marker that paints like its siblings marks nothing.
        const primary = token('--snice-color-primary');
        const marked = dots.find(dot => dot.classList.contains('carousel__indicator--active'));
        if (!marked) {
          say('no dot carries the active mark');
        } else {
          if (getComputedStyle(marked).backgroundColor !== primary) {
            say(`the active dot fills "${getComputedStyle(marked).backgroundColor}",`
              + ` expected the theme primary "${primary}"`);
          }
          for (const [index, dot] of dots.entries()) {
            if (dot === marked) continue;
            if (getComputedStyle(dot).backgroundColor === primary) {
              say(`inactive dot ${index} paints the primary too`);
            }
          }
          const hit = (sr as any).elementFromPoint(
            (marked as HTMLElement).getBoundingClientRect().left + dotPx / 2,
            (marked as HTMLElement).getBoundingClientRect().top + dotPx / 2,
          ) as Element | null;
          if (hit !== marked && !(marked as HTMLElement).contains(hit as Node)) {
            say(`the active dot is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
          }
        }
      }
      // The dot row is real layout below the viewport, not an overlay.
      const hostBox = host.getBoundingClientRect();
      if (hostBox.height <= v.height + 8) {
        say('the host ends with the viewport — the dot row adds no height');
      }
    } else {
      if (dotsHost) say('show-indicators is off but part="indicators" rendered');
      if (dots.length) say(`show-indicators is off but ${dots.length} dots rendered`);
      // With no dots, the host's box IS the viewport plus the (absolutely
      // positioned, height-less) controls.
      const hostBox = host.getBoundingClientRect();
      if (Math.abs(hostBox.height - v.height) > EPS) {
        say(`without dots the host is ${round(hostBox.height)}px tall, expected the`
          + ` viewport's ${round(v.height)}px`);
      }
    }

    // ── loop=false: a boundary button is VISIBLY out ────────────────────────
    if (!c.loop && prev && next) {
      const atStart = c.position === 0;
      const boundary = atStart ? prev : next;
      const partner = atStart ? next : prev;
      const bCs = getComputedStyle(boundary);
      const pCs = getComputedStyle(partner);
      if (Math.abs(Number(bCs.opacity) - 0.3) > 0.05) {
        say(`the boundary button paints at opacity ${bCs.opacity}, expected the disabled 0.3`);
      }
      if (bCs.cursor !== 'not-allowed') {
        say(`the boundary button's cursor is "${bCs.cursor}", expected "not-allowed"`);
      }
      if (Number(pCs.opacity) < 0.99) {
        say(`the partner button paints at opacity ${pCs.opacity} — a live control`);
      }
    }

    return problems;
  }, {
    c, buttonPx: BUTTON_PX, dotPx: DOT_PX, dotGapPx: DOT_GAP_PX, dotsMarginPx: DOTS_MARGIN_PX,
  });
}

/** Mount one combo at its intended position, through the documented API. */
async function mountAtPosition(c: Combo): Promise<void> {
  const mounted = await page.evaluate(x => (window as any).matrix.mount(x), {
    slides: c.slides, slidesPerView: c.slidesPerView, spaceBetween: c.spaceBetween,
    showControls: c.showControls, showIndicators: c.showIndicators, loop: c.loop,
  } as any);
  expect(mounted.activeIndex, `initial position for ${c.id}`).toBe(0);
  if (c.position > 0) {
    const moved = await page.evaluate(
      ({ i }) => (window as any).matrix.goToSlide(i), { i: c.position });
    expect(moved, `goToSlide(${c.position}) for ${c.id}`).toBe(c.position);
  }
}

test.describe('carousel visual matrix: layer 1 — the window', () => {
  for (const c of windowCombos()) {
    // VISUAL-MATRIX-carousel-1 combos are unwrapped (fixed); the finding id
    // stays in the title so the formerly-pinned cells stay identifiable.
    test(c.finding ? `${c.finding} (fixed): ${c.id}` : c.id, async () => {
      await mountAtPosition(c);
      expect(await visualProblems(c), `combo ${c.id}`).toEqual([]);
    });
  }

  // VISUAL-MATRIX-carousel-2 (fixed) — an initial `active-index` ATTRIBUTE
  // used to never reach the container's transform: the doc (docs/ai/components/
  // carousel.md: `activeIndex // attribute: active-index`) promises
  // "active-index selects the visible slide", but a carousel MOUNTED with
  // active-index set to a non-zero position only set the property while the
  // window painted slide 0. Mounted here through the attribute channel alone
  // — no goToSlide — and judged by the same window oracle.
  test('VISUAL-MATRIX-carousel-2 (fixed): window/attribute/active-index=2', async () => {
    const c = combo({ id: 'window/attribute/active-index=2', position: 2 });
    const mounted = await page.evaluate(x => (window as any).matrix.mount(x), {
      slides: c.slides, slidesPerView: c.slidesPerView, spaceBetween: c.spaceBetween,
      showControls: c.showControls, showIndicators: c.showIndicators, loop: c.loop,
      activeIndex: c.position,
    } as any);
    expect(mounted.activeIndex, `attribute mount for ${c.id}`).toBe(c.position);
    expect(await visualProblems(c), `combo ${c.id}`).toEqual([]);
  });
});

test.describe('carousel visual matrix: layer 1 — gated chrome', () => {
  for (const c of chromeCombos()) {
    test(c.id, async () => {
      await mountAtPosition(c);
      expect(await visualProblems(c), `combo ${c.id}`).toEqual([]);
    });
  }
});

test.describe('carousel visual matrix: layer 1 — boundaries', () => {
  for (const c of boundaryCombos()) {
    test(c.id, async () => {
      await mountAtPosition(c);
      expect(await visualProblems(c), `combo ${c.id}`).toEqual([]);
    });
  }
});

// ── Real pointers and keys ──────────────────────────────────────────────────

test.describe('carousel visual matrix: real pointers and keys', () => {
  test('a real click on the next button advances the window, prev returns', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ slides: 4 }));
    const next = await page.evaluate(() => (window as any).matrix.nextCenter());
    await page.mouse.click(next.x, next.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.visibleSlides()),
      'a real click on next did not advance the window').toEqual([1]);

    const prev = await page.evaluate(() => (window as any).matrix.prevCenter());
    await page.mouse.click(prev.x, prev.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.visibleSlides()),
      'a real click on prev did not return the window').toEqual([0]);
  });

  test('a real click on an indicator dot routes the window there', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ slides: 4 }));
    const dot = await page.evaluate(() => (window as any).matrix.indicatorCenter(2));
    await page.mouse.click(dot.x, dot.y);
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.visibleSlides()),
      'a real click on dot 2 did not route the window to slide 2').toEqual([2]);
  });

  test('real arrow keys navigate while a control holds focus', async () => {
    // "Keyboard navigation with arrow keys": the host listens for keydown, and
    // a focused control's keydown bubbles to it through the shadow root.
    await page.evaluate(() => (window as any).matrix.mount({ slides: 4 }));
    const next = await page.evaluate(() => (window as any).matrix.nextCenter());
    await page.mouse.click(next.x, next.y); // focus lands on the button
    await page.evaluate(() => (window as any).matrix.goToSlide(0));
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.visibleSlides()),
      'ArrowRight did not advance the window').toEqual([1]);
    await page.keyboard.press('ArrowLeft');
    await page.evaluate(() => (window as any).matrix.settle());
    expect(await page.evaluate(() => (window as any).matrix.visibleSlides()),
      'ArrowLeft did not retreat the window').toEqual([0]);
  });

  test('autoplay really moves the window, in the documented direction', async () => {
    // One carousel per documented direction, mounted at a known slide with
    // autoplay OFF, then started. Forward from slide 1 must land on 2 or 3;
    // backward from slide 1 must land on 0 or wrap to 4 — disjoint outcomes,
    // sampled visually (which slide is showing), never from the index. The
    // window is read only after the clock is stopped and the last transition
    // has settled: sampled mid-flight a loop wrap sweeps past the middle
    // slides and the reading is not a position at all.
    const sample = async (direction: 'forward' | 'backward') => {
      // Slide 1 is reached through the documented navigation method — the
      // same channel mountAtPosition above and the DOM matrix use — to keep
      // this claim about autoplay's direction independent of the
      // initial-attribute mount (which VISUAL-MATRIX-carousel-2 covers).
      // The contract under test is autoplay's direction, so the starting
      // window is established the documented way.
      await page.evaluate(async () => {
        const matrix = (window as any).matrix;
        await matrix.mount({ slides: 5 });
        await matrix.goToSlide(1);
      });
      const first = await page.evaluate(() => (window as any).matrix.visibleSlides());
      expect(first, 'the pre-autoplay window is not slide 1').toEqual([1]);
      await page.evaluate(({ direction }) =>
        (window as any).matrix.startAutoplay(350, direction), { direction });
      // 500ms guarantees exactly the first 350ms tick; pausing then stops
      // the clock so settle cannot let further ticks fire mid-read.
      await page.waitForTimeout(500);
      await page.evaluate(() => (window as any).matrix.pause());
      await page.evaluate(() => (window as any).matrix.settle());
      const second = await page.evaluate(() => (window as any).matrix.visibleSlides());
      return second[0];
    };
    const forward = await sample('forward');
    expect([2, 3], `forward autoplay landed on ${forward}`).toContain(forward);
    const backward = await sample('backward');
    expect([0, 4], `backward autoplay landed on ${backward}`).toContain(backward);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('carousel visual matrix: marquee pixels', () => {
  /** The fixture's own slide palette, in slide order. */
  const SLIDE_COLORS: RGB[] = [
    [99, 102, 241], [236, 72, 153], [20, 184, 166],
    [245, 158, 11], [139, 92, 246], [239, 68, 68],
  ];

  test('the viewport really clips: only the active slide reaches the pixels', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ slides: 5 }));
    // The capture is the PAGE, not the element: the next slide's box lives
    // beyond the carousel's own box (and the host itself carries paint
    // containment), so "the viewport clips" is only observable as pixels on
    // the page surface just past the viewport's right edge — an element
    // screenshot could never see the neighbour slide at all.
    const [showing, clipped] = await capture(
      page, 'body', 'carousel-clipping',
      `() => {
        const v = document.getElementById('subject')
          .shadowRoot.querySelector('[part~="viewport"]').getBoundingClientRect();
        return [
          { x: v.left + 6, y: v.top + v.height / 2 },
          { x: v.right + 6, y: v.top + v.height / 2 },
        ];
      }`,
    );
    // Left of the viewport: the ACTIVE slide's indigo. Just past the right
    // edge: the page surface, because slide 2 is outside the window and the
    // viewport's overflow must clip it — an unclipped carousel would paint
    // slide 2's pink there.
    expect([0, 1, 2].every(i => Math.abs((showing as RGB)[i] - SLIDE_COLORS[0][i]) <= 3),
      `the active slide's area painted rgb(${showing.join(',')}), expected #6366f1`).toBe(true);
    expect(sameColor(clipped as RGB, showing as RGB),
      `the clipped edge painted rgb(${clipped.join(',')}), identical to the active slide`).toBe(false);
    expect(sameColor(clipped as RGB, SLIDE_COLORS[1]),
      `the clipped edge painted rgb(${clipped.join(',')}), the NEXT slide peeking in`).toBe(false);
  });

  test('the marked dot paints the theme primary, its siblings do not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ slides: 4, activeIndex: 2 }));
    const [active, inactive] = await capture(
      page, '#subject', 'carousel-active-dot',
      `(host) => {
        const dots = [...host.shadowRoot.querySelectorAll('[part~="indicator"]')];
        const marked = dots.find(d => d.classList.contains('carousel__indicator--active'));
        const a = marked.getBoundingClientRect();
        const b = dots[0] === marked ? dots[3].getBoundingClientRect() : dots[0].getBoundingClientRect();
        return [
          { x: a.left + a.width / 2, y: a.top + a.height / 2 },
          { x: b.left + b.width / 2, y: b.top + b.height / 2 },
        ];
      }`,
    );
    expect(sameColor(active as RGB, inactive as RGB),
      `the marked dot painted rgb(${active.join(',')}), identical to its siblings`).toBe(false);
    expect((active as RGB)[2] > (active as RGB)[0] + 30,
      `the marked dot painted rgb(${active.join(',')}), not the blue primary`).toBe(true);
  });

  test('the navigation buttons paint translucent black over the slide', async () => {
    // The pointer tests earlier in this file leave the real mouse wherever
    // they last clicked — on this very button — and a hovered button paints
    // its hover background, not the resting one. Park the pointer off the
    // stage so the capture reads the resting control.
    await page.mouse.move(1, 1);
    await page.evaluate(() => (window as any).matrix.mount({ slides: 4 }));
    const [onButton] = await capture(
      page, '#subject', 'carousel-button',
      `(host) => {
        const next = host.shadowRoot.querySelector('[part~="button-next"]').getBoundingClientRect();
        // 20% in from the button's left edge: clear of the centred glyph.
        return [{ x: next.left + next.width * 0.2, y: next.top + next.height / 2 }];
      }`,
    );
    // rgba(0 0 0 / 0.5) composited over the fixture's indigo slide halves
    // every channel of it.
    const expected = SLIDE_COLORS[0].map(channel => channel / 2);
    expect([0, 1, 2].every(i => Math.abs((onButton as RGB)[i] - expected[i]) <= 20),
      `the button painted rgb(${onButton.join(',')}), expected ~rgb(`
        + `${expected.map(n => Math.round(n)).join(',')}) over the slide`).toBe(true);
  });
});
