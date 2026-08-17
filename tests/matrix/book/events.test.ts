/**
 * Matrix slice BOOK / EVENTS — the three documented events, their details and
 * their order.
 *
 * Dimensions:
 *   · move (10) x entry point (3: method, keyboard, property)  = 30 combos
 *   · page-flip-end (4)                                        =  4 combos
 *   · event plumbing (3)                                       =  3 combos
 *   Total 37.
 *
 * Documented contract (docs/ai/components/book.md):
 *   · `page-turn -> { page, direction }`;
 *   · `page-flip-start -> { fromPage, toPage, direction }` — the only event
 *     carrying where the turn came FROM, so it must precede the turn;
 *   · `page-flip-end -> { page, direction }` — the animation's completion,
 *     which therefore arrives after the other two;
 *   · `direction: 'forward' | 'backward'`, forward being toward higher page
 *     numbers.
 *
 * The doc names no event for a navigation that changes nothing, so every
 * "already there" combo below asserts silence.
 *
 * it.fails policy: nothing pinned; all 37 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, makeBook, collectEvents, navigationProblems, pressKey,
  directionOf, expectClean, removeComponent, wait, SETTLE, FLIP_MS,
} from './book-support';

/** [starting page, target page] over a 5-page book. */
const MOVES: Array<[number, number]> = [
  [0, 1],
  [0, 5],
  [0, 3],
  [5, 4],
  [5, 0],
  [3, 1],
  [2, 3],
  [2, 2],
  [0, 0],
  [5, 5],
];

describe('book matrix: events', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('page-turn and page-flip-start', () => {
    for (const [from, to] of MOVES) {
      for (const entry of ['goToPage', 'keyboard', 'property'] as const) {
        // The keyboard only steps one page at a time, so it can only express
        // the adjacent moves; the others are exercised through the two APIs
        // that CAN express them.
        if (entry === 'keyboard' && Math.abs(to - from) > 1) continue;

        const c = combo({ pages: 5, currentPage: from });
        const id = `${comboId(c)}/${entry}->${to}`;

        it(`${id}: reports the move exactly once`, async () => {
          el = await makeBook(c);
          expect(el.currentPage).toBe(from);
          const seen = collectEvents(el);

          if (entry === 'goToPage') {
            el.goToPage(to);
          } else if (entry === 'keyboard') {
            if (to > from) pressKey(el, 'ArrowRight');
            else if (to < from) pressKey(el, 'ArrowLeft');
            else pressKey(el, 'ArrowUp');   // a key that moves nothing
          } else {
            el.currentPage = to;
          }
          await wait(SETTLE);

          expect(el.currentPage).toBe(to);

          if (entry === 'property') {
            // Assigning `currentPage` directly is a state write, not a
            // navigation: the doc attaches the three events to the METHODS and
            // to the reader turning a page, and gives no event for a caller
            // setting the property. So the page moves and nothing is emitted.
            expect(seen, 'assigning currentPage emitted an event').toEqual([]);
            return;
          }

          expectClean(navigationProblems(seen, from, to), id);
        });
      }
    }
  });

  describe('page-flip-end closes the sequence', () => {
    const CASES: Array<[number, number]> = [[0, 1], [0, 5], [5, 0], [3, 2]];

    for (const [from, to] of CASES) {
      it(`${from}->${to}: end arrives after start and turn, with the same direction`, async () => {
        const c = combo({ pages: 5, currentPage: from });
        el = await makeBook(c);
        const seen = collectEvents(el);

        el.goToPage(to);
        // The component reads `--book-flip-duration` (0.6s by default) before
        // announcing the end, so the wait has to outlast the animation.
        await wait(FLIP_MS);

        const order = seen.map(event => event.type);
        expect(order).toEqual(['page-flip-start', 'page-turn', 'page-flip-end']);

        const end = seen[2].detail;
        expect(end.page).toBe(to);
        expect(end.direction).toBe(directionOf(from, to));
      });
    }
  });

  describe('event plumbing', () => {
    it('every documented event bubbles and is composed', async () => {
      const c = combo({ pages: 3 });
      el = await makeBook(c);
      const outside: Event[] = [];
      for (const type of ['page-turn', 'page-flip-start', 'page-flip-end']) {
        document.addEventListener(type, event => outside.push(event));
      }

      el.goToPage(2);
      await wait(FLIP_MS);

      expect(outside.map(event => event.type).sort())
        .toEqual(['page-flip-end', 'page-flip-start', 'page-turn']);
      for (const event of outside) {
        expect(event.bubbles, `${event.type} does not bubble`).toBe(true);
        expect(event.composed, `${event.type} is not composed`).toBe(true);
      }
    });

    it('a walk across the whole book emits one turn per step', async () => {
      const c = combo({ pages: 5 });
      el = await makeBook(c);
      const seen = collectEvents(el, ['page-turn']);

      for (let step = 0; step < 5; step++) {
        el.nextPage();
        await wait(SETTLE);
      }

      expect(seen.map(event => event.detail.page)).toEqual([1, 2, 3, 4, 5]);
      expect(seen.every(event => event.detail.direction === 'forward')).toBe(true);
    });

    it('a walk back emits one backward turn per step', async () => {
      const c = combo({ pages: 5, currentPage: 5 });
      el = await makeBook(c);
      const seen = collectEvents(el, ['page-turn']);

      for (let step = 0; step < 5; step++) {
        el.prevPage();
        await wait(SETTLE);
      }

      expect(seen.map(event => event.detail.page)).toEqual([4, 3, 2, 1, 0]);
      expect(seen.every(event => event.detail.direction === 'backward')).toBe(true);
    });
  });
});
