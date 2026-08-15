/**
 * Smoke slice of the snice-gauge matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full gauge cross runs only via `npm run test:matrix`.
 * This file lives at `smoke.test.ts` so it stays collected, and it pays for
 * the marquee combos only:
 *
 *   · the three arc endpoints (empty / half / full) — if the dash-offset maths
 *     regresses, one of these moves;
 *   · both clamp directions — the only place `value` and the painted arc are
 *     allowed to disagree;
 *   · a zero-width range — the divide-by-zero guard;
 *   · both text switches off — the two `<if>` branches in the template;
 *   · one non-default variant/size, because those reflect to the host and the
 *     stylesheet has nothing to select on if they stop.
 *
 * Every assertion routes through the matrix's own oracle (`gaugeProblems`), so
 * this file cannot drift into asserting something weaker than the suite it
 * stands in for. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import { combo, mountGauge, gaugeProblems, type GaugeCombo } from './gauge-support';

const MARQUEE: GaugeCombo[] = [
  combo('empty arc', { value: 0, label: 'Idle' }),
  combo('half arc', { value: 50, label: 'Half' }),
  combo('full arc', { value: 100, label: 'Full' }),
  combo('clamps below min', { value: -20, min: 0, max: 100 }),
  combo('clamps above max', { value: 500, min: 0, max: 100 }),
  combo('zero-width range', { value: 50, min: 50, max: 50 }),
  combo('no value text', { value: 40, showValue: false, label: 'Quiet' }),
  combo('no label', { value: 40, label: '' }),
  combo('variant + size reflect', { value: 90, variant: 'error', size: 'large', label: 'Critical' }),
];

let gauge: any;
afterEach(() => { if (gauge) { removeComponent(gauge); gauge = null; } });

describe('gauge matrix smoke', () => {
  for (const c of MARQUEE) {
    it(c.id, async () => {
      gauge = await mountGauge(c);
      expect(gaugeProblems(gauge, c), `combo ${c.id}`).toEqual([]);
    });
  }
});
