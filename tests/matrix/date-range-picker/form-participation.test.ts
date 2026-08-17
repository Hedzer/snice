/**
 * Matrix slice DATE-RANGE-PICKER / FORM PARTICIPATION.
 *
 * Dimensions: name (2: '', 'booking') x range shape (6) = 12 combos, plus the
 * reset/dirty/restoration lifecycle regressions.
 *
 * Documented contract (docs/ai/components/date-range-picker.md "Form
 * contract" and "Live/default/display contract"):
 *   · "An enabled picker with `name="booking"` contributes exactly two
 *     `FormData` entries: `booking-start` and `booking-end`."
 *   · "Each parseable endpoint is submitted as local-calendar `YYYY-MM-DD`,
 *     independent of the visible `format` and preserved live string."
 *   · "Empty/unparseable endpoints contribute `''`. A named optional empty
 *     picker still contributes both empty fields. Empty `name` contributes
 *     nothing."
 *   · "Partial, malformed, reversed, and out-of-bounds ranges may remain
 *     observable in `FormData`, but validity blocks interactive submission."
 *   · "`readonly` and `loading` retain submitted values."
 *   · "Browser history/autofill restoration accepts the saved endpoint pair,
 *     is atomic for malformed state, and emits no customer events."
 *   · "form.reset() clears dirtiness and silently restores both current
 *     defaults. A partial default remains partial and invalid when required."
 *
 * happy-dom implements none of the form plumbing behind `ElementInternals`
 * (internals-mock.ts), so the submission is read off the recorded
 * `setFormValue` payload, reset is driven through `formResetCallback()` and
 * restoration through `formStateRestoreCallback()` — exactly the calls the
 * browser would make. The real `new FormData(form)` runs in
 * tests/live/matrix/date-range-picker.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product } from '../matrix-utils';
import {
  mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  formEntries, expectedEntries, recordEvents, namesOf, wait, SETTLE,
} from './date-range-picker-support';

const SHAPES = [
  { name: 'canonical', start: '2026-03-10', end: '2026-03-20' },
  { name: 'display-format', start: '10/03/2026', end: '20/03/2026', format: 'dd/mm/yyyy' },
  { name: 'partial', start: '2026-03-10', end: '' },
  { name: 'impossible', start: '2026-02-30', end: '2026-03-20' },
  { name: 'reversed', start: '2026-03-20', end: '2026-03-10' },
  { name: 'empty', start: '', end: '' },
] as const;

describe('date-range-picker matrix: form participation', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  for (const combo of product({
    shape: SHAPES,
    named: [false, true],
  })) {
    const format = 'format' in combo.shape
      ? (combo.shape as { format?: 'dd/mm/yyyy' }).format ?? 'mm/dd/yyyy'
      : 'mm/dd/yyyy';
    const name = combo.named ? 'booking' : '';
    const id = `${combo.shape.name}/${combo.named ? 'named' : 'unnamed'}`;

    it(`${id}: the documented two-field submission`, async () => {
      const el = await mountRange({
        attrs: {
          name: name || undefined,
          format,
          start: combo.shape.start || undefined,
          end: combo.shape.end || undefined,
        },
      });

      expect(formEntries(el), `${id} submission`).toEqual(
        expectedEntries(name, combo.shape.start, combo.shape.end, format));

      if (combo.named) {
        // "exactly two FormData entries" — with these exact keys.
        const keys = (formEntries(el) ?? []).map(([k]) => k);
        expect(keys).toEqual(['booking-start', 'booking-end']);
        // "independent of the visible format and preserved live string": the
        // display-format pair submits canonical.
        if (combo.shape.name === 'display-format') {
          expect(formEntries(el)).toEqual([
            ['booking-start', '2026-03-10'], ['booking-end', '2026-03-20']]);
        }
      }
    });
  }

  it('a rename re-keys the pair and an empty name removes the contribution', async () => {
    const el = await mountRange({
      attrs: { start: '2026-03-10', end: '2026-03-20' },
    });
    // "Empty `name` contributes nothing."
    expect(formEntries(el), 'an unnamed picker contributed').toBe(null);

    el.name = 'trip';
    await wait(SETTLE);
    expect(formEntries(el)).toEqual([['trip-start', '2026-03-10'], ['trip-end', '2026-03-20']]);

    el.name = '';
    await wait(SETTLE);
    expect(formEntries(el)).toBe(null);
  });

  it('readonly and loading retain their submitted values', async () => {
    for (const state of ['readonly', 'loading'] as const) {
      const el = await mountRange({
        attrs: { name: 'stay', start: '2026-03-10', end: '2026-03-20', [state]: true },
      });
      expect(formEntries(el), `${state} dropped its submission`).toEqual(
        [['stay-start', '2026-03-10'], ['stay-end', '2026-03-20']]);
    }
  });

  // ── Reset: "clears dirtiness and silently restores both current defaults" ──
  it('reset restores the CURRENT defaults and clears dirtiness so defaults track again', async () => {
    const el = await mountRange({
      attrs: { name: 'stay', start: '2026-03-10', end: '2026-03-20' },
    });
    el.start = '2026-04-01';
    el.end = '2026-04-30';
    el.defaultStart = '2026-05-05';
    el.defaultEnd = '2026-05-25';
    await wait(SETTLE);
    // Dirty: the later default change did not overwrite the live range.
    expect([el.start, el.end]).toEqual(['2026-04-01', '2026-04-30']);

    const seen = recordEvents(el);
    (el as any).formResetCallback();
    await wait(SETTLE);

    expect([el.start, el.end], 'reset restored the current defaults').toEqual(
      ['2026-05-05', '2026-05-25']);
    expect(namesOf(seen), 'reset must be silent').toEqual([]);

    // Dirtiness is cleared: defaults track again until the next live write.
    el.defaultStart = '2026-06-01';
    el.defaultEnd = '2026-06-30';
    await wait(SETTLE);
    expect([el.start, el.end], 'reset did not clear dirtiness').toEqual(
      ['2026-06-01', '2026-06-30']);
  });

  it('a partial default remains partial and invalid when required', async () => {
    const el = await mountRange({
      attrs: { name: 'stay', start: '2026-03-10', required: true },
    });
    el.start = '2026-04-10';
    el.end = '2026-04-20';
    await wait(SETTLE);

    (el as any).formResetCallback();
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['2026-03-10', '']);
    expect(el.checkValidity(), 'a partial required pair is invalid').toBe(false);
    expect(el.validity.valueMissing || el.validity.badInput || el.validity.customError)
      .toBe(true);
  });

  // ── Restoration: "accepts the saved endpoint pair, is atomic for malformed
  //    state, and emits no customer events" ──────────────────────────────────
  it('restores a JSON endpoint pair silently, in the authored display format', async () => {
    const el = await mountRange({ attrs: { format: 'dd/mm/yyyy' } });
    const seen = recordEvents(el);

    (el as any).formStateRestoreCallback(JSON.stringify(['10/03/2026', '20/03/2026']), 'restore');
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['10/03/2026', '20/03/2026']);
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('.input')!.value)
      .toBe('10/03/2026  —  20/03/2026');
    expect(namesOf(seen), 'restoration must be silent').toEqual([]);
  });

  it('restores a FormData pair by its {name}-start/{name}-end keys', async () => {
    const el = await mountRange({ attrs: { name: 'trip' } });
    const state = new FormData();
    state.append('trip-start', '2026-04-01');
    state.append('trip-end', '2026-04-30');

    (el as any).formStateRestoreCallback(state, 'restore');
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['2026-04-01', '2026-04-30']);
  });

  it('malformed restoration state is rejected atomically', async () => {
    const el = await mountRange({
      attrs: { name: 'trip', start: '2026-03-01', end: '2026-03-15' },
    });
    const keep = [el.start, el.end];

    for (const malformed of [
      null, '{}', '["only-one"]', '[1,2]', 'not-json',
      new File([], 'range.txt'),
    ]) {
      (el as any).formStateRestoreCallback(malformed, 'restore');
      await wait(SETTLE);
      expect([el.start, el.end], `malformed state ${String(malformed)} mutated the range`)
        .toEqual(keep);
    }

    // Non-string endpoint values in FormData form are equally rejected.
    const fileState = new FormData();
    fileState.append('trip-start', new File([], 'start.txt'));
    fileState.append('trip-end', '2026-05-30');
    (el as any).formStateRestoreCallback(fileState, 'restore');
    await wait(SETTLE);
    expect([el.start, el.end]).toEqual(keep);
  });
});
