// snice-virtual-scroller matrix — item rendering: the documented `renderItem`
// return shapes, the documented per-item `height`, and the CSS part.
import { describe, it, expect, afterEach } from 'vitest';
import {
  makeScroller, items, renderedItems, renderedIndices, absoluteTops, itemHeights,
  spacerHeight, wait, type Item,
} from './vs-matrix-utils';

let el: any = null;
afterEach(() => { el?.remove(); el = null; });

// ── renderItem shapes ───────────────────────────────────────────────────────
//
// "renderItem: (item, index) => string | HTMLElement" — both returns are
// documented, so both must reach the DOM, and the index handed to the callback
// must be the item's index in the FULL list (the doc's `scroller.scrollToIndex(500)`
// example is meaningless otherwise).

const SHAPES = {
  default: undefined,
  string: (item: Item) => `<span class="probe">${item.data}</span>`,
  element: (item: Item) => {
    const node = document.createElement('p');
    node.className = 'probe';
    node.textContent = String(item.data);
    return node;
  },
} as const;

describe('virtual-scroller matrix / renderItem', () => {
  for (const [shape, renderItem] of Object.entries(SHAPES)) {
    for (const itemHeight of [40, 60]) {
      it(`${shape}/h${itemHeight}: every rendered row shows its own item`, async () => {
        el = await makeScroller({
          items: items(200), itemHeight, bufferSize: 5,
          renderItem: renderItem as any,
        });
        el.scrollToIndex(50);
        await wait(0);

        const indices = renderedIndices(el);
        const texts = renderedItems(el).map(node => node.textContent?.trim());
        expect(texts).toEqual(indices.map(i => `Item ${i + 1}`));
      });
    }
  }

  it('the callback receives the index within the full list, not the window', async () => {
    const seen: number[] = [];
    el = await makeScroller({
      items: items(300), itemHeight: 50, bufferSize: 2,
      renderItem: (item, index) => { seen.push(index); return String(item.data); },
    });
    el.scrollToIndex(100);
    await wait(0);

    const indices = renderedIndices(el);
    expect(seen.slice(-indices.length)).toEqual(indices);
  });

  it('non-string data is rendered by the default escaping renderer', async () => {
    el = await makeScroller({
      items: [{ id: 'a', data: { name: 'X' } }], itemHeight: 50, bufferSize: 0,
    });
    expect(renderedItems(el)[0].textContent?.trim()).toBe('{"name":"X"}');
  });

  it('exposes part=base on the scroller container', async () => {
    el = await makeScroller({ items: items(10), itemHeight: 50, bufferSize: 5 });
    const base = el.shadowRoot.querySelector('[part="base"]');
    expect(base).toBeTruthy();
    expect(base.classList.contains('scroller')).toBe(true);
  });
});

// ── Per-item height ─────────────────────────────────────────────────────────

describe('virtual-scroller matrix / per-item height', () => {
  it('uniform items fall back to itemHeight and stack without gaps', async () => {
    el = await makeScroller({ items: items(20), itemHeight: 50, bufferSize: 0 });
    const tops = absoluteTops(el);
    const heights = itemHeights(el);
    expect(heights.every(h => h === 50)).toBe(true);
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBe(tops[i - 1] + heights[i - 1]);
    }
  });

  /**
   * FINDING MATRIX-virtual-scroller-1.
   *
   * `VirtualScrollerItem.height` is documented ("height?: number"), and the
   * component honours it — but only for the row's own CSS height. Every row's
   * `top` is still `index * itemHeight`, and the spacer that gives the list its
   * scroll extent is still `items.length * itemHeight`. So a list whose items
   * declare a height different from `itemHeight` paints its rows on top of one
   * another and can never scroll to its own end.
   *
   * The assertion below is the correct one — consecutive rows do not overlap,
   * and the scrollable extent equals the sum of the item heights — and it stays
   * as written. Marked `it.fails` because the component does not satisfy it.
   */
  it.fails('MATRIX-virtual-scroller-1: rows with explicit heights stack without overlapping', async () => {
    const tall: Item[] = items(12).map((item, i) => ({ ...item, height: i % 2 === 0 ? 100 : 50 }));
    el = await makeScroller({ items: tall, itemHeight: 50, bufferSize: 0 });

    const tops = absoluteTops(el);
    const heights = itemHeights(el);

    // Each row begins where the previous one ends.
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBe(tops[i - 1] + heights[i - 1]);
    }
    // And the scroll extent covers all of them.
    expect(spacerHeight(el)).toBe(tall.reduce((sum, item) => sum + (item.height ?? 50), 0));
  });

  it('records the observed behaviour of MATRIX-virtual-scroller-1 (regression guard)', async () => {
    // Not an endorsement: this pins TODAY's output so the finding above cannot
    // be "fixed" by accident without someone noticing the pair disagree.
    const tall: Item[] = items(4).map(item => ({ ...item, height: 100 }));
    el = await makeScroller({ items: tall, itemHeight: 50, bufferSize: 0 });
    expect(itemHeights(el)).toEqual([100, 100, 100, 100]);
    expect(absoluteTops(el)).toEqual([0, 50, 100, 150]); // 50px of overlap per row
    expect(spacerHeight(el)).toBe(200); // 4 x itemHeight, not 4 x 100
  });
});
