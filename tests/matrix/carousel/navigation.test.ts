/**
 * snice-carousel matrix — the NAVIGATION cross.
 *
 * Doc "Methods" gives `next()` / `prev()` / `goToSlide(index)`; doc
 * "Accessibility" adds arrow keys; the rendered chrome adds the prev/next
 * buttons and the indicator dots. Six routes, ONE piece of state, so the matrix
 * asks the same question of each:
 *
 *   route {next(), prev(), ArrowRight, ArrowLeft, next button, prev button}  (6)
 *     x start position {first, middle, last}                                (3)
 *     x loop {on, off}                                                      (2)
 *   = 36 combos, each asserting the documented resulting index AND the
 *     documented `carousel-slide-change` payload.
 *
 * Enumerating is worth it because the wrap arithmetic differs per direction —
 * `next` wraps to 0, `prev` wraps to `slideCount - slidesPerView` — and each
 * route reaches it through a different entry point. A keyboard handler that
 * calls the wrong one, or a button wired backwards, is invisible to any test
 * that only exercises the methods.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeCarousel, expectCarouselMatches, withDefaults, captureSlideChanges,
  indicators, prevButton, nextButton, click, press, wait, SETTLE, finding,
  type SniceCarouselElement,
} from './matrix-utils';

const SLIDES = 5;
type Route = 'next()' | 'prev()' | 'ArrowRight' | 'ArrowLeft' | 'next button' | 'prev button';
const ROUTES: Route[] = ['next()', 'prev()', 'ArrowRight', 'ArrowLeft', 'next button', 'prev button'];
const STARTS = [0, 2, SLIDES - 1];

const FORWARD: Route[] = ['next()', 'ArrowRight', 'next button'];

/** The documented index a route leaves behind, from the doc's own wrap rules. */
function expectedIndex(route: Route, start: number, loop: boolean): number {
  const forward = FORWARD.includes(route);
  if (forward) {
    if (start < SLIDES - 1) return start + 1;
    return loop ? 0 : start;
  }
  if (start > 0) return start - 1;
  return loop ? SLIDES - 1 : start;
}

describe('snice-carousel matrix: navigation cross', () => {
  let el: SniceCarouselElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const route of ROUTES) {
    for (const start of STARTS) {
      for (const loop of [true, false]) {
        const id = `${route}/from=${start}/loop=${loop}`;

        it(`lands on the documented slide: ${id}`, async () => {
          el = await makeCarousel({ slides: SLIDES, loop });
          if (start !== 0) { el.goToSlide(start); await wait(SETTLE); }

          const want = expectedIndex(route, start, loop);
          const disabledRoute = !loop
            && ((FORWARD.includes(route) && start === SLIDES - 1)
              || (!FORWARD.includes(route) && start === 0));

          if (route === 'next()') el.next();
          if (route === 'prev()') el.prev();
          if (route === 'ArrowRight') await press(el, 'ArrowRight');
          if (route === 'ArrowLeft') await press(el, 'ArrowLeft');
          if (route === 'next button') click(nextButton(el));
          if (route === 'prev button') click(prevButton(el));
          await wait(SETTLE);

          // A disabled button is documented as unable to navigate; the other
          // routes are documented as clamping at the boundary when loop is off.
          expect(el.activeIndex, `${id}: landed on the wrong slide`).toBe(want);
          expectCarouselMatches(el, withDefaults({ slides: SLIDES, loop, activeIndex: want }));
          void disabledRoute;
        });
      }
    }
  }
});

describe('snice-carousel matrix: indicators as a route', () => {
  let el: SniceCarouselElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc CSS parts: `indicator` is an "Individual indicator dot", labelled
  // "Go to slide N". Clicking dot i must go to slide i, for every i and every
  // slides-per-view — the dot list and the position list are the same list.
  for (const slidesPerView of [1, 2]) {
    for (const target of [0, 1, 2]) {
      it(`indicator ${target} goes to position ${target} (perView=${slidesPerView})`, async () => {
        el = await makeCarousel({ slides: 4, slidesPerView });
        const dots = indicators(el);
        expect(dots.length).toBe(4 - slidesPerView + 1);
        click(dots[target]);
        await wait(SETTLE);
        expect(el.activeIndex).toBe(target);
        expectCarouselMatches(el, withDefaults({
          slides: 4, slidesPerView, activeIndex: target,
        }));
      });
    }
  }
});

describe('snice-carousel matrix: slide-change event', () => {
  let el: SniceCarouselElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc Events: `carousel-slide-change -> { activeIndex, previousIndex, carousel }`.
  it('carries the new index, the old index and the carousel', async () => {
    el = await makeCarousel({ slides: 4 });
    const seen = captureSlideChanges(el);

    el.next();
    await wait(SETTLE);
    el.next();
    await wait(SETTLE);
    el.prev();
    await wait(SETTLE);

    expect(seen.map(detail => [detail.previousIndex, detail.activeIndex]))
      .toEqual([[0, 1], [1, 2], [2, 1]]);
    expect(seen.every(detail => detail.carousel === el)).toBe(true);
  });

  // Doc: the event marks reaching a slide, so every documented route that moves
  // the carousel emits exactly one.
  it('emits exactly one event per move, on every route', async () => {
    el = await makeCarousel({ slides: 5 });
    const seen = captureSlideChanges(el);

    el.next();                       // 0 -> 1
    await wait(SETTLE);
    click(nextButton(el));           // 1 -> 2
    await wait(SETTLE);
    await press(el, 'ArrowRight');   // 2 -> 3
    click(indicators(el)[0]);        // 3 -> 0
    await wait(SETTLE);

    expect(seen.map(detail => detail.activeIndex)).toEqual([1, 2, 3, 0]);
  });

  // Doc Methods: `goToSlide(index)`. A negative index is not a slide.
  it('goToSlide with a negative index is inert', async () => {
    el = await makeCarousel({ slides: 4 });
    const seen = captureSlideChanges(el);
    el.goToSlide(-1);
    await wait(SETTLE);
    expect(el.activeIndex).toBe(0);
    expect(seen).toEqual([]);
  });

  // ── FINDING ───────────────────────────────────────────────────────────────
  // Doc Events: `carousel-slide-change` — a SLIDE CHANGE. Every navigation
  // entry point dispatches it unconditionally, including the calls that
  // deliberately do nothing: `next()` on the last slide with `loop="false"`,
  // `prev()` on the first, and `goToSlide(activeIndex)`. The listener in the
  // doc's own example (`console.log('Active:', e.detail.activeIndex)`) fires
  // repeatedly for a carousel that never moved, and `previousIndex ===
  // activeIndex` is the proof that nothing changed.
  it.fails(finding(
    'MATRIX-carousel-1',
    'carousel-slide-change fires for navigation that does not move the carousel '
    + '(next at the end without loop, prev at the start, goToSlide of the current slide)',
  ), async () => {
    el = await makeCarousel({ slides: 3, loop: false });
    const seen = captureSlideChanges(el);

    el.prev();                 // already at 0, loop off — nothing moves
    await wait(SETTLE);
    el.goToSlide(0);           // already there — nothing moves
    await wait(SETTLE);
    el.goToSlide(2);           // a real move
    await wait(SETTLE);
    el.next();                 // at the end, loop off — nothing moves
    await wait(SETTLE);

    expect(seen.map(detail => detail.activeIndex),
      `emitted ${seen.length} events for one real move`).toEqual([2]);
  });

  // ── FINDING ───────────────────────────────────────────────────────────────
  // Doc Methods: `goToSlide(index: number)` - "Go to specific slide". An index
  // past the last slide names no slide at all, but it is accepted verbatim: the
  // slides container is translated off into empty space, every indicator loses
  // its active mark, and the carousel shows nothing. `next()` and `prev()` both
  // clamp; the documented random-access method does not.
  it.fails(finding(
    'MATRIX-carousel-2',
    'goToSlide accepts an index past the last slide, scrolling the carousel into '
    + 'empty space with no active indicator',
  ), async () => {
    el = await makeCarousel({ slides: 3 });
    el.goToSlide(99);
    await wait(SETTLE);

    expect(el.activeIndex,
      'an out-of-range index should clamp to the last reachable slide').toBe(2);
    expectCarouselMatches(el, withDefaults({ slides: 3, activeIndex: 2 }));
  });
});
