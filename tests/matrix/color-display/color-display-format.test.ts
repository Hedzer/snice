/**
 * MATRIX slice — snice-color-display: the `format` x `label` x `value` cross.
 *
 * Dimensions (docs/ai/components/color-display.md):
 *   value (3 documented hex colours) x format (3) x label (custom / none)
 *   x channel (2) = 36 combos
 *
 * This is the slice where the component's ONE piece of logic lives: "Display
 * format" turning a hex `value` into the notation the label reads, and "Custom
 * label text ... instead of the color value" overriding it. The three colours
 * are chosen so the hsl conversion runs all of its branches (max = r, max = g,
 * and the achromatic grey where saturation is zero).
 *
 * `channel` is a real axis rather than a convenience: the stylesheet keys off
 * `:host([swatch-size=…])`, so an authored attribute and a post-connect
 * property assignment are two different paths into the same state and only one
 * of them is what CSS can see.
 *
 * Sizing per .ai/fuzzing.md: a display-only component with six properties gets
 * tens of combos. `showSwatch`/`showLabel`/`swatchSize` are crossed in
 * color-display-visibility.test.ts instead of being multiplied in here — they
 * add no new label text, so folding them in would multiply the count by twelve
 * without reaching one new rendering path.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, unmountAll } from '../matrix-utils';
import {
  COLORS, FORMATS, CHANNELS, CUSTOM_LABEL,
  combo, mountColorDisplay, expectedShape, readShape, expectedAxes, readAxes,
  expectedLabelText, formatted, asRgb, asHsl, partNames,
  type ColorDisplayCombo,
} from './color-display-support';
import '../../../packages/components/src/color-display/snice-color-display';

const COMBOS: ColorDisplayCombo[] = product({
  value: COLORS,
  format: FORMATS,
  label: ['', CUSTOM_LABEL],
  channel: CHANNELS,
}).map(axes => combo(axes));

const id = (c: ColorDisplayCombo) =>
  `${c.value}/${c.format}/${c.label ? 'custom-label' : 'value-label'}/${c.channel}`;

afterEach(() => { unmountAll(); });

describe(`color-display matrix: format x label (${COMBOS.length} combos)`, () => {
  for (const c of COMBOS) {
    it(id(c), async () => {
      const el = await mountColorDisplay(c);
      expectShape(readShape(el), expectedShape(c), `shape ${id(c)}`);
      expectShape(readAxes(el), expectedAxes(c), `axes ${id(c)}`);
      // Every documented part is present in a combo that shows both blocks.
      expect(partNames(el).sort(), `parts ${id(c)}`)
        .toEqual(['container', 'label', 'swatch']);
    });
  }
});

/**
 * The notation table itself, asserted once and directly, so the conversion
 * contract is legible without reading the oracle. These are the documented
 * examples' colour (`#3b82f6`) plus the two the matrix crosses.
 */
describe('color-display matrix: the documented notations', () => {
  const CASES: Array<[string, string, string]> = [
    // hex             rgb                      hsl
    ['#3b82f6', 'rgb(59, 130, 246)', 'hsl(217, 91%, 60%)'],
    ['#10b981', 'rgb(16, 185, 129)', 'hsl(160, 84%, 39%)'],
    ['#808080', 'rgb(128, 128, 128)', 'hsl(0, 0%, 50%)'],
  ];

  for (const [hex, rgb, hsl] of CASES) {
    it(`${hex} reads as itself, as ${rgb}, and as ${hsl}`, async () => {
      expect(asRgb(hex)).toBe(rgb);
      expect(asHsl(hex)).toBe(hsl);
      for (const [format, expected] of [['hex', hex], ['rgb', rgb], ['hsl', hsl]] as const) {
        const el = await mountColorDisplay(combo({ value: hex, format }));
        expect(readShape(el).labelText, `${hex} as ${format}`).toBe(expected);
        expect(formatted(hex, format)).toBe(expected);
      }
    });
  }
});

/**
 * The documented defaults, mounted with nothing authored at all: `value = ''`,
 * `format = 'hex'`, both blocks shown, medium swatch, no custom label. An empty
 * value has no notation, so the label has nothing to read.
 */
describe('color-display matrix: the documented default vector', () => {
  it('renders both parts, an empty label, and reflects no style attribute', async () => {
    const el = await mountColorDisplay(combo({ value: '', channel: 'prop' }));
    expectShape(readShape(el), {
      hasContainer: true,
      hasSwatch: true,
      hasLabel: true,
      labelText: '',
      swatchSizeClass: 'color-swatch--medium',
      swatchPaints: '',
    }, 'default vector shape');
    // Defaults are never reflected (docs/ai/properties.md), so a component
    // mounted at its defaults carries no style attributes for CSS to key off.
    expect(el.getAttribute('format')).toBeNull();
    expect(el.getAttribute('swatch-size')).toBeNull();
    expect(el.getAttribute('show-swatch')).toBeNull();
    expect(el.getAttribute('show-label')).toBeNull();
  });

  it('a custom label survives an empty value', async () => {
    const c = combo({ value: '', label: CUSTOM_LABEL });
    const el = await mountColorDisplay(c);
    expect(expectedLabelText(c)).toBe(CUSTOM_LABEL);
    expect(readShape(el).labelText).toBe(CUSTOM_LABEL);
  });
});
