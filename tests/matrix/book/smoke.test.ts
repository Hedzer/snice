/**
 * Smoke slice of the snice-book matrix — the everyday-loop tier.
 *
 * `tests/matrix/**` is excluded from the default Vitest include except each
 * directory's `smoke.test.ts` (vitest.config.ts), so this file is the one book
 * matrix file the everyday `vitest run` still collects. The full 188-combo
 * matrix runs only via `npm run test:matrix`.
 *
 * One combo per feature family, chosen so a family that breaks cannot hide:
 *   · structure  — the doc's own three-page book builds one leaf per page;
 *   · navigation — goToPage clamps at both documented ends;
 *   · keyboard   — ArrowRight and ArrowLeft step one page;
 *   · events     — the documented order and details of a single turn;
 *   · cover      — coverImage reaches the cover;
 *   · findings   — the two marquee regressions, pinned here as well as in the
 *                  matrix tier so a FIX surfaces in the everyday loop at once.
 *
 * Every assertion routes through the matrix's own oracle (book-support.ts), so
 * this file cannot drift into asserting something weaker than the suite it
 * stands in for.
 *
 * BUDGET: under 1s. The one test that waits out the flip animation is the
 * event-order test, and it is the only one that needs to. Add combos to the
 * matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  COVER_IMAGES, TITLES, AUTHORS, combo, comboId, makeBook,
  structureProblems, coverProblems, coverTextProblems, navigationProblems,
  collectEvents, pressKey, readFacts,
  expectClean, removeComponent, wait, SETTLE, FLIP_MS,
} from './book-support';

describe('book matrix smoke', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('structure: the doc\'s three-page book builds one leaf per page', async () => {
    const c = combo({ pages: 3 });
    el = await makeBook(c);
    expectClean(structureProblems(el, c, 3), comboId(c));

    const facts = readFacts(el);
    expect(facts.presentParts).toEqual(['base', 'book']);
    expect(el.totalPages).toBe(3);
    expect(facts.leaves).toBe(3);
    expect(facts.projected).toEqual(['Page 1 content', 'Page 2 content', 'Page 3 content']);
  });

  it('navigation: goToPage clamps at both documented ends', async () => {
    const c = combo({ pages: 3 });
    el = await makeBook(c);

    el.goToPage(99);
    await wait(SETTLE);
    expect(el.currentPage).toBe(3);      // "Jump to last page"

    el.goToPage(-99);
    await wait(SETTLE);
    expect(el.currentPage).toBe(0);      // "Jump to page 0"

    el.lastPage();
    await wait(SETTLE);
    expect(el.currentPage).toBe(3);
    expect(readFacts(el).checkedPage).toBe(3);
  });

  it('keyboard: ArrowRight and ArrowLeft step one page', async () => {
    const c = combo({ pages: 3 });
    el = await makeBook(c);

    pressKey(el, 'ArrowRight');
    await wait(SETTLE);
    expect(el.currentPage).toBe(1);

    pressKey(el, 'ArrowLeft');
    await wait(SETTLE);
    expect(el.currentPage).toBe(0);

    // A key the doc does not name moves nothing.
    const seen = collectEvents(el);
    pressKey(el, 'ArrowUp');
    await wait(SETTLE);
    expect(el.currentPage).toBe(0);
    expect(seen).toEqual([]);
  });

  it('events: one turn emits start, turn and end in that order', async () => {
    const c = combo({ pages: 3 });
    el = await makeBook(c);
    const seen = collectEvents(el);

    el.goToPage(2);
    await wait(FLIP_MS);

    expect(seen.map(event => event.type))
      .toEqual(['page-flip-start', 'page-turn', 'page-flip-end']);
    expectClean(navigationProblems(seen, 0, 2), comboId(c));
    expect(seen[0].detail).toEqual({ fromPage: 0, toPage: 2, direction: 'forward' });
    expect(seen[2].detail).toEqual({ page: 2, direction: 'forward' });
  });

  it('cover: coverImage reaches the cover', async () => {
    const c = combo({ pages: 3, coverImage: 'url' });
    el = await makeBook(c);
    expectClean(coverProblems(el, c), comboId(c));
    expect(readFacts(el).coverImageSrcs).toContain(COVER_IMAGES.url);
  });

  // The two marquee regressions, kept at full strength. See
  // matrix/book/cover.test.ts. Both fixed — unwrapped so a REGRESSION
  // surfaces in the everyday loop at once.
  it('MATRIX-book-1 (fixed) the title is shown on the cover', async () => {
    const c = combo({ pages: 3, title: 'simple' });
    el = await makeBook(c);
    expectClean(coverTextProblems(el, c), comboId(c));
    expect(readFacts(el).visibleText).toContain(TITLES.simple);
  });

  it('MATRIX-book-2 (fixed) the author is shown on the cover', async () => {
    const c = combo({ pages: 3, author: 'simple' });
    el = await makeBook(c);
    expectClean(coverTextProblems(el, c), comboId(c));
    expect(readFacts(el).visibleText).toContain(AUTHORS.simple);
  });
});
