/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-book feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is transcribed from `docs/ai/components/book.md` and
 * `packages/components/src/book/snice-book.types.ts`.
 *
 * The documented surface:
 *
 *   Components   <snice-book> and <snice-book-page>
 *   Properties   currentPage: number = 0     (current-page)
 *                coverImage: string = ''     (cover-image) "URL for cover page image"
 *                title: string = ''          "Book title shown on cover"
 *                author: string = ''         "Author name shown on cover"
 *                readonly totalPages: number "Getter, count of slotted page elements"
 *   Methods      goToPage(page)  "Navigate to specific page"
 *                nextPage()      "Advance by 1 page"
 *                prevPage()      "Go back by 1 page"
 *                firstPage()     "Jump to page 0"
 *                lastPage()      "Jump to last page"
 *   Events       page-turn       { page, direction }
 *                page-flip-start { fromPage, toPage, direction }
 *                page-flip-end   { page, direction }
 *   Slots        (default) — <snice-book-page> elements; each child is one page
 *   Parts        base ("Outer cover container"), book ("Inner book element")
 *   Keyboard     ArrowRight → next page, ArrowLeft → previous page
 *
 * ── The page-number model ──────────────────────────────────────────────────
 *
 * The doc fixes the two ends of the range and the arithmetic between them:
 * `firstPage()` is "Jump to page 0" and `lastPage()` is "Jump to last page",
 * with `nextPage()`/`prevPage()` moving one step. `totalPages` is the count of
 * slotted pages, so with n pages the reachable positions are 0 (closed, before
 * the first leaf) through n (past the last leaf) — n + 1 positions, which is
 * what a physical book with n leaves has. Every clamp below follows from that
 * and from nothing else.
 *
 * Findings raised against this component:
 *
 *   MATRIX-book-1  cover.test.ts — `title`, documented as "Book title shown on
 *                  cover", is never shown on the cover.
 *   MATRIX-book-2  cover.test.ts — `author`, documented as "Author name shown
 *                  on cover", is never rendered at all.
 */
import { expect } from 'vitest';
import { wait, removeComponent, Problems, expectClean } from '../matrix-kit';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/book/snice-book';
import type {
  PageTurnDetail, PageFlipStartDetail, PageTurnDirection,
} from '../../../packages/components/src/book/snice-book.types';

export { wait, removeComponent, expectClean, Problems, expect };
export type { PageTurnDetail, PageFlipStartDetail, PageTurnDirection };

/** Render settle. The book rebuilds its page DOM imperatively on slot changes. */
export const SETTLE = 40;

/**
 * The component reads `--book-flip-duration` (default 0.6s) before emitting
 * `page-flip-end`, so a test that wants that event has to outwait it.
 */
export const FLIP_MS = 700;

// ── Documented dimensions ───────────────────────────────────────────────────

/** Page counts, including both degenerate ends of "count of slotted pages". */
export const PAGE_COUNTS = [0, 1, 2, 3, 5, 8] as const;

export const COVER_IMAGES: Record<string, string> = {
  none: '',
  url: '/covers/atlas.jpg',
  absolute: 'https://example.org/cover.png',
  'data-uri': 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
};

export const TITLES: Record<string, string> = {
  none: '',
  simple: 'My Book',
  unicode: 'Le Père Goriot — Édition',
  quoted: 'A "Quoted" & <Marked> Title',
};

export const AUTHORS: Record<string, string> = {
  none: '',
  simple: 'Jane Doe',
  initials: 'J. R. R. Example',
};

// ── Combos ──────────────────────────────────────────────────────────────────

export interface BookCombo {
  pages: number;
  coverImage: keyof typeof COVER_IMAGES;
  title: keyof typeof TITLES;
  author: keyof typeof AUTHORS;
  currentPage: number;
}

export function combo(overrides: Partial<BookCombo> = {}): BookCombo {
  return {
    pages: 3,
    coverImage: 'none',
    title: 'none',
    author: 'none',
    currentPage: 0,
    ...overrides,
  };
}

export function comboId(c: BookCombo): string {
  return `pages=${c.pages}/cover=${c.coverImage}/title=${c.title}`
    + `/author=${c.author}/current=${c.currentPage}`;
}

/** The light-DOM markup the doc's Basic Usage shows: one page per child. */
export function pagesHtml(count: number): string {
  return Array.from({ length: count }, (_, i) =>
    `<snice-book-page><div>Page ${i + 1} content</div></snice-book-page>`,
  ).join('');
}

/**
 * Mount one combo.
 *
 * The light-DOM children are placed BEFORE the element connects. The book reads
 * its slotted pages at `@ready` and otherwise depends on `slotchange`, which
 * happy-dom does not emit for a post-connect `innerHTML` write; the real
 * browser handles both orders, and the visual tier is where the dynamic one is
 * exercised. This mirrors `tests/matrix/matrix-common.ts`'s reasoning.
 */
export async function makeBook(c: BookCombo, count = c.pages): Promise<HTMLElement> {
  const el = document.createElement('snice-book');
  if (c.currentPage !== 0) el.setAttribute('current-page', String(c.currentPage));
  if (COVER_IMAGES[c.coverImage]) el.setAttribute('cover-image', COVER_IMAGES[c.coverImage]);
  if (TITLES[c.title]) el.setAttribute('title', TITLES[c.title]);
  if (AUTHORS[c.author]) el.setAttribute('author', AUTHORS[c.author]);
  el.innerHTML = pagesHtml(count);

  document.body.appendChild(el);
  await (el as any).ready;
  await wait(SETTLE);
  return el;
}

// ── Reading the render ──────────────────────────────────────────────────────

export const DOCUMENTED_PARTS = ['base', 'book'] as const;

export interface BookFacts {
  presentParts: string[];
  /** Everything the reader can see anywhere in the shadow tree. */
  visibleText: string;
  /** `src` of every image the cover renders. */
  coverImageSrcs: string[];
  /** `alt` of every image the cover renders. */
  coverImageAlts: string[];
  /** Flippable leaf elements built for the slotted pages. */
  leaves: number;
  /** Which page radio, if any, is currently checked. */
  checkedPage: number | null;
  /** The page contents projected into the built DOM, in order. */
  projected: string[];
}

function shadowOf(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-book has no shadow root');
  return root;
}

export function readFacts(el: HTMLElement): BookFacts {
  const root = shadowOf(el);
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  const checked = radios.find(radio => radio.checked);

  return {
    presentParts: DOCUMENTED_PARTS.filter(name => exactPart(el, name) !== null),
    visibleText: (root.textContent ?? '').replace(/\s+/g, ' ').trim(),
    coverImageSrcs: [...root.querySelectorAll('img')].map(img => img.getAttribute('src') ?? ''),
    coverImageAlts: [...root.querySelectorAll('img')].map(img => img.getAttribute('alt') ?? ''),
    leaves: root.querySelectorAll('.book__page--2').length,
    checkedPage: checked
      ? (checked.dataset.page !== undefined ? Number(checked.dataset.page) + 1 : 0)
      : null,
    projected: [...root.querySelectorAll('.book__page-front .page__content')]
      .map(node => (node.textContent ?? '').replace(/\s+/g, ' ').trim()),
  };
}

// ── Documented expectations ─────────────────────────────────────────────────

/** `goToPage` is bounded by the documented ends: page 0 and the last page. */
export function clampPage(page: number, totalPages: number): number {
  return Math.max(0, Math.min(page, totalPages));
}

/** The direction a move from `from` to `to` travels, per the documented enum. */
export function directionOf(from: number, to: number): PageTurnDirection {
  return to > from ? 'forward' : 'backward';
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** Parts, page building and the `totalPages` getter. */
export function structureProblems(el: HTMLElement, c: BookCombo, count: number): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  // "CSS Parts: base — Outer cover container / book — Inner book element"
  for (const name of DOCUMENTED_PARTS) {
    problems.check(facts.presentParts.includes(name), `documented part "${name}" is missing`);
  }
  const base = exactPart(el, 'base');
  const book = exactPart(el, 'book');
  if (base && book) problems.check(base.contains(book), '`book` is not inside `base`');

  // "readonly totalPages: number — Getter, count of slotted page elements"
  problems.equal((el as any).totalPages, count, 'totalPages');

  // "(default) — <snice-book-page> elements; each child becomes one page"
  problems.equal(facts.leaves, count, 'one flippable leaf per slotted page');

  // Each page's content really reaches the built book.
  const expectedProjection = Array.from({ length: count }, (_, i) => `Page ${i + 1} content`);
  problems.equal(facts.projected, expectedProjection, 'projected page content');

  // The host is focusable, because ArrowLeft/ArrowRight are documented keys and
  // a control nobody can focus cannot receive them.
  problems.check(el.hasAttribute('tabindex'), 'the book is not focusable (no tabindex)');

  return problems;
}

/** `coverImage` — "URL for cover page image". */
export function coverProblems(el: HTMLElement, c: BookCombo): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  const url = COVER_IMAGES[c.coverImage];

  if (c.pages === 0) {
    // With nothing slotted there is no book to build, and the doc gives no
    // cover-without-pages behaviour, so no claim is made here.
    return problems;
  }

  if (url) {
    problems.check(
      facts.coverImageSrcs.includes(url),
      `cover-image "${url}" is not among the rendered images ${JSON.stringify(facts.coverImageSrcs)}`,
    );
  } else {
    problems.equal(facts.coverImageSrcs, [], 'no cover-image authored, so no cover image');
  }

  return problems;
}

/**
 * MATRIX-book-1 / MATRIX-book-2. `title` is "Book title shown on cover" and
 * `author` is "Author name shown on cover", so with either authored, that text
 * has to be READABLE somewhere in the rendered book.
 */
export function coverTextProblems(el: HTMLElement, c: BookCombo): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  const title = TITLES[c.title];
  const author = AUTHORS[c.author];

  if (title) {
    problems.check(
      facts.visibleText.includes(title),
      `title "${title}" is not shown on the cover (visible text: "${facts.visibleText}")`,
    );
  }
  if (author) {
    problems.check(
      facts.visibleText.includes(author),
      `author "${author}" is not shown on the cover (visible text: "${facts.visibleText}")`,
    );
  }

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface SeenEvent { type: string; detail: any }

export function collectEvents(el: HTMLElement, types: string[] = [
  'page-turn', 'page-flip-start', 'page-flip-end',
]): SeenEvent[] {
  const seen: SeenEvent[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/** A documented keyboard gesture on the book itself. */
export function pressKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

/**
 * Assert one navigation step against the documented event contract.
 *
 * A move that lands where it started is not a page turn, so it must emit
 * nothing at all — the doc gives no "turned to the page you were on" event.
 */
export function navigationProblems(
  seen: SeenEvent[], from: number, to: number,
): Problems {
  const problems = new Problems();
  const starts = seen.filter(event => event.type === 'page-flip-start');
  const turns = seen.filter(event => event.type === 'page-turn');

  if (from === to) {
    problems.equal(starts.length, 0, 'page-flip-start on a move that changed nothing');
    problems.equal(turns.length, 0, 'page-turn on a move that changed nothing');
    return problems;
  }

  const direction = directionOf(from, to);

  // "page-flip-start -> { fromPage, toPage, direction }"
  if (problems.check(starts.length === 1, `page-flip-start fired ${starts.length} times`)) {
    problems.equal(starts[0].detail.fromPage, from, 'page-flip-start fromPage');
    problems.equal(starts[0].detail.toPage, to, 'page-flip-start toPage');
    problems.equal(starts[0].detail.direction, direction, 'page-flip-start direction');
  }

  // "page-turn -> { page, direction }"
  if (problems.check(turns.length === 1, `page-turn fired ${turns.length} times`)) {
    problems.equal(turns[0].detail.page, to, 'page-turn page');
    problems.equal(turns[0].detail.direction, direction, 'page-turn direction');
  }

  // The start announces the move before it is reported as done.
  const startIndex = seen.findIndex(event => event.type === 'page-flip-start');
  const turnIndex = seen.findIndex(event => event.type === 'page-turn');
  if (startIndex >= 0 && turnIndex >= 0) {
    problems.check(startIndex < turnIndex, 'page-turn fired before page-flip-start');
  }

  return problems;
}
