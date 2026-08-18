/**
 * snice-split-pane matrix — structure, sizing and divider semantics.
 *
 * The cross: `direction` (2) x `primarySize` (4) x `disabled` (2) x `snapSize`
 * (2) = 32 combos, with the two documented minimums rotated across them so both
 * are exercised at every direction without multiplying the product (their
 * arithmetic is the subject of clamping.test.ts, which crosses them properly).
 *
 * Every combo is judged by the same oracle, and reports EVERY violation at once
 * — see tests/matrix/split-pane/split-pane-support.ts for where each
 * expectation comes from.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, checkDirectionAttribute, checkDivider, checkGetters, checkSizing,
  checkSlotted, checkStructure,
  mount, mountDefaults, mountSplitPane, mountSplitPaneByProperty, type Direction, type Vector,
} from './split-pane-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/** The two minimums, rotated across the product rather than crossed into it. */
const MIN_PAIRS: Array<[number, number]> = [[10, 10], [25, 25], [0, 40], [40, 0]];

const combos = cross({
  direction: ['horizontal', 'vertical'] as const,
  primarySize: [10, 30, 50, 80],
  disabled: [false, true],
  snapSize: [0, 10],
}).map((combo, index): Vector & { id: string } => {
  const [minPrimarySize, minSecondarySize] = MIN_PAIRS[index % MIN_PAIRS.length];
  return {
    ...combo,
    direction: combo.direction as Direction,
    minPrimarySize,
    minSecondarySize,
    id: `${combo.id}/[min:${minPrimarySize}+${minSecondarySize}]`,
  };
});

describe('split-pane matrix: structure, sizing, divider', () => {
  for (const vector of combos) {
    it(vector.id, async () => {
      el = await mountSplitPane(vector);
      const problems = new Problems();

      checkStructure(problems, el);
      checkSizing(problems, el, vector);
      checkDirectionAttribute(problems, el, vector.direction);
      checkDivider(problems, el, vector);
      checkGetters(problems, el, vector);
      checkSlotted(problems, el);

      expectClean(problems, vector.id);
    });
  }
});

describe('split-pane matrix: the property channel agrees with the attribute channel', () => {
  // Arrays and objects have no attribute form, but every documented property
  // here does — so the two channels must produce the same component. The
  // `direction` attribute is judged separately below, because its default value
  // is a standing finding that would otherwise poison every row here.
  for (const vector of combos.filter((_, index) => index % 4 === 0)) {
    it(`by property: ${vector.id}`, async () => {
      el = await mountSplitPaneByProperty(vector);
      const problems = new Problems();

      checkStructure(problems, el);
      checkSizing(problems, el, vector);
      checkDivider(problems, el, vector);
      checkGetters(problems, el, vector);

      expectClean(problems, `by-property/${vector.id}`);
    });
  }
});

/**
 * MATRIX-split-pane-3 (fixed)
 *
 * Combo:    `<snice-split-pane>` — i.e. the documented default
 *           `direction: 'horizontal'`, whatever channel it arrives by, as long
 *           as nobody assigns a value DIFFERENT from the default.
 * Expected: the host carries `direction="horizontal"`. The stylesheet routes
 *           the whole documented meaning of `direction` through
 *           `:host([direction="horizontal"])` and `:host([direction="vertical"])`
 *           — `flex-direction`, the divider's `width`/`height` and its
 *           `col-resize`/`row-resize` cursor, and the handle's dimensions — so
 *           the attribute is the only way the documented default can reach the
 *           layout.
 * Fixed:    the component reflects the effective default once at ready (unless
 *           the author set the attribute), so the default reaches the rules
 *           that size the divider on every channel.
 */
describe('split-pane matrix: direction reaches the rules that size the divider', () => {
  for (const direction of ['horizontal', 'vertical'] as const) {
    it(`by attribute: direction=${direction}`, async () => {
      el = await mountSplitPane({ ...DEFAULTS, direction });
      const problems = new Problems();
      checkDirectionAttribute(problems, el, direction);
      expectClean(problems, `attribute/${direction}`);
    });
  }

  it('by property: direction=vertical', async () => {
    el = await mountSplitPaneByProperty({ ...DEFAULTS, direction: 'vertical' });
    const problems = new Problems();
    checkDirectionAttribute(problems, el, 'vertical');
    expectClean(problems, 'property/vertical');
  });

  it('MATRIX-split-pane-3 (fixed): by property: direction=horizontal', async () => {
    el = await mountSplitPaneByProperty({ ...DEFAULTS, direction: 'horizontal' });
    const problems = new Problems();
    checkDirectionAttribute(problems, el, 'horizontal');
    expectClean(problems, 'property/horizontal');
  });

  it('MATRIX-split-pane-3 (fixed): <snice-split-pane> with no direction authored', async () => {
    el = await mountDefaults();
    const problems = new Problems();
    checkDirectionAttribute(problems, el, DEFAULTS.direction);
    expectClean(problems, 'defaults/direction-attribute');
  });
});

describe('split-pane matrix: the documented defaults', () => {
  it('<snice-split-pane> alone is a 50/50 horizontal split', async () => {
    el = await mountDefaults();
    const problems = new Problems();
    const pane = el as any;

    problems.equal(pane.direction, DEFAULTS.direction, 'default direction');
    problems.equal(pane.primarySize, DEFAULTS.primarySize, 'default primarySize');
    problems.equal(pane.minPrimarySize, DEFAULTS.minPrimarySize, 'default minPrimarySize');
    problems.equal(pane.minSecondarySize, DEFAULTS.minSecondarySize, 'default minSecondarySize');
    problems.equal(pane.snapSize, DEFAULTS.snapSize, 'default snapSize');
    problems.equal(pane.disabled, DEFAULTS.disabled, 'default disabled');

    checkStructure(problems, el);
    checkSizing(problems, el, { ...DEFAULTS });
    checkDivider(problems, el, { ...DEFAULTS });
    checkGetters(problems, el, { ...DEFAULTS });
    checkSlotted(problems, el);

    expectClean(problems, 'defaults');
  });

  it('a split pane with nothing slotted still renders both panes and the divider', async () => {
    el = await mount('snice-split-pane');
    const problems = new Problems();
    checkStructure(problems, el);
    checkSizing(problems, el, { ...DEFAULTS });
    checkDivider(problems, el, { ...DEFAULTS });
    expectClean(problems, 'no-content');
  });
});
