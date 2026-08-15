/**
 * snice-carousel matrix — the STRUCTURE cross.
 *
 * FULL product of the dimensions that decide what is on screen before anyone
 * touches it:
 *
 *   slide count {0, 1, 3, 5}                                              (4)
 *     x slides-per-view {1, 2, 3}                                         (3)
 *     x show-controls {on, off}                                           (2)
 *     x show-indicators {on, off}                                         (2)
 *   = 48 combos, each judged by `expectCarouselMatches`.
 *
 * Enumerating rather than sampling is worth it because the indicator count is
 * ARITHMETIC over two of these axes (`slideCount - slidesPerView + 1`), and the
 * interesting cells are the ones where that arithmetic goes negative or zero:
 * an empty carousel, a single slide, and every case where the view is wider
 * than the content. Those are precisely the combos nobody builds by hand, and
 * they are where a `Math.max(0, …)` gets dropped.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeCarousel, expectCarouselMatches, withDefaults,
  type SniceCarouselElement,
} from './matrix-utils';

const SLIDE_COUNTS = [0, 1, 3, 5];
const PER_VIEW = [1, 2, 3];
const FLAGS = [true, false];

describe('snice-carousel matrix: structure cross', () => {
  let el: SniceCarouselElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const slides of SLIDE_COUNTS) {
    for (const slidesPerView of PER_VIEW) {
      for (const showControls of FLAGS) {
        for (const showIndicators of FLAGS) {
          const id = `slides=${slides}/perView=${slidesPerView}`
            + `/controls=${showControls}/indicators=${showIndicators}`;

          it(`renders the documented chrome: ${id}`, async () => {
            el = await makeCarousel({
              slides, slidesPerView, showControls, showIndicators,
            });
            expectCarouselMatches(el, withDefaults({
              slides, slidesPerView, showControls, showIndicators,
            }));
          });
        }
      }
    }
  }
});

describe('snice-carousel matrix: boundary chrome', () => {
  let el: SniceCarouselElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc: `loop: boolean = true`. Whether a boundary wraps is the difference
  // between an enabled and a disabled navigation button, so the cross is
  // position x loop x slides-per-view.
  for (const loop of [true, false]) {
    for (const slidesPerView of [1, 2]) {
      for (const activeIndex of [0, 1, 5 - slidesPerView]) {
        const id = `loop=${loop}/perView=${slidesPerView}/index=${activeIndex}`;

        it(`enables the documented navigation: ${id}`, async () => {
          el = await makeCarousel({ slides: 5, slidesPerView, loop });
          el.goToSlide(activeIndex);
          await new Promise(resolve => setTimeout(resolve, 40));
          expectCarouselMatches(el, withDefaults({
            slides: 5, slidesPerView, loop, activeIndex,
          }));
        });
      }
    }
  }
});
