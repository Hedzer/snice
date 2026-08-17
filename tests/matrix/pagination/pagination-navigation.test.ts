/**
 * snice-pagination matrix — NAVIGATION: the five documented methods, the four
 * navigation buttons, the page buttons, and the one documented event.
 *
 * The cross is ENTRY POINT x STARTING POSITION. There are nine ways to change
 * the page — `goToPage`, `nextPage`, `previousPage`, `firstPage`, `lastPage`,
 * and clicks on the first/prev/next/last buttons — and the documented result
 * of each depends on where you already are: at page 1 a "previous" is a no-op,
 * at `total` a "next" is, and a jump to the page you are already on is a no-op
 * from every entry point.
 *
 * The oracle is the doc's own arithmetic:
 *
 *   nextPage / next-button      current + 1, clamped at `total`
 *   previousPage / prev-button  current - 1, clamped at 1
 *   firstPage / first-button    1
 *   lastPage / last-button      `total`
 *   goToPage(p)                 p, but only for 1 <= p <= total
 *
 * and in every case: a real move emits exactly one `pagination-change` with
 * `{ page, previousPage }`, and a no-op emits NOTHING. The second half is the
 * half that catches real bugs — a component that fires an event for a move it
 * did not make will drive a consumer into an infinite fetch loop.
 */
import { describe, it, afterEach } from 'vitest';
import {
  SETTLE, type SwitchName,
  clickNav, clickPage, combo, expect, expectWindowMatches, makePagination,
  pageNumbers, recordChanges, teardown, wait,
} from './pagination-support';

const TOTAL = 10;

/** Every documented entry point, and the page it is documented to land on. */
const ENTRY_POINTS: Array<{
  name: string;
  go: (el: any) => void;
  target: (current: number, total: number) => number;
}> = [
  { name: 'nextPage()', go: el => el.nextPage(), target: (c, t) => Math.min(t, c + 1) },
  { name: 'previousPage()', go: el => el.previousPage(), target: c => Math.max(1, c - 1) },
  { name: 'firstPage()', go: el => el.firstPage(), target: () => 1 },
  { name: 'lastPage()', go: el => el.lastPage(), target: (_c, t) => t },
  { name: 'next-button', go: el => clickNav(el, 'showNext' as SwitchName), target: (c, t) => Math.min(t, c + 1) },
  { name: 'prev-button', go: el => clickNav(el, 'showPrev' as SwitchName), target: c => Math.max(1, c - 1) },
  { name: 'first-button', go: el => clickNav(el, 'showFirst' as SwitchName), target: () => 1 },
  { name: 'last-button', go: el => clickNav(el, 'showLast' as SwitchName), target: (_c, t) => t },
];

const STARTS = [1, 2, 5, TOTAL - 1, TOTAL];

describe('snice-pagination matrix — navigation', () => {
  afterEach(teardown);

  // ── entry point x starting position ──────────────────────────────────────
  for (const entry of ENTRY_POINTS) {
    for (const start of STARTS) {
      it(`${entry.name} from page ${start}`, async () => {
        const el = await makePagination(combo({ current: start, total: TOTAL }));
        const changes = recordChanges(el);

        entry.go(el);
        await wait(SETTLE);

        const target = entry.target(start, TOTAL);
        expect(el.current, 'landed on').toBe(target);

        if (target === start) {
          expect(changes, 'a no-op must not announce a change').toEqual([]);
        } else {
          expect(changes, 'exactly one change').toEqual([
            { page: target, previousPage: start },
          ]);
        }
        // The window follows the move.
        expectWindowMatches(el, combo({ current: target, total: TOTAL }));
      });
    }
  }

  // ── goToPage across its documented range and outside it ──────────────────
  for (const page of [-5, 0, 1, 2, 5, TOTAL, TOTAL + 1, 999]) {
    it(`goToPage(${page}) from page 5`, async () => {
      const el = await makePagination(combo({ current: 5, total: TOTAL }));
      const changes = recordChanges(el);

      el.goToPage(page);
      await wait(SETTLE);

      // "goToPage(page: number) - Navigate to specific page": a page outside
      // [1, total] is not a page, so nothing happens at all.
      const valid = page >= 1 && page <= TOTAL && page !== 5;
      expect(el.current, 'current after goToPage').toBe(valid ? page : 5);
      expect(changes.length, 'change events').toBe(valid ? 1 : 0);
      if (valid) expect(changes[0]).toEqual({ page, previousPage: 5 });
    });
  }

  // ── page buttons ─────────────────────────────────────────────────────────
  it('clicking a page button navigates to exactly that page', async () => {
    const el = await makePagination(combo({ current: 5, total: TOTAL, siblings: 1 }));
    const changes = recordChanges(el);

    expect(clickPage(el, 6), 'page 6 is in the window').toBe(true);
    await wait(SETTLE);

    expect(el.current).toBe(6);
    expect(changes).toEqual([{ page: 6, previousPage: 5 }]);
  });

  it('clicking the current page button is a no-op', async () => {
    const el = await makePagination(combo({ current: 5, total: TOTAL }));
    const changes = recordChanges(el);

    expect(clickPage(el, 5), 'the current page is rendered').toBe(true);
    await wait(SETTLE);

    expect(el.current).toBe(5);
    expect(changes, 'no move, no event').toEqual([]);
  });

  it('every page in the window is clickable and lands where it says', async () => {
    for (const page of [1, 10]) {
      const el = await makePagination(combo({ current: 5, total: TOTAL, siblings: 1 }));
      const changes = recordChanges(el);
      expect(clickPage(el, page), `page ${page} rendered`).toBe(true);
      await wait(SETTLE);
      expect(el.current).toBe(page);
      expect(changes).toEqual([{ page, previousPage: 5 }]);
      teardown();
    }
  });

  it('an ellipsis is not a control', async () => {
    const el = await makePagination(combo({ current: 50, total: 100, siblings: 1 }));
    const changes = recordChanges(el);
    const ellipsis = el.shadowRoot.querySelector('[part~="ellipsis"]') as HTMLElement;
    ellipsis.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);
    expect(el.current, 'clicking an ellipsis navigates nowhere').toBe(50);
    expect(changes).toEqual([]);
  });

  // ── the event contract ───────────────────────────────────────────────────
  it('pagination-change bubbles and is composed', async () => {
    const el = await makePagination(combo({ current: 1, total: TOTAL }));
    const seen: any[] = [];
    const listener = (event: Event) => seen.push((event as CustomEvent).detail);
    document.addEventListener('pagination-change', listener);

    el.nextPage();
    await wait(SETTLE);
    document.removeEventListener('pagination-change', listener);

    expect(seen).toEqual([{ page: 2, previousPage: 1 }]);
  });

  it('previousPage reports the page it came from, not the one before that', async () => {
    const el = await makePagination(combo({ current: 5, total: TOTAL }));
    const changes = recordChanges(el);

    el.previousPage();
    await wait(SETTLE);
    el.previousPage();
    await wait(SETTLE);

    expect(changes).toEqual([
      { page: 4, previousPage: 5 },
      { page: 3, previousPage: 4 },
    ]);
  });

  it('a chain of moves keeps current and the window in step', async () => {
    const el = await makePagination(combo({ current: 1, total: 100, siblings: 2 }));
    const changes = recordChanges(el);

    el.nextPage();
    await wait(SETTLE);
    el.lastPage();
    await wait(SETTLE);
    el.previousPage();
    await wait(SETTLE);
    el.firstPage();
    await wait(SETTLE);

    expect(changes.map(change => change.page)).toEqual([2, 100, 99, 1]);
    expect(el.current).toBe(1);
    expectWindowMatches(el, combo({ current: 1, total: 100, siblings: 2 }));
    expect(pageNumbers(el)[0], 'the window is back at the start').toBe(1);
  });

  it('assigning current directly does not fabricate a change event', async () => {
    // The doc's event is "Page changed" by the component's own navigation; a
    // page that drives `current` itself already knows what it did.
    const el = await makePagination(combo({ current: 1, total: TOTAL }));
    const changes = recordChanges(el);

    el.current = 7;
    await wait(SETTLE);

    expect(el.current).toBe(7);
    expect(changes, 'no echo back to the author').toEqual([]);
    expectWindowMatches(el, combo({ current: 7, total: TOTAL }));
  });

  it('a hidden navigation button cannot be clicked into existence', async () => {
    const el = await makePagination(combo({ current: 5, total: TOTAL, showNext: false }));
    const changes = recordChanges(el);
    expect(clickNav(el, 'showNext' as SwitchName), 'no next button rendered').toBe(false);
    await wait(SETTLE);
    expect(el.current).toBe(5);
    expect(changes).toEqual([]);
    // …and the method still works, because the doc lists it independently.
    el.nextPage();
    await wait(SETTLE);
    expect(el.current).toBe(6);
  });
});
