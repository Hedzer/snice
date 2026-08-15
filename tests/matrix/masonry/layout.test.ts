/**
 * snice-masonry matrix — the feature cross.
 *
 * Dimensions (docs/ai/components/masonry.md):
 *   columns         0 | 1 | 2 | 3 | 5        (5)   0 = auto from minColumnWidth
 *   gap             '0' | '0.5rem' | '2rem'  (3)
 *   minColumnWidth  '150px' | '320px'        (2)
 *
 * 5 x 3 x 2 = 30 combos, each run twice (attribute channel and property
 * channel) plus a slot-content cross of 6 — 66 assertions' worth of test cases
 * for a component whose entire behaviour is three CSS custom properties.
 * Deliberately near the small end of the range .ai/fuzzing.md sets: the table
 * is the ceiling, and a CSS-columns wrapper is nowhere near it.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent, expectClean, cross } from '../matrix-kit';
import {
  Problems, checkColumnWidth, checkContainer, checkItemRoles, checkItemText,
  checkLayoutVariables, mountMasonry, mountMasonryByProperty,
  mountMasonryMinWidthAttribute, DEFAULTS, type Vector,
} from './masonry-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const COMBOS = cross({
  columns: [0, 1, 2, 3, 5],
  gap: ['0', '0.5rem', '2rem'],
  minColumnWidth: ['150px', '320px'],
});

describe('masonry matrix / attribute channel', () => {
  for (const combo of COMBOS) {
    it(combo.id, async () => {
      const vector: Vector = combo;
      el = await mountMasonry(vector, 4);
      const problems = new Problems();

      checkContainer(problems, el);
      checkLayoutVariables(problems, el, vector);
      checkItemRoles(problems, el, 4);

      expectClean(problems, combo.id);
    });
  }
});

describe('masonry matrix / property channel', () => {
  // Same 30 combos through `masonry.columns = 0` instead of `columns="0"`.
  // The documented auto mode is selected by an ATTRIBUTE rule, so a property
  // assignment that failed to reflect would silently lose it.
  for (const combo of COMBOS) {
    it(combo.id, async () => {
      const vector: Vector = combo;
      el = await mountMasonryByProperty(vector, 3);
      const problems = new Problems();

      checkContainer(problems, el);
      checkLayoutVariables(problems, el, vector);
      checkItemRoles(problems, el, 3);

      expectClean(problems, combo.id);
    });
  }
});

describe('masonry matrix / slotted content', () => {
  for (const count of [0, 1, 2, 5, 12, 25]) {
    it(`${count} items`, async () => {
      el = await mountMasonry({ ...DEFAULTS }, count);
      const problems = new Problems();

      checkContainer(problems, el);
      checkItemRoles(problems, el, count);
      checkItemText(problems, el, count);

      expectClean(problems, `items=${count}`);
    });
  }
});

/**
 * FINDING — MATRIX-masonry-1.
 *
 * docs/ai/components/masonry.md declares
 *
 *     minColumnWidth: string = '250px';  // attr: min-column-width, ...
 *
 * and the auto-columns example is written entirely in that attribute:
 *
 *     <snice-masonry columns="0" min-column-width="300px"> ... </snice-masonry>
 *
 * The property is declared as a bare `@property()`, whose derived attribute
 * name is the lowercased PROPERTY name — `mincolumnwidth`, not the documented
 * kebab-case `min-column-width` (packages/core/src/utils.ts getAttrName: kebab
 * naming needs `attribute: true` or an explicit string). So the documented
 * attribute is inert: `--masonry-column-width` keeps its 250px default and the
 * documented auto layout silently uses the wrong column width.
 *
 * The assertion below is the documented one and stays that way.
 */
describe('masonry matrix / min-column-width attribute', () => {
  for (const width of ['150px', '300px', '20rem']) {
    it.fails(`MATRIX-masonry-1: min-column-width="${width}" reaches the layout`, async () => {
      el = await mountMasonryMinWidthAttribute(width);
      const problems = new Problems();
      checkColumnWidth(problems, el, width);
      expectClean(problems, `min-column-width=${width}`);
    });
  }
});

describe('masonry matrix / defaults', () => {
  it('an unconfigured masonry publishes the documented defaults', async () => {
    el = await mountMasonry({ ...DEFAULTS }, 3);
    const problems = new Problems();
    // Mounting with the documented defaults must be indistinguishable from
    // mounting with nothing at all — that is what "= 3" / "= '1rem'" mean.
    checkLayoutVariables(problems, el, DEFAULTS);
    expectClean(problems, 'defaults');
  });
});
