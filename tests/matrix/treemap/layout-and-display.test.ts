/**
 * snice-treemap — the laid-out chart, across data shapes and display switches.
 *
 * AXES:
 *   tree         9 data shapes (the doc's own example, a leaf, the documented
 *                empty default, one child, equal siblings, a steep drop, a zero
 *                value, three levels, explicit colours, markup in a label)
 *   showLabels   on | off
 *   showValues   on | off
 *   colorScheme  the eight documented values
 *   padding      0, 2 (the default), 20
 *
 * The tree x labels x values cross is the body of the matrix: it is where "one
 * rectangle per child, labelled when it fits" either holds or does not.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mountTreemap, expectChartMatches, comboId, rects, labels, values, boxes, fills,
  text, sr, partEl, TREES, SCHEMES, DOC_PARTS, VIEW, totalOf, wait, SETTLE,
} from './treemap-support';

afterEach(() => { document.body.innerHTML = ''; });

const TREE_NAMES = Object.keys(TREES) as Array<keyof typeof TREES>;

describe('snice-treemap matrix: data shapes x label switches', () => {
  for (const tree of TREE_NAMES) {
    for (const showLabels of [true, false]) {
      for (const showValues of [false, true]) {
        const combo = { tree, showLabels, showValues };
        it(comboId(combo), async () => {
          const el = await mountTreemap(combo);
          expectChartMatches(el, combo);
        });
      }
    }
  }
});

describe('snice-treemap matrix: colour schemes', () => {
  for (const colorScheme of SCHEMES) {
    const combo = { tree: 'doc' as const, colorScheme };
    it(`${colorScheme}: every rectangle is painted`, async () => {
      const el = await mountTreemap(combo);
      expectChartMatches(el, combo);
      expect(fills(el).filter(fill => !fill)).toEqual([]);
    });
  }

  it('sibling rectangles are told apart by colour', async () => {
    // A scheme that painted every sibling identically would make a treemap
    // unreadable, which is the entire reason a palette exists.
    for (const colorScheme of SCHEMES) {
      const el = await mountTreemap({ tree: 'deep', colorScheme });
      const painted = fills(el);
      expect(new Set(painted).size, `${colorScheme} painted ${JSON.stringify(painted)}`)
        .toBe(painted.length);
    }
  });

  /**
   * MATRIX-treemap-1 (fixed): the squarified layout used to compute each
   * rectangle's palette slot as `colorOffset + rects.length + i` while ALSO
   * pushing into `rects` inside the same loop, so the index advanced twice per
   * rectangle — adjacent siblings painted the same colour and half the
   * palette was never used. The index now advances exactly once per
   * rectangle. The assertions below are the documented ones and always were.
   */
  it('no two neighbouring rectangles share a colour [MATRIX-treemap-1]', async () => {
    const el = await mountTreemap({ tree: 'many', colorScheme: 'rainbow' });
    const painted = fills(el);
    const collisions = painted
      .map((fill, index) => (index > 0 && fill === painted[index - 1] ? index : -1))
      .filter(index => index >= 0);
    expect(collisions, `painted ${JSON.stringify(painted)}`).toEqual([]);
  });

  it('a palette of eight is used before it repeats [MATRIX-treemap-1]', async () => {
    const el = await mountTreemap({ tree: 'many', colorScheme: 'rainbow' });
    expect(new Set(fills(el).slice(0, 8)).size).toBe(8);
  });

  it('a named scheme paints something other than the default one', async () => {
    const base = await mountTreemap({ tree: 'doc', colorScheme: 'default' });
    const rainbow = await mountTreemap({ tree: 'doc', colorScheme: 'rainbow' });
    // The node with an explicit colour is excluded: it is documented to win
    // over whatever the scheme says.
    const withoutExplicit = (list: string[]) => list.filter(fill => fill !== '#e74c3c');
    expect(withoutExplicit(fills(rainbow))).not.toEqual(withoutExplicit(fills(base)));
  });

  it('an explicit node colour beats the scheme', async () => {
    for (const colorScheme of SCHEMES) {
      const el = await mountTreemap({ tree: 'colored', colorScheme });
      expect(fills(el).sort()).toEqual(['#1565c0', '#2e7d32', '#e74c3c']);
    }
  });
});

describe('snice-treemap matrix: padding', () => {
  for (const padding of [0, 2, 20]) {
    const combo = { tree: 'equal' as const, padding };
    it(`padding=${padding} keeps every rectangle inside the viewport`, async () => {
      const el = await mountTreemap(combo);
      expectChartMatches(el, combo);
    });
  }

  it('more padding means smaller rectangles', async () => {
    // `padding: number = 2` is documented as the gap between rectangles; the
    // only observable consequence is that the rectangles shrink.
    const tight = await mountTreemap({ tree: 'equal', padding: 0 });
    const loose = await mountTreemap({ tree: 'equal', padding: 20 });
    const area = (el: any) => boxes(el).reduce((sum, box) => sum + box.w * box.h, 0);
    expect(area(loose)).toBeLessThan(area(tight));
  });

  it('padding never turns a rectangle inside out', async () => {
    // A padding larger than a rectangle must clamp, not produce a negative box.
    const el = await mountTreemap({ tree: 'steep', padding: 20 });
    for (const box of boxes(el)) {
      expect(box.w).toBeGreaterThanOrEqual(0);
      expect(box.h).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('snice-treemap matrix: what a rectangle says', () => {
  it('a label is the node\'s own label', async () => {
    const el = await mountTreemap({ tree: 'doc', showLabels: true });
    const shown = labels(el).map(text);
    for (const label of shown) {
      expect(['A', 'B', 'C']).toContain(label);
    }
    expect(new Set(shown).size).toBe(shown.length);
  });

  it('a value is the node\'s own total', async () => {
    // "showValues" writes the value of the node — and a parent's value is the
    // sum of its children, which is what makes the treemap add up.
    const el = await mountTreemap({ tree: 'doc', showValues: true });
    const shown = values(el).map(text);
    const expected = TREES.doc.children!.map(child => totalOf(child).toLocaleString());
    for (const value of shown) {
      expect(expected).toContain(value);
    }
  });

  it('labels and values share a rectangle without replacing each other', async () => {
    const both = await mountTreemap({ tree: 'doc', showLabels: true, showValues: true });
    expect(labels(both).length).toBeGreaterThan(0);
    expect(values(both).length).toBeGreaterThan(0);
  });

  it('markup in a label is text, not markup', async () => {
    // A label is authored data; a treemap that parsed it would be an injection
    // vector in every dashboard that draws user-supplied categories.
    const el = await mountTreemap({ tree: 'markup', showLabels: true });
    expect(sr(el).querySelector('script')).toBeNull();
    const shown = labels(el).map(text);
    expect(shown.some(label => label.includes('<script>') || label.includes('&'))).toBe(true);
  });

  it('a leaf draws nothing but keeps its chart', async () => {
    // Nothing is nested inside a leaf, so there is nothing to lay out — but the
    // documented parts still have to be there for the next `data` assignment.
    const el = await mountTreemap({ tree: 'leaf' });
    expect(rects(el)).toEqual([]);
    for (const name of DOC_PARTS) expect(partEl(el, name), name).toBeTruthy();
  });

  it('the documented empty default draws an empty chart', async () => {
    const el = await mountTreemap({ tree: 'empty' });
    expect(rects(el)).toEqual([]);
  });
});

describe('snice-treemap matrix: re-assignment', () => {
  it('assigning new data replaces the whole chart', async () => {
    const el = await mountTreemap({ tree: 'doc' });
    expect(rects(el)).toHaveLength(3);

    el.data = TREES.equal;
    await wait(SETTLE);
    expect(rects(el)).toHaveLength(2);
    expect(labels(el).map(text).sort()).toEqual(['A', 'B']);
  });

  it('toggling a display switch redraws without new data', async () => {
    const el = await mountTreemap({ tree: 'doc', showValues: false });
    expect(values(el)).toEqual([]);

    el.showValues = true;
    await wait(SETTLE);
    expect(values(el).length).toBeGreaterThan(0);

    el.showLabels = false;
    await wait(SETTLE);
    expect(labels(el)).toEqual([]);
  });

  it('changing the scheme repaints the same rectangles', async () => {
    const el = await mountTreemap({ tree: 'deep', colorScheme: 'blue' });
    const before = fills(el);
    el.colorScheme = 'rainbow';
    await wait(SETTLE);
    const after = fills(el);
    expect(after).toHaveLength(before.length);
    expect(after).not.toEqual(before);
  });

  it('the chart fills its own viewport', async () => {
    // Every rectangle inside, and together covering most of it: a squarified
    // layout that used a third of the canvas would be a layout bug the DOM can
    // still see, because the geometry is in the markup.
    const el = await mountTreemap({ tree: 'doc', padding: 0 });
    const covered = boxes(el).reduce((sum, box) => sum + box.w * box.h, 0);
    expect(covered).toBeGreaterThan(VIEW.width * VIEW.height * 0.9);
    expect(covered).toBeLessThanOrEqual(VIEW.width * VIEW.height + 1);
  });
});
