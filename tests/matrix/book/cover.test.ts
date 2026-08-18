/**
 * Matrix slice BOOK / COVER — the three documented cover properties.
 *
 * Dimensions:
 *   · cover image (4) x page count (3)  = 12 combos
 *   · title (4)                         =  4 combos  [MATRIX-book-1]
 *   · author (3)                        =  3 combos  [MATRIX-book-2]
 *   · title x author together (4)       =  4 combos
 *   Total 23.
 *
 * Documented contract (docs/ai/components/book.md):
 *   · `coverImage: string = ''` — "URL for cover page image";
 *   · `title: string = ''` — "Book title shown on cover";
 *   · `author: string = ''` — "Author name shown on cover".
 *
 * ── FINDINGS ───────────────────────────────────────────────────────────────
 *
 * MATRIX-book-1  `title` was never shown on the cover. FIXED — the title now
 *   renders on the cover with and without a cover image (it still reaches the
 *   cover image's alt as well).
 * MATRIX-book-2  `author` was never rendered at all. FIXED — the author now
 *   renders on the cover with and without a cover image.
 *
 * Both pins are unwrapped below; their assertions are unchanged.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  COVER_IMAGES, TITLES, AUTHORS, combo, comboId, makeBook,
  coverProblems, coverTextProblems, readFacts,
  expectClean, removeComponent,
} from './book-support';

const COVER_NAMES = Object.keys(COVER_IMAGES) as Array<keyof typeof COVER_IMAGES>;
const TITLE_NAMES = Object.keys(TITLES) as Array<keyof typeof TITLES>;
const AUTHOR_NAMES = Object.keys(AUTHORS) as Array<keyof typeof AUTHORS>;

describe('book matrix: cover', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('coverImage', () => {
    for (const coverImage of COVER_NAMES) {
      for (const pages of [1, 3, 8]) {
        const c = combo({ coverImage, pages });

        it(`${comboId(c)}: renders the authored cover image`, async () => {
          el = await makeBook(c);
          expectClean(coverProblems(el, c), comboId(c));
        });
      }
    }

    it('assigning coverImage after mount swaps the image in', async () => {
      const c = combo({ coverImage: 'none', pages: 3 });
      el = await makeBook(c);
      expect(readFacts(el).coverImageSrcs).toEqual([]);

      el.coverImage = COVER_IMAGES.url;
      await new Promise(resolve => setTimeout(resolve, 40));

      // The doc gives `coverImage` no mount-only qualifier, so a later
      // assignment has to reach the cover the same way an authored one does.
      expect(readFacts(el).coverImageSrcs).toContain(COVER_IMAGES.url);
    });
  });

  // ── MATRIX-book-1 (fixed) ────────────────────────────────────────────────
  describe('MATRIX-book-1: title', () => {
    for (const title of TITLE_NAMES.filter(name => name !== 'none')) {
      const c = combo({ title, pages: 3 });

      it(`${comboId(c)}: the title is shown on the cover (fixed)`, async () => {
        el = await makeBook(c);
        expectClean(coverTextProblems(el, c), comboId(c));
      });
    }

    it('an empty title puts nothing on the cover, correctly', async () => {
      const c = combo({ title: 'none', pages: 3 });
      el = await makeBook(c);
      expectClean(coverTextProblems(el, c), comboId(c));
    });

    it('the title reaches both the visible cover and the cover image alt text', async () => {
      const c = combo({ title: 'simple', coverImage: 'url', pages: 3 });
      el = await makeBook(c);
      const facts = readFacts(el);

      expect(facts.coverImageAlts).toContain(TITLES.simple);
      expect(facts.visibleText).toContain(TITLES.simple);
    });

    it('with no cover image the title is still on the cover', async () => {
      // The original defect: without a cover image the title never entered
      // the shadow tree at all.
      const c = combo({ title: 'simple', coverImage: 'none', pages: 3 });
      el = await makeBook(c);
      expect(el.shadowRoot.innerHTML).toContain(TITLES.simple);
    });
  });

  // ── MATRIX-book-2 (fixed) ────────────────────────────────────────────────
  describe('MATRIX-book-2: author', () => {
    for (const author of AUTHOR_NAMES.filter(name => name !== 'none')) {
      const c = combo({ author, pages: 3 });

      it(`${comboId(c)}: the author is shown on the cover (fixed)`, async () => {
        el = await makeBook(c);
        expectClean(coverTextProblems(el, c), comboId(c));
      });
    }

    it('an empty author puts nothing on the cover, correctly', async () => {
      const c = combo({ author: 'none', pages: 3 });
      el = await makeBook(c);
      expectClean(coverTextProblems(el, c), comboId(c));
    });

    it('the author is on the cover, with or without a cover image', async () => {
      for (const coverImage of ['none', 'url'] as const) {
        const c = combo({ author: 'simple', coverImage, pages: 3 });
        el = await makeBook(c);
        expect(el.shadowRoot.innerHTML).toContain(AUTHORS.simple);
        removeComponent(el);
        el = null;
      }
    });
  });

  describe('title and author together', () => {
    const PAIRS: Array<[keyof typeof TITLES, keyof typeof AUTHORS]> = [
      ['simple', 'simple'],
      ['unicode', 'initials'],
      ['quoted', 'simple'],
      ['none', 'none'],
    ];

    for (const [title, author] of PAIRS) {
      const c = combo({ title, author, coverImage: 'url', pages: 3 });
      const authored = TITLES[title] || AUTHORS[author];

      it(`${comboId(c)}: both are shown on the cover${
        authored ? ' (fixed: MATRIX-book-1, MATRIX-book-2)' : ''}`, async () => {
        el = await makeBook(c);
        expectClean(coverTextProblems(el, c), comboId(c));
      });
    }
  });
});
