/**
 * snice-gauge matrix — the PRESENTATION slice.
 *
 * Crosses the six documented variants against the three sizes and two stroke
 * thicknesses: 6 x 3 x 2 = 36 combos. Presentation must never disturb the
 * meter contract, so each combo still runs the FULL oracle — a variant that
 * dropped the value text or a size that broke the arc would fail here, not
 * only in the range slice.
 *
 * The stylesheet selects on `:host([variant=…])` and `:host([size=…])`, so the
 * reflected host attributes are the DOM-visible half of "the variant applied";
 * the painted colour itself belongs to the visual tier
 * (tests/live/matrix/gauge-*.spec.ts).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { combo, mountGauge, gaugeProblems, type GaugeCombo } from './gauge-support';
import type { GaugeVariant, GaugeSize } from '../../../packages/components/src/gauge/snice-gauge.types';

const VARIANTS: GaugeVariant[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES: GaugeSize[] = ['small', 'medium', 'large'];
const THICKNESSES = [8, 12];

function presentationCombos(): GaugeCombo[] {
  const combos: GaugeCombo[] = [];
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const thickness of THICKNESSES) {
        combos.push(combo(`${variant} / ${size} / thickness ${thickness}`, {
          variant,
          size,
          thickness,
          // A representative loaded meter: non-trivial fill, both text parts on,
          // so a presentation combo cannot pass by rendering nothing.
          value: 65,
          label: 'Load',
        }));
      }
    }
  }
  return combos;
}

let gauge: any;
afterEach(() => { if (gauge) { removeComponent(gauge); gauge = null; } });

describe('gauge matrix: variant x size x thickness', () => {
  const combos = presentationCombos();

  it('enumerates the full cross', () => {
    expect(combos).toHaveLength(VARIANTS.length * SIZES.length * THICKNESSES.length);
    expect(new Set(combos.map(c => c.id)).size).toBe(combos.length);
  });

  for (const c of combos) {
    it(c.id, async () => {
      gauge = await mountGauge(c);
      expect(gaugeProblems(gauge, c), `combo ${c.id}`).toEqual([]);
    });
  }
});

describe('gauge matrix: presentation changes in place', () => {
  it('switching variant and size keeps the meter contract intact', async () => {
    const start = combo('swap', { value: 65, label: 'Load' });
    gauge = await mountGauge(start);

    const problems: string[] = [];
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const next: GaugeCombo = { ...start, variant, size, id: `swap → ${variant}/${size}` };
        gauge.variant = variant;
        gauge.size = size;
        await new Promise(resolve => setTimeout(resolve, 20));
        problems.push(...gaugeProblems(gauge, next).map(p => `${next.id}: ${p}`));
      }
    }
    expect(problems).toEqual([]);
  });

  it('thickness drives both arcs together', async () => {
    const start = combo('thickness-walk', { value: 40, thickness: 8 });
    gauge = await mountGauge(start);

    const problems: string[] = [];
    for (const thickness of [1, 8, 12, 24]) {
      const next: GaugeCombo = { ...start, thickness, id: `thickness-walk → ${thickness}` };
      gauge.thickness = thickness;
      await new Promise(resolve => setTimeout(resolve, 20));
      problems.push(...gaugeProblems(gauge, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });
});
