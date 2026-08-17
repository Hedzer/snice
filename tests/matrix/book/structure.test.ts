/**
 * Matrix slice BOOK / STRUCTURE — the slotted page contract and the two parts.
 *
 * Dimensions:
 *   · page count (6) x cover image (4)   = 24 combos
 *   · re-slotting transitions (5)        =  5 combos
 *   Total 29.
 *
 * Documented contract (docs/ai/components/book.md):
 *   · both CSS parts — `base` ("Outer cover container") and `book` ("Inner book
 *     element") — exist for every combo, pages or no pages, and `book` nests
 *     inside `base`;
 *   · "(default) — <snice-book-page> elements; each child becomes one page", so
 *     one flippable leaf is built per slotted child and each child's content
 *     really reaches the built book;
 *   · "readonly totalPages: number — Getter, count of slotted page elements";
 *   · `coverImage` — "URL for cover page image";
 *   · ArrowLeft/ArrowRight are documented keys, so the host has to be focusable
 *     for anyone to press them.
 *
 * it.fails policy: nothing pinned. This component's findings (MATRIX-book-1,
 * MATRIX-book-2) are in cover.test.ts.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  PAGE_COUNTS, COVER_IMAGES, combo, comboId, makeBook,
  structureProblems, coverProblems, readFacts,
  expectClean, removeComponent,
} from './book-support';

const COVER_NAMES = Object.keys(COVER_IMAGES) as Array<keyof typeof COVER_IMAGES>;

describe('book matrix: structure', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('slotted pages', () => {
    for (const pages of PAGE_COUNTS) {
      for (const coverImage of COVER_NAMES) {
        const c = combo({ pages, coverImage });

        it(`${comboId(c)}: builds one leaf per slotted page`, async () => {
          el = await makeBook(c);
          expectClean(structureProblems(el, c, pages), comboId(c));
          expectClean(coverProblems(el, c), comboId(c));
        });
      }
    }
  });

  // NOT tested here: re-slotting after mount. The book re-collects its pages
  // from `@on('slotchange')`, and happy-dom does not emit `slotchange` for a
  // post-connect `innerHTML` write — so a DOM-tier assertion about it would be
  // measuring the environment rather than the component. It is asserted in the
  // real browser instead, in tests/live/matrix/book/book-visual.spec.ts.

  describe('authored current-page', () => {
    for (const pages of PAGE_COUNTS) {
      // Every reachable position for this page count: 0 (closed) through n.
      for (const currentPage of Array.from({ length: pages + 1 }, (_, i) => i)) {
        const c = combo({ pages, currentPage });

        it(`${comboId(c)}: opens at the authored page`, async () => {
          el = await makeBook(c);
          expectClean(structureProblems(el, c, pages), comboId(c));

          // `current-page` is a documented attribute, so the authored value is
          // the state the book opens in…
          expect(el.currentPage).toBe(currentPage);
          // …and the built book agrees with it.
          if (pages > 0) {
            expect(readFacts(el).checkedPage).toBe(currentPage);
          }
        });
      }
    }
  });
});
