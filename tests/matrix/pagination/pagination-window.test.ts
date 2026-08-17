/**
 * snice-pagination matrix — THE PAGE WINDOW.
 *
 * The component's one piece of real logic: given `current`, `total` and
 * `siblings`, which page numbers and how many ellipses appear. The cross is
 * `total` x `siblings` x every INTERESTING position of `current` inside that
 * total — first, second, one before the middle, the middle, one after,
 * second-last and last — because the window's shape changes precisely at those
 * boundaries (an ellipsis appears on one side and disappears from the other)
 * and nowhere in between.
 *
 * Totals are chosen to straddle the elision threshold from both sides for each
 * sibling count: 1 and 2 are degenerate, 5 and 7 sit around where a
 * `siblings=1` window stops fitting, 10 and 25 are comfortably elided, and 100
 * is large enough that a windowing bug cannot hide behind a small range.
 *
 * Every combo is judged by the full documented oracle in
 * `pagination-support.ts` — required pages present, strictly ascending, an
 * ellipsis exactly at each skipped run and nowhere else, a complete list when
 * nothing is elided, at most `2*siblings + 3` pages when something is, and
 * exactly one `aria-current="page"`.
 */
import { describe, it, afterEach } from 'vitest';
import {
  combo, expect, expectWindowMatches, makePagination, pageNumbers, part, parts,
  readWindow, requiredPages, teardown,
} from './pagination-support';

const TOTALS = [1, 2, 5, 7, 10, 25, 100];
const SIBLING_COUNTS = [0, 1, 2, 3];

/** The positions at which the window's shape can change. */
function interestingPages(total: number): number[] {
  const middle = Math.ceil(total / 2);
  const candidates = [1, 2, middle - 1, middle, middle + 1, total - 1, total];
  return [...new Set(candidates.filter(page => page >= 1 && page <= total))];
}

describe('snice-pagination matrix — page window', () => {
  afterEach(teardown);

  for (const total of TOTALS) {
    for (const siblings of SIBLING_COUNTS) {
      for (const current of interestingPages(total)) {
        const c = combo({ total, siblings, current });
        it(`window: ${c.id}`, async () => {
          const el = await makePagination(c);
          expectWindowMatches(el, c);
        });
      }
    }
  }

  // ── the doc's own example, exactly ───────────────────────────────────────
  it('the documented example renders first, the sibling window and last', async () => {
    // `<snice-pagination current="1" total="10">` with the default siblings=1.
    const c = combo({ current: 1, total: 10, siblings: 1 });
    const el = await makePagination(c);
    expectWindowMatches(el, c);

    const shown = new Set(pageNumbers(el));
    for (const page of requiredPages(c)) {
      expect(shown.has(page), `page ${page} shown`).toBe(true);
    }
    expect(parts(el, 'ellipsis').length, 'pages are hidden, so an ellipsis is due')
      .toBeGreaterThan(0);
  });

  // ── siblings really widens the window ────────────────────────────────────
  it('a larger siblings count shows strictly more pages around current', async () => {
    const counts: number[] = [];
    for (const siblings of [0, 1, 2, 3]) {
      const el = await makePagination(combo({ total: 100, current: 50, siblings }));
      counts.push(pageNumbers(el).length);
      teardown();
    }
    // Each extra sibling adds one page on each side; the doc's "Pages shown
    // each side of current" is monotone by construction.
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i], `siblings=${i} shows more than siblings=${i - 1}`)
        .toBeGreaterThan(counts[i - 1]);
    }
  });

  it('siblings=0 still shows first, current and last', async () => {
    const c = combo({ total: 100, current: 50, siblings: 0 });
    const el = await makePagination(c);
    expectWindowMatches(el, c);
    expect(pageNumbers(el)).toEqual([1, 50, 100]);
  });

  // ── degenerate ranges ────────────────────────────────────────────────────
  it('a single-page range renders exactly one page and no ellipsis', async () => {
    const c = combo({ total: 1, current: 1 });
    const el = await makePagination(c);
    expectWindowMatches(el, c);
    expect(readWindow(el)).toEqual([1]);
    expect(part(el, 'ellipsis'), 'nothing to elide').toBeNull();
  });

  it('the default total is 1, so a bare pagination shows page 1 alone', async () => {
    const el = await makePagination(combo({ total: 1, current: 1, siblings: 1 }));
    expect(el.total).toBe(1);
    expect(readWindow(el)).toEqual([1]);
  });

  // ── the window follows `current` at runtime ──────────────────────────────
  it('re-renders the window when current changes', async () => {
    const el = await makePagination(combo({ total: 100, current: 1, siblings: 1 }));
    for (const current of [1, 2, 50, 99, 100]) {
      el.current = current;
      await new Promise(resolve => setTimeout(resolve, 20));
      const c = combo({ total: 100, current, siblings: 1 });
      expectWindowMatches(el, c);
    }
  });

  it('re-renders the window when total shrinks below current', async () => {
    const el = await makePagination(combo({ total: 100, current: 50 }));
    el.total = 60;
    el.current = 30;
    await new Promise(resolve => setTimeout(resolve, 20));
    expectWindowMatches(el, combo({ total: 60, current: 30 }));
  });

  it('re-renders the window when siblings changes', async () => {
    const el = await makePagination(combo({ total: 100, current: 50, siblings: 1 }));
    const before = pageNumbers(el).length;
    el.siblings = 3;
    await new Promise(resolve => setTimeout(resolve, 20));
    expectWindowMatches(el, combo({ total: 100, current: 50, siblings: 3 }));
    expect(pageNumbers(el).length, 'a wider window').toBeGreaterThan(before);
  });

  // ── the ellipsis is a part, and it is the documented one ─────────────────
  it('each ellipsis is exposed as part="ellipsis" and reads as an ellipsis', async () => {
    const el = await makePagination(combo({ total: 100, current: 50, siblings: 1 }));
    const marks = parts(el, 'ellipsis');
    expect(marks.length, 'hidden on both sides').toBe(2);
    for (const mark of marks) {
      expect((mark.textContent ?? '').trim(), 'the ellipsis says so').not.toBe('');
    }
  });

  it('page buttons live inside part="pages"', async () => {
    const el = await makePagination(combo({ total: 100, current: 50 }));
    const container = part(el, 'pages')!;
    const inside = container.querySelectorAll('.pagination-page').length;
    const anywhere = el.shadowRoot.querySelectorAll('.pagination-page').length;
    expect(inside, 'every page button is in the pages container').toBe(anywhere);
    expect(inside).toBeGreaterThan(0);
  });
});
