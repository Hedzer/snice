/**
 * MATRIX slice — snice-qr-code SVG symbol.
 *
 * Dimensions (docs/ai/components/qr-code.md):
 *   value (short, long) x error-correction-level (4) x margin (0, 4) x
 *   colours (default, custom) = 32 combos
 *
 * Crossed rather than sampled because the axes really interact: the payload and
 * the error-correction level together decide the symbol VERSION (how many
 * modules), and `margin` then wraps that version in a quiet zone — so the
 * viewBox is only right when all three agree. The colours ride along to prove
 * `fg-color` / `bg-color` reach the two rects the symbol is built from
 * regardless of how big the symbol got.
 *
 * Every assertion is the DOCUMENTED expectation (plus the QR standard's own
 * "21 + 4n modules" and "a higher EC level never needs fewer modules"). No
 * findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, unmountAll } from '../matrix-utils';
import {
  EC_LEVELS, SHORT, LONG, mountQr, svgProblems, svgOf, viewBoxSize,
  type EcLevel, type SvgCombo,
} from './qr-code-support';
import '../../../packages/components/src/qr-code/snice-qr-code';

const PALETTES = [
  { id: 'default', fgColor: '#000000', bgColor: '#ffffff' },
  { id: 'custom', fgColor: '#2196f3', bgColor: '#fff8e1' },
];

const COMBOS: SvgCombo[] = product({
  value: [SHORT, LONG],
  ecLevel: EC_LEVELS,
  margin: [0, 4],
  palette: PALETTES,
}).map(c => ({
  id: `${c.value === SHORT ? 'short' : 'long'}/ec:${c.ecLevel}/margin:${c.margin}/${c.palette.id}`,
  value: c.value,
  ecLevel: c.ecLevel as EcLevel,
  margin: c.margin,
  fgColor: c.palette.fgColor,
  bgColor: c.palette.bgColor,
  size: 200,
}));

describe('qr-code matrix: value x error correction x margin x colours', () => {
  afterEach(() => unmountAll());

  for (const combo of COMBOS) {
    it(`${combo.id}: renders a conforming symbol with the documented colours`, async () => {
      const el = await mountQr({
        value: combo.value,
        size: combo.size,
        'render-mode': 'svg',
        'error-correction-level': combo.ecLevel,
        margin: combo.margin,
        'fg-color': combo.fgColor,
        'bg-color': combo.bgColor,
      });
      expect(svgProblems(el, combo), combo.id).toEqual([]);
    });
  }
});

describe('qr-code matrix: the error-correction levels order as the standard says', () => {
  afterEach(() => unmountAll());

  for (const [label, value] of [['short', SHORT], ['long', LONG]] as const) {
    it(`${label}: L <= M <= Q <= H in module count, and H is strictly larger than L`, async () => {
      const counts: Record<EcLevel, number> = {} as any;
      for (const ecLevel of EC_LEVELS) {
        const el = await mountQr({
          value, 'render-mode': 'svg', 'error-correction-level': ecLevel, margin: 0,
        });
        counts[ecLevel] = viewBoxSize(svgOf(el)) ?? -1;
      }

      const ordered = EC_LEVELS.map(level => counts[level]);
      expect(ordered.every(n => n >= 21), `${label}: module counts ${JSON.stringify(counts)}`)
        .toBe(true);
      for (let i = 1; i < ordered.length; i++) {
        expect(ordered[i], `${label}: ${EC_LEVELS[i]} needs fewer modules than ${EC_LEVELS[i - 1]}`)
          .toBeGreaterThanOrEqual(ordered[i - 1]);
      }
      expect(counts.H, `${label}: H and L produced the same symbol size`)
        .toBeGreaterThan(counts.L);
    });
  }
});
