/**
 * snice-slider matrix — PRESENTATION.
 *
 * `variant` (5) x `size` (3) x `vertical` (2) = 30 combos, taken whole.
 *
 * All three write into the SAME three class strings — the track carries the
 * size, the fill carries the variant, the thumb carries both, and `vertical`
 * adds a modifier to each of them. A component that builds those strings by
 * concatenation gets one of the nine (variant, size) pairs wrong far more
 * easily than it gets all nine right, and the vertical axis doubles the
 * chances. Thirty cheap combos buy the whole surface.
 *
 * The remaining slices cover the presentation switches that are not worth a
 * cross of their own: the label, the value read-out, the tick marks, and the
 * documented precedence between helper text and error text.
 */
import { describe, it, afterAll, afterEach, beforeAll } from 'vitest';
import {
  DEFAULTS, PARTS, SIZES, VARIANTS,
  classesOf, combo, exactPart, exactParts, expect, expectSliderMatches,
  expectedTickCount, installInternalsMock, labelOf, makeSlider, renderedSupport,
  restoreInternalsMock, teardown, textOf, thumbOf, ticksOf, valueLabelOf, wait,
} from './slider-support';

describe('snice-slider matrix — presentation', () => {
  beforeAll(() => installInternalsMock());
  afterAll(() => restoreInternalsMock());
  afterEach(teardown);

  // ── variant x size x vertical ────────────────────────────────────────────
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const vertical of [false, true]) {
        const c = combo({ variant, size, vertical, value: 50 });
        it(`renders the documented chrome: ${c.id}`, async () => {
          const el = await makeSlider(c);
          expectSliderMatches(el, c);
        });
      }
    }
  }

  // ── defaults ─────────────────────────────────────────────────────────────
  it('an attribute-free slider carries every documented default', async () => {
    const el = await makeSlider(combo());
    const read: Record<string, unknown> = {};
    for (const key of Object.keys(DEFAULTS)) read[key] = (el as any)[key];
    expect(read).toEqual(DEFAULTS);
  });

  it('a bare slider renders the three structural parts and nothing optional', async () => {
    const el = await makeSlider(combo());
    expect(exactParts(el, 'track').length).toBe(1);
    expect(exactParts(el, 'fill').length).toBe(1);
    expect(exactParts(el, 'thumb').length).toBe(1);
    expect(exactParts(el, 'spinner').length, 'no spinner without loading').toBe(0);
    expect(renderedSupport(el), 'no support text without helper/error').toBe('none');
    expect(labelOf(el), 'no label element without a label').toBeNull();
    expect(valueLabelOf(el), 'no read-out without show-value').toBeNull();
    expect(ticksOf(el), 'no ticks without show-ticks').toEqual([]);
  });

  it('every documented part appears on a slider that uses all of them', async () => {
    const c = combo({
      loading: true, invalid: true, errorText: 'Out of range', label: 'Volume', value: 20,
    });
    const el = await makeSlider(c);
    expectSliderMatches(el, c);
    const missing = PARTS.filter(name => name !== 'helper-text' && exactParts(el, name).length === 0);
    expect(missing).toEqual([]);
  });

  // ── the label ────────────────────────────────────────────────────────────
  it('the label names the thumb, which is the element with the slider role', async () => {
    const el = await makeSlider(combo({ label: 'Volume' }));
    expect(textOf(labelOf(el))).toBe('Volume');
    expect(thumbOf(el).getAttribute('aria-label'), 'the accessible name reaches the role')
      .toBe('Volume');
  });

  it('a slider with no label still has an accessible name', async () => {
    // "Explicit/wrapping labels name and focus the thumb" — and a nameless
    // `role="slider"` is announced as nothing at all, so a fallback is owed.
    const el = await makeSlider(combo());
    expect((thumbOf(el).getAttribute('aria-label') ?? '').length).toBeGreaterThan(0);
  });

  it('required marks the label so the requirement is visible, not just semantic', async () => {
    const el = await makeSlider(combo({ label: 'Volume', required: true }));
    expect(classesOf(labelOf(el))).toContain('label--required');
  });

  // ── the value read-out ───────────────────────────────────────────────────
  for (const [step, value, shown] of [[1, 42, '42'], [0.1, 12.3, '12.3'], [0.01, 1.23, '1.23']] as const) {
    it(`show-value renders "${shown}" at step ${step}`, async () => {
      const c = combo({ showValue: true, step, value, min: 0, max: 100 });
      const el = await makeSlider(c);
      expectSliderMatches(el, c);
      expect(textOf(valueLabelOf(el))).toBe(shown);
    });
  }

  it('the read-out follows the value', async () => {
    const el = await makeSlider(combo({ showValue: true, value: 10 }));
    el.value = 75;
    await wait(30);
    expect(textOf(valueLabelOf(el))).toBe('75');
  });

  // ── ticks ────────────────────────────────────────────────────────────────
  for (const [min, max, step] of [[0, 10, 1], [0, 10, 2], [0, 10, 5], [0, 100, 25], [5, 25, 5]] as const) {
    it(`show-ticks draws one mark per lattice point: ${min}..${max}@${step}`, async () => {
      const c = combo({ showTicks: true, min, max, step, value: min });
      const el = await makeSlider(c);
      expectSliderMatches(el, c);
      expect(ticksOf(el).length).toBe(expectedTickCount(min, max, step));
    });
  }

  it('ticks are absent unless show-ticks is on', async () => {
    const el = await makeSlider(combo({ min: 0, max: 10, step: 1 }));
    expect(ticksOf(el)).toEqual([]);
  });

  it('a zero step still draws a countable tick set, on the fallback lattice', async () => {
    // "Zero, negative, or non-finite steps fall back to `1`" — so the ticks
    // must be countable rather than infinite or absent.
    const c = combo({ showTicks: true, min: 0, max: 5, step: 0, value: 0 });
    const el = await makeSlider(c);
    expectSliderMatches(el, c);
    expect(ticksOf(el).length).toBe(6);
  });

  // ── helper / error precedence ────────────────────────────────────────────
  const SUPPORT = [
    { name: 'neither', helperText: '', errorText: '', invalid: false, expected: 'none' },
    { name: 'helper only', helperText: 'Pick a level', errorText: '', invalid: false, expected: 'helper' },
    { name: 'error text but valid', helperText: '', errorText: 'Bad', invalid: false, expected: 'none' },
    { name: 'error text, invalid', helperText: '', errorText: 'Bad', invalid: true, expected: 'error' },
    { name: 'both, valid', helperText: 'Pick a level', errorText: 'Bad', invalid: false, expected: 'helper' },
    { name: 'both, invalid', helperText: 'Pick a level', errorText: 'Bad', invalid: true, expected: 'error' },
    { name: 'invalid with no error text', helperText: 'Pick a level', errorText: '', invalid: true, expected: 'helper' },
  ] as const;

  for (const support of SUPPORT) {
    it(`support text — ${support.name} → ${support.expected}`, async () => {
      const c = combo({
        helperText: support.helperText, errorText: support.errorText, invalid: support.invalid,
      });
      const el = await makeSlider(c);
      expectSliderMatches(el, c);
      expect(renderedSupport(el)).toBe(support.expected);
    });
  }

  it('only one support text is ever on screen', async () => {
    const el = await makeSlider(combo({ helperText: 'Help', errorText: 'Bad', invalid: true }));
    expect(exactParts(el, 'helper-text').length + exactParts(el, 'error-text').length).toBe(1);
  });

  it('the error text is announced, not merely displayed', async () => {
    const el = await makeSlider(combo({ errorText: 'Out of range', invalid: true }));
    expect(exactPart(el, 'error-text')!.getAttribute('role'), 'an error is a live region')
      .toBe('alert');
  });

  it('the support text is what the thumb is described by', async () => {
    const el = await makeSlider(combo({ helperText: 'Pick a level' }));
    const describedBy = thumbOf(el).getAttribute('aria-describedby');
    expect(describedBy, 'the thumb points at its description').not.toBe('');
    expect(exactPart(el, 'helper-text')!.id).toBe(describedBy);
  });

  it('a slider with no support text describes the thumb by nothing', async () => {
    const el = await makeSlider(combo());
    expect(thumbOf(el).getAttribute('aria-describedby') || '').toBe('');
  });

  // ── re-rendering ─────────────────────────────────────────────────────────
  it('switching variant and size rewrites the classes', async () => {
    const el = await makeSlider(combo({ variant: 'default', size: 'small' }));
    el.variant = 'danger';
    el.size = 'large';
    await wait(30);
    expectSliderMatches(el, combo({ variant: 'danger', size: 'large' }));
  });

  it('switching to vertical rewrites every axis modifier at once', async () => {
    const el = await makeSlider(combo({ vertical: false, value: 40 }));
    el.vertical = true;
    await wait(30);
    expectSliderMatches(el, combo({ vertical: true, value: 40 }));
  });
});
