/**
 * Smoke slice of the snice-pagination matrix — the everyday-loop tier.
 *
 * The one file of this matrix the default `vitest run` still collects. One
 * combo per feature family, so a family that breaks cannot hide:
 *
 *   · window     — the documented example, judged by the full window oracle;
 *   · siblings   — a wider window really shows more pages;
 *   · chrome     — the four buttons, their labels and the boundary disabling;
 *   · switches   — `show-*="false"` removes exactly its own button;
 *   · navigation — a method, a button and a page click, each with its event;
 *   · no-ops     — a move that cannot happen announces nothing.
 *
 * Structure routes through the matrix oracles (`expectWindowMatches`,
 * `expectChromeMatches`) so this file cannot drift weaker than the suite it
 * stands in for.
 *
 * BUDGET: under 1s. New combos go in the matrix, never here.
 */
import { describe, it, afterEach } from 'vitest';
import {
  NAV_BUTTONS, SETTLE,
  clickNav, clickPage, combo, expect, expectChromeMatches, expectWindowMatches,
  makePagination, pageNumbers, part, recordChanges, teardown, wait,
} from './pagination-support';

describe('pagination matrix smoke', () => {
  afterEach(teardown);

  it('window: the documented example elides and keeps first, current and last', async () => {
    const c = combo({ current: 1, total: 10, siblings: 1 });
    const el = await makePagination(c);
    expectWindowMatches(el, c);
    expect(part(el, 'ellipsis'), 'pages are hidden').not.toBeNull();
    expect(pageNumbers(el)).toContain(10);
  });

  it('siblings: a wider window shows more pages around current', async () => {
    const narrow = await makePagination(combo({ total: 100, current: 50, siblings: 1 }));
    const narrowCount = pageNumbers(narrow).length;
    teardown();

    const wide = await makePagination(combo({ total: 100, current: 50, siblings: 3 }));
    expectWindowMatches(wide, combo({ total: 100, current: 50, siblings: 3 }));
    expect(pageNumbers(wide).length).toBeGreaterThan(narrowCount);
  });

  it('chrome: the nav, its four buttons and the boundary disabling', async () => {
    const c = combo({ current: 1, total: 10 });
    const el = await makePagination(c);
    expectChromeMatches(el, c);
    expect(part(el, 'base')!.getAttribute('aria-label')).toBe('Pagination');
    expect(part(el, 'prev-button')!.hasAttribute('disabled'), 'prev at page 1').toBe(true);
    expect(part(el, 'next-button')!.hasAttribute('disabled'), 'next at page 1').toBe(false);
  });

  it('switches: show-last="false" removes only the last button', async () => {
    const c = combo({ current: 5, total: 10, showLast: false });
    const el = await makePagination(c);
    expectChromeMatches(el, c);
    expect(part(el, NAV_BUTTONS.showLast.part)).toBeNull();
    expect(part(el, NAV_BUTTONS.showNext.part), 'its neighbour survives').not.toBeNull();
  });

  it('navigation: method, button and page click each move and announce once', async () => {
    const el = await makePagination(combo({ current: 5, total: 10 }));
    const changes = recordChanges(el);

    el.nextPage();
    await wait(SETTLE);
    clickNav(el, 'showLast');
    await wait(SETTLE);
    clickPage(el, 1);
    await wait(SETTLE);

    expect(changes).toEqual([
      { page: 6, previousPage: 5 },
      { page: 10, previousPage: 6 },
      { page: 1, previousPage: 10 },
    ]);
    expect(el.current).toBe(1);
  });

  it('no-ops: a move that cannot happen announces nothing', async () => {
    const el = await makePagination(combo({ current: 1, total: 10 }));
    const changes = recordChanges(el);

    el.previousPage();
    el.firstPage();
    el.goToPage(0);
    el.goToPage(11);
    await wait(SETTLE);

    expect(el.current).toBe(1);
    expect(changes).toEqual([]);
  });
});
