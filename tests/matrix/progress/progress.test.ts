/**
 * snice-progress matrix.
 *
 * SIZING. The centre is variant x value-case x indeterminate (2 x 8 x 2 = 32):
 * the two variants paint the SAME number in different units, the value cases
 * are the edges of the documented "(0-100)" range, and `indeterminate` is the
 * mode that suspends the number entirely. The label, style-flag, size and event
 * slices are small crosses on top, because none of them interacts with the
 * others — a striped bar computes its percentage exactly like a plain one.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, comboId, expectShape, settle, finding } from '../matrix-utils';
import {
  VARIANTS, SIZES, SEMANTIC_COLORS, VALUE_CASES, expectedShape, readShape,
  expectedPercentage, readFillPercentage, expectedLabelText, labelText,
  ringBox, ringRadius, recordChanges, expectedChangeDetail, readChangeDetail,
  type ProgressCombo,
} from './progress-support';

afterEach(unmountAll);

/** Mount a combo the way an author writes one. */
async function mountProgress(combo: ProgressCombo) {
  return mount<any>('snice-progress', {
    variant: combo.variant,
    value: combo.useCase.value,
    max: combo.useCase.max,
    ...(combo.indeterminate ? { indeterminate: true } : {}),
    ...(combo.showLabel ? { 'show-label': true } : {}),
    ...(combo.label ? { label: combo.label } : {}),
  });
}

describe('progress matrix: variant x value x indeterminate', () => {
  for (const combo of product({
    variant: VARIANTS, useCase: VALUE_CASES, indeterminate: [false, true],
  })) {
    const label = `${combo.variant}/${combo.useCase.id}${combo.indeterminate ? '/indeterminate' : ''}`;
    it(label, async () => {
      const el = await mountProgress(combo);

      expectShape(readShape(el), expectedShape(combo), label);
      expect(el.getPercentage(), `${label}: getPercentage()`)
        .toBeCloseTo(expectedPercentage(combo), 6);

      const painted = readFillPercentage(el, combo.variant);
      if (combo.indeterminate) {
        // DOCUMENTED: an indeterminate bar has no determinate fill to paint —
        // the linear bar drops its width entirely, and the ring is not offset.
        if (combo.variant === 'linear') {
          expect(painted, `${label}: an indeterminate bar painted a width`).toBe(null);
        } else {
          expect(painted, `${label}: an indeterminate ring painted a fill`).toBeCloseTo(100, 6);
        }
      } else {
        expect(painted, `${label}: painted fill`).toBeCloseTo(expectedPercentage(combo), 4);
      }
    });
  }
});

describe('progress matrix: the label', () => {
  for (const combo of product({
    variant: VARIANTS, showLabel: [false, true], custom: [false, true],
    indeterminate: [false, true],
  })) {
    const label = comboId(combo);
    // FINDING MATRIX-progress-1. A circular INDETERMINATE bar with `show-label`
    // renders no `label` part at all — including when the author supplied
    // custom label text. The docs list `label` as a part of the circular
    // variant with no exception, give `show-label` as the switch that shows it,
    // and the linear variant does show it in exactly this state. The assertion
    // below is the documented one and is NOT weakened.
    const isFinding = combo.variant === 'circular' && combo.showLabel && combo.indeterminate;
    const run = async () => {
      const useCase = VALUE_CASES.find(c => c.id === 'half')!;
      const full: ProgressCombo = {
        variant: combo.variant,
        useCase,
        indeterminate: combo.indeterminate,
        showLabel: combo.showLabel,
        label: combo.custom ? 'Uploading' : '',
      };
      const el = await mountProgress(full);

      // DOCUMENTED: "Label text used as `aria-label`" — always, whether or not
      // the label is SHOWN.
      expectShape(readShape(el), expectedShape(full), label);

      const shown = labelText(el);
      if (combo.showLabel) {
        expect(shown, `${label}: the label part is missing`).not.toBe(null);
        expect(shown, `${label}: label text`).toBe(expectedLabelText(full));
      } else {
        expect(shown, `${label}: a label rendered without show-label`).toBe(null);
      }
    };

    if (isFinding) {
      it.fails(finding('MATRIX-progress-1',
        `${label}: an indeterminate circular bar renders no label part despite show-label`), run);
    } else {
      it(label, run);
    }
  }
});

describe('progress matrix: style flags reach the paint', () => {
  for (const combo of product({ striped: [false, true], animated: [false, true] })) {
    const label = comboId(combo);
    it(label, async () => {
      // DOCUMENTED ("Basic Usage"): `<snice-progress value="70" striped animated>`.
      // The stylesheet keys off the host attributes, which is the only
      // DOM-visible half of a purely animated style.
      const el = await mount('snice-progress', {
        value: 70,
        ...(combo.striped ? { striped: true } : {}),
        ...(combo.animated ? { animated: true } : {}),
      });
      expect({
        striped: el.hasAttribute('striped'),
        animated: el.hasAttribute('animated'),
      }, label).toEqual(combo);
    });
  }
});

describe('progress matrix: size and thickness (circular)', () => {
  it('the documented size scale grows the ring at every step', async () => {
    const boxes: number[] = [];
    for (const size of SIZES) {
      const el = await mount('snice-progress', { variant: 'circular', size, value: 50 });
      boxes.push(ringBox(el));
    }
    // The docs give no pixel table, so the assertion is the ordering the scale
    // means: each step strictly larger, none of them zero.
    expect(boxes.every(v => v > 0), `boxes ${boxes}`).toBe(true);
    expect([...boxes].sort((a, b) => a - b), `boxes ${boxes}`).toEqual(boxes);
    expect(new Set(boxes).size, `boxes ${boxes} are not distinct`).toBe(SIZES.length);
  });

  for (const size of SIZES) {
    it(`${size}: a thicker stroke leaves a smaller radius`, async () => {
      // DOCUMENTED: "`thickness: number = 4;  // Circular stroke width`".
      const thin = await mount('snice-progress', { variant: 'circular', size, thickness: 2, value: 50 });
      const thick = await mount('snice-progress', { variant: 'circular', size, thickness: 10, value: 50 });
      expect(ringRadius(thick), `${size}: thin=${ringRadius(thin)}`)
        .toBeLessThan(ringRadius(thin));
      // …and the fill still means the same thing at either thickness.
      expect(readFillPercentage(thick, 'circular')).toBeCloseTo(50, 4);
    });
  }
});

describe('progress matrix: colour', () => {
  for (const color of SEMANTIC_COLORS) {
    it(`${color}: a semantic colour is left to the stylesheet`, async () => {
      const el = await mount('snice-progress', { value: 50, color });
      expect(el.getAttribute('color'), color).toBe(color);
      expect(el.style.getPropertyValue('--progress-color'),
        'a semantic colour must not be pinned inline').toBe('');
    });
  }

  it('a custom colour is applied through the documented custom property', async () => {
    // DOCUMENTED ("Properties" + "CSS Custom Properties"): `color` accepts any
    // string, and `--progress-color` is the property the paint reads.
    const el = await mount('snice-progress', { value: 50, color: 'rgb(220, 38, 38)' });
    await settle(el, 10);
    expect(el.style.getPropertyValue('--progress-color')).toBe('rgb(220, 38, 38)');
  });
});

describe('progress matrix: progress-change', () => {
  for (const source of ['value', 'max', 'indeterminate', 'setProgress'] as const) {
    it(`${source} change emits the documented detail`, async () => {
      const el = await mount<any>('snice-progress', { value: 20, max: 100 });
      const details = recordChanges(el);

      const expected: ProgressCombo = {
        variant: 'linear',
        useCase: { id: 'x', value: 20, max: 100, percentage: 20 },
        indeterminate: false,
      };

      if (source === 'value') {
        el.value = 60;
        expected.useCase = { id: 'x', value: 60, max: 100, percentage: 60 };
      } else if (source === 'max') {
        el.max = 200;
        expected.useCase = { id: 'x', value: 20, max: 200, percentage: 10 };
      } else if (source === 'indeterminate') {
        el.indeterminate = true;
        expected.indeterminate = true;
      } else {
        // DOCUMENTED ("Methods"): "`setProgress(value, max?)` - Set progress value".
        el.setProgress(75, 150);
        expected.useCase = { id: 'x', value: 75, max: 150, percentage: 50 };
      }
      await settle(el, 20);

      expect(details.length, `${source}: one event per change`).toBeGreaterThanOrEqual(1);
      expectShape(
        readChangeDetail(details[details.length - 1]),
        expectedChangeDetail(expected),
        source,
      );
      expect(el.getPercentage()).toBeCloseTo(expectedPercentage(expected), 6);
    });
  }

  it('setProgress without a max keeps the authored max', async () => {
    const el = await mount<any>('snice-progress', { value: 10, max: 50 });
    el.setProgress(25);
    await settle(el, 10);
    expect({ value: el.value, max: el.max, percentage: el.getPercentage() })
      .toEqual({ value: 25, max: 50, percentage: 50 });
  });
});
