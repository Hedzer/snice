/**
 * MATRIX slice — snice-color-display: which blocks exist, and how big.
 *
 * Dimensions (docs/ai/components/color-display.md):
 *   showSwatch (2) x showLabel (2) x swatchSize (3) x channel (2) = 24 combos
 *
 * These are the axes that ADD or REMOVE documented parts, which is the one
 * thing a layout-free DOM can judge about them:
 *
 *   · "Show color swatch" / "Show color label" — `part="swatch"` and
 *     `part="label"` exist exactly when their flag is true, including the
 *     `show-swatch="false"` / `show-label="false"` spellings both doc versions
 *     use in their "Swatch Only" and "Label Only" examples.
 *   · "Swatch size" — a pure style axis. Its observable DOM contract is the
 *     attribute (what `:host([swatch-size=…])` selects on) plus the swatch's
 *     own size class; the actual pixel dimensions belong to the visual tier.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, unmountAll } from '../matrix-utils';
import {
  SWATCH_SIZES, CHANNELS,
  combo, mountColorDisplay, expectedShape, readShape, expectedAxes, readAxes,
  partNames, type ColorDisplayCombo,
} from './color-display-support';
import '../../../packages/components/src/color-display/snice-color-display';

const COMBOS: ColorDisplayCombo[] = product({
  showSwatch: [true, false],
  showLabel: [true, false],
  swatchSize: SWATCH_SIZES,
  channel: CHANNELS,
}).map(axes => combo(axes));

const id = (c: ColorDisplayCombo) =>
  `${c.showSwatch ? 'swatch' : 'no-swatch'}/${c.showLabel ? 'label' : 'no-label'}`
  + `/${c.swatchSize}/${c.channel}`;

afterEach(() => { unmountAll(); });

describe(`color-display matrix: visibility x swatch size (${COMBOS.length} combos)`, () => {
  for (const c of COMBOS) {
    it(id(c), async () => {
      const el = await mountColorDisplay(c);
      expectShape(readShape(el), expectedShape(c), `shape ${id(c)}`);
      expectShape(readAxes(el), expectedAxes(c), `axes ${id(c)}`);

      // The parts the docs list, present exactly when their flag says so.
      // `container` is listed unconditionally and no property removes it.
      const expectedParts = ['container',
        ...(c.showSwatch ? ['swatch'] : []),
        ...(c.showLabel ? ['label'] : [])].sort();
      expect(partNames(el).sort(), `parts ${id(c)}`).toEqual(expectedParts);
    });
  }
});

/**
 * The two named examples from docs/components/color-display.md, spelled exactly
 * as the docs spell them. They are already inside the cross above; asserting
 * them by name is what makes a regression report the DOC that broke.
 */
describe('color-display matrix: the documented usage examples', () => {
  it('"Swatch Only": show-label="false" leaves a swatch and no label', async () => {
    const el = await mountColorDisplay(combo({
      value: '#3b82f6', showLabel: false, swatchSize: 'large', channel: 'attr',
    }));
    expect(partNames(el).sort()).toEqual(['container', 'swatch']);
    expect((el as any).showLabel).toBe(false);
    expect((el as any).showSwatch).toBe(true);
  });

  it('"Label Only": show-swatch="false" leaves a formatted label and no swatch', async () => {
    const el = await mountColorDisplay(combo({
      value: '#3b82f6', showSwatch: false, format: 'rgb', channel: 'attr',
    }));
    expect(partNames(el).sort()).toEqual(['container', 'label']);
    expect(readShape(el).labelText).toBe('rgb(59, 130, 246)');
  });

  it('both flags false still renders the documented container', async () => {
    const el = await mountColorDisplay(combo({ showSwatch: false, showLabel: false }));
    expect(partNames(el)).toEqual(['container']);
  });
});
