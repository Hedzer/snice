// snice-virtual-scroller matrix — the rendered-window cross.
//
// Dimensions (docs/ai/components/virtual-scroller.md):
//   itemHeight  25 | 50 | 80              (3)
//   bufferSize  0 | 5 | 10                (3)
//   position    top | quarter | middle | end   (4)   via scrollToIndex()
//   listSize    30 | 1000                 (2)
//
// 3 x 3 x 4 x 2 = 72 combos, each judged by expectWindow: coverage, buffer,
// thrift, spacer extent, and viewport offset.
import { describe, it, expect, afterEach } from 'vitest';
import {
  makeScroller, items, expectWindow, renderedIndices, wait,
} from './vs-matrix-utils';

let el: any = null;
afterEach(() => { el?.remove(); el = null; });

const HEIGHTS = [25, 50, 80];
const BUFFERS = [0, 5, 10];
const SIZES = [30, 1000];
const POSITIONS = {
  top: () => 0,
  quarter: (n: number) => Math.floor(n / 4),
  middle: (n: number) => Math.floor(n / 2),
  end: (n: number) => n - 1,
} as const;

describe('virtual-scroller matrix / rendered window', () => {
  for (const itemHeight of HEIGHTS) {
    for (const bufferSize of BUFFERS) {
      for (const [posName, posFn] of Object.entries(POSITIONS)) {
        for (const total of SIZES) {
          it(`h${itemHeight}/buf${bufferSize}/${posName}/n${total}`, async () => {
            el = await makeScroller({ items: items(total), itemHeight, bufferSize });

            const index = posFn(total);
            el.scrollToIndex(index);
            await wait(0);

            expectWindow(el, {
              total, itemHeight, bufferSize,
              scrollTop: index * itemHeight,
            });
          });
        }
      }
    }
  }
});

describe('virtual-scroller matrix / scrollToItem', () => {
  // "scrollToItem(id) - Scroll to item by ID"
  for (const target of [0, 7, 250, 999]) {
    it(`id ${target} lands on the same window as scrollToIndex(${target})`, async () => {
      el = await makeScroller({ items: items(1000), itemHeight: 50, bufferSize: 5 });

      el.scrollToIndex(target);
      await wait(0);
      const viaIndex = renderedIndices(el);

      el.scrollToIndex(0);
      await wait(0);
      el.scrollToItem(target);
      await wait(0);

      expect(renderedIndices(el)).toEqual(viaIndex);
    });
  }

  it('an unknown id does not move the window', async () => {
    el = await makeScroller({ items: items(100), itemHeight: 50, bufferSize: 5 });
    el.scrollToIndex(40);
    await wait(0);
    const before = renderedIndices(el);
    el.scrollToItem('nope');
    await wait(0);
    expect(renderedIndices(el)).toEqual(before);
  });
});

describe('virtual-scroller matrix / range guards', () => {
  // scrollToIndex is documented as taking an index; out-of-range asks for an
  // item that does not exist and must not invent one.
  for (const index of [-1, -100, 100, 1000]) {
    it(`scrollToIndex(${index}) on a 100-item list is a no-op`, async () => {
      el = await makeScroller({ items: items(100), itemHeight: 50, bufferSize: 5 });
      el.scrollToIndex(30);
      await wait(0);
      const before = renderedIndices(el);

      el.scrollToIndex(index);
      await wait(0);

      expect(renderedIndices(el)).toEqual(before);
    });
  }

  for (const total of [0, 1, 3]) {
    it(`a ${total}-item list renders exactly ${total} items`, async () => {
      el = await makeScroller({ items: items(total), itemHeight: 50, bufferSize: 5 });
      expectWindow(el, { total, itemHeight: 50, bufferSize: 5, scrollTop: 0 });
      expect(renderedIndices(el)).toHaveLength(total);
    });
  }

  it('refresh() recomputes the window after the item list shrinks', async () => {
    el = await makeScroller({ items: items(500), itemHeight: 50, bufferSize: 5 });
    el.scrollToIndex(400);
    await wait(0);

    el.items = items(10);
    el.refresh();
    await wait(0);

    const range = el.getVisibleRange();
    expect(range.end).toBeLessThanOrEqual(10);
    expect(renderedIndices(el).every(i => i < 10)).toBe(true);
  });
});
