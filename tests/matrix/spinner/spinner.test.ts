/**
 * snice-spinner matrix.
 *
 * SIZING. A spinner is the smallest kind of component there is — five loader
 * shapes and a caption — so per .ai/fuzzing.md this matrix is deliberately
 * tiny: 20 combos for variant x size, plus a handful for the caption, the
 * colour hook and `thickness`. The reason `size` is CROSSED rather than
 * sampled is that it is not a class-only axis here: each variant renders its
 * own geometry (a viewBox, a `--dot-size`, a `--bar-height`), so "does the size
 * reach this variant's geometry" is a different question per variant.
 *
 * Everything about the ANIMATION — which is most of what a spinner is — lives
 * in tests/live/matrix/spinner, because happy-dom paints nothing.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, comboId, expectShape } from '../matrix-utils';
import {
  SIZES, COLORS, VARIANTS, expectedShape, readShape, renderedSize, arcRadius,
  type Variant,
} from './spinner-support';

afterEach(unmountAll);

describe('spinner matrix: variant x size', () => {
  const combos = product({ variant: VARIANTS, size: SIZES });
  combos.forEach((base, index) => {
    // Colour and caption are rotated across the cross: both are single
    // attributes with no interaction, so crossing them would be 8x the tests
    // for the same fact.
    const combo = {
      ...base,
      color: COLORS[index % COLORS.length],
      label: index % 2 === 0 ? 'Loading…' : '',
    };
    const label = comboId(combo);
    it(label, async () => {
      const el = await mount('snice-spinner', {
        variant: combo.variant,
        size: combo.size,
        color: combo.color,
        ...(combo.label ? { label: combo.label } : {}),
      });

      expectShape(readShape(el), expectedShape(combo), label);
      // The colour is a style axis whose only DOM-visible half is the attribute
      // the stylesheet selects on.
      expect(el.getAttribute('color'), `${label}: colour hook`).toBe(combo.color);
    });
  });
});

describe('spinner matrix: the documented size scale', () => {
  for (const variant of VARIANTS) {
    it(`${variant}: small < medium < large < xl`, async () => {
      const sizes: number[] = [];
      for (const size of SIZES) {
        const el = await mount('snice-spinner', { variant, size });
        sizes.push(renderedSize(el, variant as Variant));
      }
      // DOCUMENTED ("Properties"): `size: 'small'|'medium'|'large'|'xl'`. The
      // docs give no pixel table, so the assertion is the ordering the scale
      // means — each step is strictly larger, and none of them is zero.
      expect(sizes.every(value => value > 0), `${variant}: sizes ${sizes}`).toBe(true);
      expect([...sizes].sort((a, b) => a - b), `${variant}: sizes ${sizes}`).toEqual(sizes);
      expect(new Set(sizes).size, `${variant}: sizes ${sizes} are not distinct`).toBe(SIZES.length);
    });
  }
});

describe('spinner matrix: the caption', () => {
  it('the label is the only caption path — slotted text never renders', async () => {
    // DOCUMENTED ("Properties"): "`label` … the only caption path; stray
    // slotted text never renders."
    const el = await mount('snice-spinner', {}, 'stray text');
    const shape = readShape(el) as any;
    expect(shape.hasSlot, 'the shadow tree offers a slot for stray content').toBe(false);
    expect(shape.hasLabelPart).toBe(false);
  });

  it('an authored label renders as the label part and the announcement', async () => {
    const el = await mount('snice-spinner', { label: 'Saving…' });
    expectShape(readShape(el), expectedShape({
      variant: 'arc', size: 'medium', color: 'primary', label: 'Saving…',
    }), 'labelled');
  });

  it('an unlabelled spinner still announces something', async () => {
    // DOCUMENTED ("Accessibility"): "`role="status"` with `aria-label`" — the
    // announcement is unconditional even though its text is not specified.
    const el = await mount('snice-spinner', {});
    expectShape(readShape(el), { role: 'status', ariaLabelled: true }, 'unlabelled');
  });
});

describe('spinner matrix: thickness applies to the arc only', () => {
  for (const thickness of [2, 4, 8]) {
    it(`arc thickness=${thickness}`, async () => {
      const el = await mount('snice-spinner', { variant: 'arc', thickness });
      expect(arcRadius(el), `thickness=${thickness} produced no arc`).toBeGreaterThan(0);
    });
  }

  it('a thicker arc leaves a smaller radius inside the same box', async () => {
    // DOCUMENTED: "`thickness: number = 4;  // only applies to arc variant`".
    // The stroke is drawn on the circle, so a thicker stroke in a fixed box
    // means a smaller radius — the only DOM-visible consequence.
    const thin = arcRadius(await mount('snice-spinner', { variant: 'arc', thickness: 2 }));
    const thick = arcRadius(await mount('snice-spinner', { variant: 'arc', thickness: 8 }));
    expect(thick, `thin r=${thin}, thick r=${thick}`).toBeLessThan(thin);
  });

  for (const variant of VARIANTS.filter(v => v !== 'arc')) {
    it(`${variant} ignores thickness`, async () => {
      const base = await mount('snice-spinner', { variant, thickness: 4 });
      const thick = await mount('snice-spinner', { variant, thickness: 12 });
      expect(thick.shadowRoot!.innerHTML, `${variant} rendered differently for a new thickness`)
        .toBe(base.shadowRoot!.innerHTML);
    });
  }
});
