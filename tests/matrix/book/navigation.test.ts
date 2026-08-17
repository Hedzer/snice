/**
 * Matrix slice BOOK / NAVIGATION — the five documented methods, their clamps,
 * and the keyboard.
 *
 * Dimensions:
 *   · page count (5) x goToPage target (9)       = 45 combos
 *   · page count (5) x nextPage/prevPage walk    = 10 combos
 *   · firstPage / lastPage (5 x 2)               = 10 combos
 *   · keyboard (5 x 2)                           = 10 combos
 *   Total 75.
 *
 * Documented contract (docs/ai/components/book.md):
 *   · `goToPage(page)` "Navigate to specific page" — bounded by the two ends the
 *     doc names: `firstPage()` "Jump to page 0" and `lastPage()` "Jump to last
 *     page", so with n slotted pages the reachable range is 0..n;
 *   · `nextPage()` "Advance by 1 page" / `prevPage()` "Go back by 1 page", which
 *     stop rather than wrap at either end;
 *   · ArrowRight is next, ArrowLeft is previous;
 *   · `page-turn`, `page-flip-start` fire for a real move and, since the doc
 *     names no "stayed put" event, for nothing else.
 *
 * it.fails policy: nothing pinned; all 75 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, makeBook, clampPage, collectEvents, navigationProblems,
  pressKey, readFacts, expectClean, removeComponent, wait, SETTLE,
} from './book-support';

const COUNTS = [0, 1, 2, 3, 5];
/** Targets inside, on, and well outside every range above. */
const TARGETS = [-5, -1, 0, 1, 2, 3, 5, 8, 99];

describe('book matrix: navigation', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('goToPage clamps to the documented range', () => {
    for (const pages of COUNTS) {
      for (const target of TARGETS) {
        const c = combo({ pages });
        const id = `${comboId(c)}/goToPage(${target})`;

        it(`${id}: lands at ${clampPage(target, pages)}`, async () => {
          el = await makeBook(c);
          const seen = collectEvents(el);
          const from = el.currentPage;

          el.goToPage(target);
          await wait(SETTLE);

          const expected = clampPage(target, pages);
          expect(el.currentPage).toBe(expected);
          expectClean(navigationProblems(seen, from, expected), id);
        });
      }
    }
  });

  describe('nextPage and prevPage step one page and stop at the ends', () => {
    for (const pages of COUNTS) {
      const c = combo({ pages });

      it(`${comboId(c)}: nextPage walks 0..${pages} and then stops`, async () => {
        el = await makeBook(c);

        for (let step = 0; step < pages; step++) {
          el.nextPage();
          await wait(SETTLE);
          expect(el.currentPage).toBe(step + 1);
        }

        // At the last page, "Advance by 1 page" has nowhere to go.
        const seen = collectEvents(el);
        el.nextPage();
        await wait(SETTLE);
        expect(el.currentPage).toBe(pages);
        expectClean(navigationProblems(seen, pages, pages), `${comboId(c)}/nextPage at end`);
      });

      it(`${comboId(c)}: prevPage walks ${pages}..0 and then stops`, async () => {
        el = await makeBook(combo({ pages, currentPage: pages }));

        for (let step = pages; step > 0; step--) {
          el.prevPage();
          await wait(SETTLE);
          expect(el.currentPage).toBe(step - 1);
        }

        const seen = collectEvents(el);
        el.prevPage();
        await wait(SETTLE);
        expect(el.currentPage).toBe(0);
        expectClean(navigationProblems(seen, 0, 0), `${comboId(c)}/prevPage at start`);
      });
    }
  });

  describe('firstPage and lastPage', () => {
    for (const pages of COUNTS) {
      it(`pages=${pages}: firstPage jumps to page 0`, async () => {
        const c = combo({ pages, currentPage: pages });
        el = await makeBook(c);
        const seen = collectEvents(el);
        const from = el.currentPage;

        el.firstPage();
        await wait(SETTLE);

        expect(el.currentPage).toBe(0);
        expectClean(navigationProblems(seen, from, 0), `pages=${pages}/firstPage`);
      });

      it(`pages=${pages}: lastPage jumps to the last page`, async () => {
        const c = combo({ pages });
        el = await makeBook(c);
        const seen = collectEvents(el);

        el.lastPage();
        await wait(SETTLE);

        // "Jump to last page" — the far end of the documented range.
        expect(el.currentPage).toBe(pages);
        expectClean(navigationProblems(seen, 0, pages), `pages=${pages}/lastPage`);
      });
    }
  });

  describe('keyboard', () => {
    for (const pages of COUNTS) {
      it(`pages=${pages}: ArrowRight advances one page`, async () => {
        const c = combo({ pages });
        el = await makeBook(c);
        const seen = collectEvents(el);

        pressKey(el, 'ArrowRight');
        await wait(SETTLE);

        const expected = Math.min(1, pages);
        expect(el.currentPage).toBe(expected);
        expectClean(navigationProblems(seen, 0, expected), `pages=${pages}/ArrowRight`);
      });

      it(`pages=${pages}: ArrowLeft goes back one page`, async () => {
        const c = combo({ pages, currentPage: pages });
        el = await makeBook(c);
        const seen = collectEvents(el);

        pressKey(el, 'ArrowLeft');
        await wait(SETTLE);

        const expected = Math.max(0, pages - 1);
        expect(el.currentPage).toBe(expected);
        expectClean(navigationProblems(seen, pages, expected), `pages=${pages}/ArrowLeft`);
      });
    }
  });

  describe('the built book follows the page number', () => {
    for (const pages of [1, 3, 5]) {
      it(`pages=${pages}: every position checks its own radio`, async () => {
        const c = combo({ pages });
        el = await makeBook(c);

        for (let page = 0; page <= pages; page++) {
          el.goToPage(page);
          await wait(SETTLE);
          expect(readFacts(el).checkedPage, `at page ${page}`).toBe(page);
        }
      });
    }

    it('an unrelated key changes nothing', async () => {
      const c = combo({ pages: 3 });
      el = await makeBook(c);
      const seen = collectEvents(el);

      for (const key of ['ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape', 'a']) {
        pressKey(el, key);
      }
      await wait(SETTLE);

      expect(el.currentPage).toBe(0);
      expect(seen).toHaveLength(0);
    });
  });
});
