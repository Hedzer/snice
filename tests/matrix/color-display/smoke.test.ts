/**
 * Smoke slice of the snice-color-display matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the 60-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family — the notation conversion, the custom-label
 * override, the two visibility flags, and the swatch-size style axis — each
 * routed through the matrix's own oracle so this file cannot drift into
 * asserting something weaker than the suite it stands in for.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, unmountAll } from '../matrix-utils';
import {
  combo, mountColorDisplay, expectedShape, readShape, expectedAxes, readAxes,
  partNames,
} from './color-display-support';
import '../../../packages/components/src/color-display/snice-color-display';

afterEach(() => { unmountAll(); });

describe('color-display matrix smoke', () => {
  it('format=hsl renders the same colour in hsl notation', async () => {
    const c = combo({ value: '#3b82f6', format: 'hsl' });
    const el = await mountColorDisplay(c);
    expect(readShape(el).labelText).toBe('hsl(217, 91%, 60%)');
    expectShape(readShape(el), expectedShape(c), 'smoke/hsl');
  });

  it('a custom label replaces the formatted value', async () => {
    const c = combo({ value: '#ef4444', label: 'Error Red', format: 'rgb' });
    const el = await mountColorDisplay(c);
    expect(readShape(el).labelText).toBe('Error Red');
    expectShape(readShape(el), expectedShape(c), 'smoke/custom-label');
  });

  it('show-swatch="false" and show-label="false" each drop their own part', async () => {
    const noSwatch = await mountColorDisplay(combo({ showSwatch: false }));
    expect(partNames(noSwatch).sort()).toEqual(['container', 'label']);
    unmountAll();
    const noLabel = await mountColorDisplay(combo({ showLabel: false }));
    expect(partNames(noLabel).sort()).toEqual(['container', 'swatch']);
  });

  it('swatch-size reaches both the attribute CSS sees and the swatch class', async () => {
    const c = combo({ swatchSize: 'large', channel: 'prop' });
    const el = await mountColorDisplay(c);
    expect(el.getAttribute('swatch-size')).toBe('large');
    expectShape(readShape(el), expectedShape(c), 'smoke/swatch-size');
    expectShape(readAxes(el), expectedAxes(c), 'smoke/swatch-size axes');
  });
});
