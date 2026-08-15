/**
 * Smoke slice of the snice-virtual-scroller matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/virtual-scroller/, 97 combos across
 * window.test.ts and rendering.test.ts) is excluded from the default Vitest
 * include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and its window assertions route
 * through the matrix's own `expectWindow` oracle — coverage, buffer, thrift,
 * spacer extent and viewport offset all at once — so it cannot claim less than
 * the suite it stands in for.
 *
 * The marquee combos: the top of a huge list (the case the component exists
 * for), the middle of it (where a virtual window can be wrong in both
 * directions at once), the very end (where the buffer clamps), a list shorter
 * than the viewport (where virtualisation must not kick in), and the two
 * documented accessors.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  makeScroller, items, expectWindow, renderedIndices, renderedItems,
  spacerHeight, VIEWPORT_HEIGHT, wait,
} from './vs-matrix-utils';

let el: any = null;
afterEach(() => { el?.remove(); el = null; });

describe('virtual-scroller matrix smoke', () => {
  it('renders only a window of a 10 000-item list at the top', async () => {
    el = await makeScroller({ items: items(10_000), itemHeight: 50, bufferSize: 5 });
    expectWindow(el, { total: 10_000, itemHeight: 50, bufferSize: 5, scrollTop: 0 });
  });

  it('scrollToIndex lands the window on the middle of the list', async () => {
    el = await makeScroller({ items: items(10_000), itemHeight: 50, bufferSize: 5 });
    el.scrollToIndex(5000);
    await wait(0);
    expectWindow(el, { total: 10_000, itemHeight: 50, bufferSize: 5, scrollTop: 5000 * 50 });
  });

  it('the buffer clamps at the end of the list', async () => {
    el = await makeScroller({ items: items(1000), itemHeight: 80, bufferSize: 10 });
    el.scrollToIndex(999);
    await wait(0);
    expectWindow(el, { total: 1000, itemHeight: 80, bufferSize: 10, scrollTop: 999 * 80 });
  });

  it('a list shorter than the viewport is rendered whole', async () => {
    el = await makeScroller({ items: items(4), itemHeight: 50, bufferSize: 5 });
    expect(renderedIndices(el)).toEqual([0, 1, 2, 3]);
    expect(spacerHeight(el)).toBe(4 * 50);
  });

  it('scrollToItem(id) reaches the same window as scrollToIndex', async () => {
    el = await makeScroller({ items: items(1000), itemHeight: 50, bufferSize: 5 });
    el.scrollToIndex(400);
    await wait(0);
    const viaIndex = renderedIndices(el);

    el.scrollToIndex(0);
    await wait(0);
    el.scrollToItem(400);
    await wait(0);

    expect(renderedIndices(el)).toEqual(viaIndex);
  });

  it('renderItem decides what a rendered row says', async () => {
    el = await makeScroller({
      items: items(500),
      itemHeight: 50,
      bufferSize: 0,
      renderItem: (item: any, index: number) => `<span class="row">${index}:${item.data}</span>`,
    });
    const first = renderedItems(el)[0];
    expect(first.querySelector('.row')?.textContent).toBe('0:Item 1');
  });

  it('getVisibleRange agrees with the DOM', async () => {
    el = await makeScroller({ items: items(2000), itemHeight: 25, bufferSize: 3 });
    el.scrollToIndex(700);
    await wait(0);

    const range = el.getVisibleRange();
    const indices = renderedIndices(el);
    expect(indices[0]).toBe(range.start);
    expect(indices[indices.length - 1]).toBe(range.end - 1);
    // A viewport of VIEWPORT_HEIGHT at 25px per row plus two 3-item buffers is
    // the entire budget; anything more is not virtualisation.
    expect(indices.length).toBeLessThanOrEqual(Math.ceil(VIEWPORT_HEIGHT / 25) + 6);
  });
});
