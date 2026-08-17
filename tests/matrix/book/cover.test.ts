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
 * MATRIX-book-1  `title` is never shown on the cover.
 *   combo:    pages=3, title="My Book" (and every other title in the set),
 *             with and without a cover image
 *   expected: the title text is readable somewhere in the rendered book, which
 *             is the plain meaning of "Book title shown on cover".
 *   actual:   the string appears nowhere a reader can see it. `title` is used
 *             for exactly one thing — the `alt` attribute of the cover `<img>`
 *             — so with no `coverImage` it is not in the DOM at all, and with
 *             one it is alternative text for an image that is present, which no
 *             sighted reader sees and no screen reader announces as a title.
 *
 * MATRIX-book-2  `author` is never rendered at all.
 *   combo:    pages=3, author="Jane Doe", with and without a cover image
 *   expected: the author's name is readable somewhere in the rendered book.
 *   actual:   the property is declared and reflected, and no render path reads
 *             it. Unlike `title` it does not even reach an `alt`. Note that the
 *             stylesheet's `.page__content-author` rule styles content authored
 *             INSIDE a `<snice-book-page>`, not this property.
 *
 * Both are pinned with `it.fails` below and kept at full strength.
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

  // ── MATRIX-book-1 ────────────────────────────────────────────────────────
  describe('MATRIX-book-1: title', () => {
    for (const title of TITLE_NAMES.filter(name => name !== 'none')) {
      const c = combo({ title, pages: 3 });

      it.fails(`${comboId(c)}: the title is shown on the cover`, async () => {
        el = await makeBook(c);
        expectClean(coverTextProblems(el, c), comboId(c));
      });
    }

    it('an empty title puts nothing on the cover, correctly', async () => {
      const c = combo({ title: 'none', pages: 3 });
      el = await makeBook(c);
      expectClean(coverTextProblems(el, c), comboId(c));
    });

    it('the title currently only reaches the cover image alt text', async () => {
      // The mechanism, stated positively so this file records what IS true
      // without weakening the claim above.
      const c = combo({ title: 'simple', coverImage: 'url', pages: 3 });
      el = await makeBook(c);
      const facts = readFacts(el);

      expect(facts.coverImageAlts).toContain(TITLES.simple);
      expect(facts.visibleText).not.toContain(TITLES.simple);
    });

    it('with no cover image the title is not in the shadow tree at all', async () => {
      const c = combo({ title: 'simple', coverImage: 'none', pages: 3 });
      el = await makeBook(c);
      expect(el.shadowRoot.innerHTML).not.toContain(TITLES.simple);
    });
  });

  // ── MATRIX-book-2 ────────────────────────────────────────────────────────
  describe('MATRIX-book-2: author', () => {
    for (const author of AUTHOR_NAMES.filter(name => name !== 'none')) {
      const c = combo({ author, pages: 3 });

      it.fails(`${comboId(c)}: the author is shown on the cover`, async () => {
        el = await makeBook(c);
        expectClean(coverTextProblems(el, c), comboId(c));
      });
    }

    it('an empty author puts nothing on the cover, correctly', async () => {
      const c = combo({ author: 'none', pages: 3 });
      el = await makeBook(c);
      expectClean(coverTextProblems(el, c), comboId(c));
    });

    it('the author is nowhere in the shadow tree, with or without a cover image', async () => {
      for (const coverImage of ['none', 'url'] as const) {
        const c = combo({ author: 'simple', coverImage, pages: 3 });
        el = await makeBook(c);
        expect(el.shadowRoot.innerHTML).not.toContain(AUTHORS.simple);
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
      // The empty pair is the only one the current build satisfies.
      const pin = authored ? it.fails : it;

      pin(`${comboId(c)}: both are shown on the cover${
        authored ? ' [MATRIX-book-1, MATRIX-book-2]' : ''}`, async () => {
        el = await makeBook(c);
        expectClean(coverTextProblems(el, c), comboId(c));
      });
    }
  });
});
