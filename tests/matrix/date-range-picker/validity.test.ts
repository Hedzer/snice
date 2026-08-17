/**
 * Matrix slice DATE-RANGE-PICKER / VALIDITY — the constraint mapping.
 *
 * Dimensions: range shape (7) x required (2) = 14 combos;
 *             barred state (3: disabled, readonly, loading) x shape (3) = 9;
 *             min/max boundary regressions (8, incl. display-format
 *             constraints and impossible constraints).
 *
 * Documented contract (docs/ai/components/date-range-picker.md "Validation"):
 *   · "Optional completely empty pair: valid."
 *   · "`required` + incomplete/invalid pair: `valueMissing` (with `badInput`
 *     for partial/malformed input)."
 *   · "Partial or unparseable endpoint: `badInput`."
 *   · "Reversed parseable range: `customError`; values are not silently
 *     normalized."
 *   · "`min`/`max`: inclusive bounds applied to both endpoints, using
 *     `rangeUnderflow`/`rangeOverflow`; out-of-range days are disabled."
 *   · "Canonical constraints are recommended; configured display-format
 *     strings remain accepted. Impossible constraints are ignored rather than
 *     normalized."
 *   · "`setCustomValidity(message)` sets `customError`; `setCustomValidity('')`
 *     clears it."
 *   · "`invalid` and `errorText` are visual presentation only and do not
 *     establish constraint invalidity."
 *   · "`disabled` and effective disabled-fieldset descendants are omitted and
 *     barred. ... `readonly` and `loading` retain submitted values. Both block
 *     interaction and are barred from validation."
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product } from '../matrix-utils';
import {
  mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  formEntries, expectedEntries, activeFlags, expectedFlags, wait, SETTLE,
} from './date-range-picker-support';

interface Shape {
  name: string;
  start: string;
  end: string;
  why: string;
}

/** All samples are authored under the default mm/dd/yyyy unless noted. */
const SHAPES: Shape[] = [
  {
    name: 'empty', start: '', end: '',
    why: '"Optional completely empty pair: valid"',
  },
  {
    name: 'complete', start: '2026-03-10', end: '2026-03-20',
    why: 'a well-formed canonical pair — no complaint at all',
  },
  {
    name: 'partial-start', start: '2026-03-10', end: '',
    why: '"Partial ... endpoint: badInput"',
  },
  {
    name: 'partial-end', start: '', end: '2026-03-20',
    why: 'the partial pair from the other side',
  },
  {
    name: 'malformed-start', start: 'not-a-date', end: '2026-03-20',
    why: '"Partial or unparseable endpoint: badInput"',
  },
  {
    name: 'impossible-end', start: '2026-03-10', end: '2026-02-30',
    why: 'an impossible endpoint is unparseable: badInput, peer intact',
  },
  {
    name: 'reversed', start: '2026-03-20', end: '2026-03-10',
    why: '"Reversed parseable range: customError; values are not silently normalized"',
  },
];

describe('date-range-picker matrix: validity shapes', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  for (const shape of product({ shape: SHAPES, required: [false, true] })) {
    const id = `${shape.shape.name}/${shape.required ? 'required' : 'optional'}`;

    it(`${id}: ${shape.shape.why}`, async () => {
      const el = await mountRange({
        attrs: { name: 'stay', required: shape.required || undefined },
        live: { start: shape.shape.start, end: shape.shape.end },
      });

      expect(activeFlags(el), `${id} flags`).toEqual(expectedFlags(
        shape.shape.start, shape.shape.end, {
          required: shape.required, min: '', max: '',
          format: 'mm/dd/yyyy', barred: false,
        }));
      // The submission stays observable exactly as documented: canonical
      // where parseable, '' where not, reversed pair submitted as-is.
      expect(formEntries(el), `${id} submission`).toEqual(expectedEntries(
        'stay', shape.shape.start, shape.shape.end, 'mm/dd/yyyy'));
      // "values are not silently normalized" — reversed included.
      expect(el.start).toBe(shape.shape.start);
      expect(el.end).toBe(shape.shape.end);
    });
  }

  // ── Barred states: "Both block interaction and are barred from validation",
  //    and the values are retained.
  for (const state of ['disabled', 'readonly', 'loading'] as const) {
    for (const shape of [
      { name: 'empty', start: '', end: '' },
      { name: 'required-empty', start: '', end: '' },
      { name: 'reversed', start: '2026-03-20', end: '2026-03-10' },
    ]) {
      const id = `${state}/${shape.name}`;

      it(`${id}: barred from validation, values retained`, async () => {
        const el = await mountRange({
          attrs: {
            name: 'stay', [state]: true,
            required: shape.name === 'required-empty' || undefined,
          },
          live: { start: shape.start, end: shape.end },
        });

        expect(activeFlags(el), `${id} a barred control reports no flags`).toEqual([]);
        expect(el.willValidate, `${id} willValidate`).toBe(false);
        expect([el.start, el.end], `${id} the live strings must survive`).toEqual(
          [shape.start, shape.end]);
        if (shape.name !== 'empty') {
          expect(formEntries(el), `${id} submission retained`).toEqual(
            expectedEntries('stay', shape.start, shape.end, 'mm/dd/yyyy'));
        }
      });
    }
  }

  // ── min/max: "inclusive bounds applied to both endpoints" ─────────────────
  const BOUNDS = [
    {
      name: 'min-boundary-inclusive',
      min: '2026-03-10', max: '', start: '2026-03-10', end: '2026-03-20',
      flags: [] as string[],
      why: '"inclusive bounds" — sitting ON min is not under it',
    },
    {
      name: 'start-below-min',
      min: '2026-03-10', max: '', start: '2026-03-09', end: '2026-03-20',
      flags: ['rangeUnderflow'],
      why: 'the start endpoint below min',
    },
    {
      name: 'end-below-min',
      min: '2026-03-15', max: '', start: '2026-03-10', end: '2026-03-14',
      flags: ['rangeUnderflow'],
      why: '"applied to BOTH endpoints" — the end below min is also underflow',
    },
    {
      name: 'max-boundary-inclusive',
      min: '', max: '2026-03-20', start: '2026-03-10', end: '2026-03-20',
      flags: [] as string[],
      why: 'sitting ON max is not over it',
    },
    {
      name: 'end-beyond-max',
      min: '', max: '2026-03-20', start: '2026-03-10', end: '2026-03-21',
      flags: ['rangeOverflow'],
      why: 'the end endpoint beyond max',
    },
    {
      name: 'start-beyond-max',
      min: '', max: '2026-03-05', start: '2026-03-10', end: '2026-03-20',
      flags: ['rangeOverflow'],
      why: '"applied to BOTH endpoints" — the start beyond max is also overflow',
    },
    {
      name: 'display-format-constraints',
      min: '10/03/2026', max: '20/03/2026', start: '2026-03-10', end: '2026-03-21',
      flags: ['rangeOverflow'],
      format: 'dd/mm/yyyy',
      why: '"configured display-format strings remain accepted"',
    },
    {
      name: 'impossible-constraints-ignored',
      min: '2026-02-31', max: '2026-04-31', start: '2026-03-01', end: '2026-05-02',
      flags: [] as string[],
      why: '"Impossible constraints are ignored rather than normalized"',
    },
  ] as const;

  for (const bound of BOUNDS) {
    it(`minmax/${bound.name}: ${bound.why}`, async () => {
      const format = ('format' in bound
        ? (bound as { format?: 'dd/mm/yyyy' }).format
        : 'mm/dd/yyyy') as 'dd/mm/yyyy' | 'mm/dd/yyyy';
      const el = await mountRange({
        attrs: {
          name: 'stay', format,
          min: bound.min || undefined, max: bound.max || undefined,
        },
      });
      el.min = bound.min;
      el.max = bound.max;
      el.start = bound.start;
      el.end = bound.end;
      await wait(SETTLE);

      expect(activeFlags(el), `minmax/${bound.name}`).toEqual(expectedFlags(
        bound.start, bound.end, {
          required: false, min: bound.min, max: bound.max, format, barred: false,
        }));
      expect(activeFlags(el)).toEqual([...bound.flags]);
    });
  }

  // ── setCustomValidity ──────────────────────────────────────────────────────
  it('setCustomValidity sets customError over a valid pair, and \'\' clears it', async () => {
    const el = await mountRange({
      attrs: { name: 'stay', start: '2026-03-10', end: '2026-03-20' },
    });
    el.setCustomValidity('Booking window closed');
    await wait(SETTLE);
    expect(activeFlags(el)).toEqual(['customError']);
    expect(el.validationMessage).toContain('Booking window closed');
    // "values are not silently normalized" — the custom error changed nothing.
    expect([el.start, el.end]).toEqual(['2026-03-10', '2026-03-20']);
    expect(formEntries(el)).toEqual([['stay-start', '2026-03-10'], ['stay-end', '2026-03-20']]);

    el.setCustomValidity('');
    await wait(SETTLE);
    expect(activeFlags(el)).toEqual([]);
  });

  it('a custom error and a reversed range are both customError, together', async () => {
    const el = await mountRange({ live: { start: '2026-03-20', end: '2026-03-10' } });
    el.setCustomValidity('Nope');
    await wait(SETTLE);
    expect(activeFlags(el)).toEqual(['customError']);
  });

  // ── "`invalid` and `errorText` are visual presentation only" ───────────────
  it('invalid and errorText do not establish constraint invalidity', async () => {
    const el = await mountRange({
      attrs: {
        name: 'stay', invalid: true, 'error-text': 'Range unavailable',
        start: '2026-03-10', end: '2026-03-20',
      },
    });
    expect(activeFlags(el), 'presentation-only flags leaked into validity').toEqual([]);
    expect(el.willValidate).toBe(true);
    // The visual half IS documented: aria-invalid mirrors.
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
