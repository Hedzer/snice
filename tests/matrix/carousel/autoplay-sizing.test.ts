/**
 * snice-carousel matrix — AUTOPLAY and SLIDE SIZING.
 *
 * Two documented surfaces that the structure and navigation crosses do not
 * reach:
 *
 *   · autoplay {off, forward, backward} x loop {on, off} x interval — the
 *     timer-driven advance, plus the WCAG 2.2.2 pause-on-hover/focus behaviour
 *     the component implements around it;
 *   · `slides-per-view` x `space-between` — the two numbers that become CSS
 *     custom properties on the host, which is the only DOM-visible evidence of
 *     slide sizing (the widths themselves are the visual tier's job).
 */
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeCarousel, expectCarouselMatches, withDefaults, captureSlideChanges,
  wait, SETTLE, finding,
  type SniceCarouselElement,
} from './matrix-utils';

describe('snice-carousel matrix: autoplay cross', () => {
  let el: SniceCarouselElement | undefined;

  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
  afterEach(() => {
    if (el) { el.pause(); removeComponent(el); }
    el = undefined;
    vi.useRealTimers();
  });

  // Doc: `autoplay` + `autoplay-interval` + `autoplay-direction`. The cross is
  // direction x loop, because the wrap at the end of a run is where an
  // autoplaying carousel with `loop="false"` either stops or spins in place.
  for (const direction of ['forward', 'backward'] as const) {
    for (const loop of [true, false]) {
      it(`advances in the documented direction: ${direction}/loop=${loop}`, async () => {
        el = await makeCarousel({
          slides: 4, autoplay: true, autoplayInterval: 100,
          autoplayDirection: direction, loop,
        });
        const seen = captureSlideChanges(el);

        await vi.advanceTimersByTimeAsync(350);

        const moves = seen.map(detail => detail.activeIndex);
        expect(moves.length, 'autoplay never advanced').toBeGreaterThan(0);

        if (direction === 'forward') {
          const expected = loop ? [1, 2, 3] : [1, 2, 3];
          expect(moves.slice(0, 3)).toEqual(expected);
        } else {
          // Backward from 0: wraps to the last slide when looping, and stays
          // put when it does not.
          expect(moves[0]).toBe(loop ? 3 : 0);
        }
        el.pause();
      });
    }
  }

  // Doc "Methods": `play()` / `pause()` control autoplay explicitly, so a
  // paused carousel stops moving and a played one starts.
  it('pause stops the advance and play restarts it', async () => {
    el = await makeCarousel({ slides: 4, autoplay: true, autoplayInterval: 100 });
    const seen = captureSlideChanges(el);

    await vi.advanceTimersByTimeAsync(150);
    const afterFirst = seen.length;
    expect(afterFirst).toBeGreaterThan(0);

    el.pause();
    await vi.advanceTimersByTimeAsync(400);
    expect(seen.length, 'pause() did not stop autoplay').toBe(afterFirst);

    el.play();
    await vi.advanceTimersByTimeAsync(150);
    expect(seen.length, 'play() did not restart autoplay').toBeGreaterThan(afterFirst);
    el.pause();
  });

  // Doc: `autoplay: boolean = false`. A carousel that was never told to
  // autoplay must never advance on its own.
  it('does not advance when autoplay is off', async () => {
    el = await makeCarousel({ slides: 4, autoplayInterval: 50 });
    const seen = captureSlideChanges(el);
    await vi.advanceTimersByTimeAsync(500);
    expect(seen).toEqual([]);
    expect(el.activeIndex).toBe(0);
  });

  // WCAG 2.2.2, which the component implements explicitly: auto-advancing
  // content pauses while the pointer or focus is inside it and resumes when
  // both leave.
  it('pauses while hovered and resumes on leave', async () => {
    el = await makeCarousel({ slides: 4, autoplay: true, autoplayInterval: 100 });
    const seen = captureSlideChanges(el);

    el.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(400);
    expect(seen.length, 'autoplay kept running while hovered').toBe(0);

    el.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.advanceTimersByTimeAsync(150);
    expect(seen.length, 'autoplay did not resume after the pointer left').toBeGreaterThan(0);
    el.pause();
  });

  it('pauses while focus is inside and resumes when it leaves', async () => {
    el = await makeCarousel({ slides: 4, autoplay: true, autoplayInterval: 100 });
    const seen = captureSlideChanges(el);

    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);
    expect(seen.length, 'autoplay kept running while focused').toBe(0);

    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(150);
    expect(seen.length, 'autoplay did not resume after focus left').toBeGreaterThan(0);
    el.pause();
  });
});

describe('snice-carousel matrix: slide sizing cross', () => {
  let el: SniceCarouselElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc: `slides-per-view` and `space-between`. The component turns them into
  // host custom properties that the slotted-slide rule consumes, so the numbers
  // are checkable here even though the resulting widths are not.
  for (const slidesPerView of [1, 2, 3, 4]) {
    for (const spaceBetween of [0, 8, 24]) {
      it(`publishes the documented sizing: perView=${slidesPerView}/space=${spaceBetween}`, async () => {
        el = await makeCarousel({ slides: 6, slidesPerView, spaceBetween });

        const width = el.style.getPropertyValue('--carousel-slide-width');
        const space = el.style.getPropertyValue('--carousel-space-between');
        const adjust = el.style.getPropertyValue('--carousel-gap-adjust');

        // n slides per view means each slide is 1/n of the viewport, minus its
        // share of the gaps between them.
        expect(width).toBe(`${100 / slidesPerView}%`);
        expect(space).toBe(`${spaceBetween}px`);
        expect(adjust).toBe(`${spaceBetween * (slidesPerView - 1) / slidesPerView}px`);
      });
    }
  }

  // Doc: the translate is per POSITION, and a position is `100 / slidesPerView`
  // percent wide — so the same index scrolls a different distance in a
  // multi-slide view.
  for (const slidesPerView of [1, 2, 3]) {
    it(`translates by one position width: perView=${slidesPerView}`, async () => {
      el = await makeCarousel({ slides: 6, slidesPerView });
      el.next();
      await wait(SETTLE);
      expectCarouselMatches(el, withDefaults({
        slides: 6, slidesPerView, activeIndex: 1,
      }));
    });
  }

  // ── FINDING ───────────────────────────────────────────────────────────────
  // Doc Properties: `activeIndex: number = 0; // attribute: active-index`. An
  // attribute is the declarative way to start a carousel on a slide other than
  // the first, and the doc gives no hint that it behaves differently from
  // `goToSlide`.
  //
  // The translate is applied from `@watch('activeIndex')`, which runs while the
  // initial attribute is being reflected — before the first render has produced
  // the `.carousel__container` the watcher writes to. Nothing re-applies it, so
  // the carousel boots showing SLIDE 0 while `activeIndex` reports 2 and the
  // third indicator is lit: the state and the picture disagree from the first
  // frame, and only a later navigation repairs it.
  it.fails(finding(
    'MATRIX-carousel-3',
    'an initial active-index attribute never reaches the slides transform — the '
    + 'carousel boots showing slide 0 while reporting a different active index',
  ), async () => {
    el = await makeCarousel({ slides: 4, activeIndex: 2 });
    expect(el.activeIndex).toBe(2);
    expectCarouselMatches(el, withDefaults({ slides: 4, activeIndex: 2 }));
  });
});
