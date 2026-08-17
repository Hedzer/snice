/**
 * Matrix slice DATE-RANGE-PICKER / VALUES — the endpoint parse dimension.
 *
 * Dimensions: endpoint sample (12) x assignment channel (2: the `start`/`end`
 * content attributes, which are the authored reset defaults, and the live
 * `start`/`end` properties) = 24 combos, plus the strictness regressions and
 * the live/attribute separation.
 *
 * Documented contract:
 *   · "`start` and `end` are current strings. Valid canonical or
 *     configured-format assignment is accepted without rewriting it."
 *   · "Assignment is silent, dirty, and does not change either content
 *     attribute."
 *   · "Each endpoint is strict local-calendar data: month-length and Gregorian
 *     leap-year failures never roll into another month." — the sharpest claim
 *     this component makes, which is why the sample list carries February
 *     30th, February 29th of three different years, and April 31st. A rolling
 *     parser turns every one of them into a real date and quietly submits the
 *     wrong one.
 *   · "An impossible live/default/restored endpoint remains observable as its
 *     exact string, submits `''`, sets `badInput`, and never mutates its peer."
 *
 * Unlike snice-date-picker (which sanitizes programmatic impossible dates to
 * ''), this component's live strings are PRESERVED — the divergence between
 * the two siblings is itself documented, so the oracle demands the exact
 * authored string back.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { expectShape } from '../matrix-utils';
import {
  mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  formEntries, expectedEntries, activeFlags, expectedFlags,
  parseEndpoint, canonicalOf, displayOf, wait, SETTLE,
} from './date-range-picker-support';

/** Every sample assigns START; the peer end stays the doc's fixed valid day. */
const PEER = '2026-03-20';
const PEER_PARTS = { year: 2026, month: 3, day: 20 };

interface Sample {
  name: string;
  input: string;
  /** The documented parse, or null when the string is impossible/malformed. */
  parts: { year: number; month: number; day: number } | null;
  why: string;
}

const SAMPLES: Sample[] = [
  {
    name: 'empty', input: '', parts: null,
    why: 'the documented default; an empty endpoint is simply absent',
  },
  {
    name: 'canonical', input: '2026-03-15', parts: { year: 2026, month: 3, day: 15 },
    why: '"Accept canonical YYYY-MM-DD" — accepted regardless of the configured format',
  },
  {
    name: 'first-of-month', input: '2026-01-01', parts: { year: 2026, month: 1, day: 1 },
    why: 'the low edge of a month, where a zero-based month slip shows up',
  },
  {
    name: 'last-of-leap-february', input: '2024-02-29', parts: { year: 2024, month: 2, day: 29 },
    why: 'a real Gregorian leap day must be accepted',
  },
  {
    name: 'century-leap', input: '2000-02-29', parts: { year: 2000, month: 2, day: 29 },
    why: '2000 is a leap year under the 400-year rule',
  },
  {
    name: 'impossible-feb-30', input: '2026-02-30', parts: null,
    why: '"month-length ... failures never roll into another month"',
  },
  {
    name: 'impossible-leap', input: '2026-02-29', parts: null,
    why: '"leap-year failures never roll" — 2026 is not a leap year',
  },
  {
    name: 'impossible-century', input: '1900-02-29', parts: null,
    why: '1900 is NOT a leap year (the 100-year rule)',
  },
  {
    name: 'impossible-day-31', input: '2026-04-31', parts: null,
    why: '"month-length ... failures never roll" — April has 30 days',
  },
  {
    name: 'impossible-month', input: '2026-13-01', parts: null,
    why: 'there is no thirteenth month; it must not roll into next January',
  },
  {
    name: 'malformed', input: 'not a date', parts: null,
    why: 'an unparseable endpoint "remains observable as its exact string"',
  },
  {
    name: 'partial-canonical', input: '2026-03', parts: null,
    why: 'a partial canonical string is not a date',
  },
];

describe('date-range-picker matrix: values', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  for (const sample of SAMPLES) {
    for (const channel of ['attribute', 'property'] as const) {
      const id = `${sample.name}/${channel}`;

      it(`${id}: ${sample.why}`, async () => {
        const el = channel === 'attribute'
          ? await mountRange({
            attrs: sample.input
              ? { name: 'trip', start: sample.input, end: PEER }
              : { name: 'trip', end: PEER },
          })
          : await mountRange({ attrs: { name: 'trip', end: PEER }, live: { start: sample.input } });

        expectShape({
          // "current strings ... accepted without rewriting it" — the exact
          // authored text comes back, possible or not.
          'live start': el.start,
          'live end': el.end,
        }, {
          'live start': sample.input,
          'live end': PEER,
        }, id);

        // The submission: each endpoint canonical or ''.
        expect(
          formEntries(el),
          `${id} submission (name=trip)`,
        ).toEqual(expectedEntries('trip', sample.input, PEER, 'mm/dd/yyyy')
          ?? [['trip-start', ''], ['trip-end', '']]);

        // "An impossible ... endpoint ... sets badInput" — with a present
        // peer, an impossible/malformed start is the only complaint.
        expect(activeFlags(el), `${id} flags`).toEqual(
          expectedFlags(sample.input, PEER, {
            required: false, min: '', max: '', format: 'mm/dd/yyyy', barred: false,
          }));

        // The visible text: both endpoints show when both parse, formatted.
        const input = el.shadowRoot!.querySelector<HTMLInputElement>('.input')!;
        const wantDisplay = sample.parts
          ? `${displayOf(sample.parts, 'mm/dd/yyyy')}  —  ${displayOf(PEER_PARTS, 'mm/dd/yyyy')}`
          : '';
        expect(input.value, `${id} visible text`).toBe(wantDisplay);

        if (channel === 'attribute') {
          // "`defaultStart`/`defaultEnd` map to the `start`/`end` attributes
          // and form the authored reset pair" — the author's own text, and a
          // live assignment never touches it.
          expect(el.defaultStart, `${id} reset default mirrors the attribute`)
            .toBe(sample.input);
          expect(el.getAttribute('start'), `${id} attribute keeps the authored text`)
            .toBe(sample.input || null);
        } else {
          // "Assignment ... does not change either content attribute" and is
          // not an authored default.
          expect(el.getAttribute('start'), `${id} a live assignment wrote the attribute`)
            .toBe(null);
          expect(el.defaultStart, `${id} a live assignment changed the reset default`)
            .toBe('');
        }
      });
    }
  }

  // ── The strictness claim, stated as its own regressions ───────────────────
  //
  // "Each endpoint is strict local-calendar data: month-length and Gregorian
  // leap-year failures never roll into another month." Named against what the
  // roll would have been, because the failure this guards against is a parser
  // that SUCCEEDS on the wrong day.
  const ROLLS: Array<[string, string]> = [
    ['2026-02-30', '2026-03-02'],
    ['2026-02-29', '2026-03-01'],
    ['1900-02-29', '1900-03-01'],
    ['2026-04-31', '2026-05-01'],
    ['2026-13-01', '2027-01-01'],
  ];

  for (const [impossible, rolled] of ROLLS) {
    it(`"${impossible}" submits "" rather than rolling into "${rolled}"`, async () => {
      const el = await mountRange({
        attrs: { name: 'stay', end: PEER },
        live: { start: impossible },
      });
      expect(el.start, `"${impossible}" was not preserved verbatim`).toBe(impossible);
      expect(formEntries(el), `"${impossible}" rolled into a submitted date`)
        .toEqual([['stay-start', ''], ['stay-end', '2026-03-20']]);
      expect(activeFlags(el)).toEqual(['badInput']);
      expect(parseEndpoint(rolled, 'mm/dd/yyyy')).not.toBeNull(); // guard: sample sane
    });

    it(`"${impossible}" never mutates its peer endpoint`, async () => {
      const el = await mountRange({
        attrs: { name: 'stay', start: '2026-03-10', end: PEER },
      });
      el.start = impossible;
      await wait(SETTLE);
      expect(el.end).toBe(PEER);
      expect(formEntries(el)).toEqual([['stay-start', ''], ['stay-end', '2026-03-20']]);
    });
  }

  it('the doc\'s own worked example: live assignment, attribute, and reset default', async () => {
    // docs/ai/components/date-range-picker.md "Live/default/display contract":
    //   stay.start === '2026-03-10'; visible start is '10/03/2026' under
    //   dd/mm/yyyy; assigning '12/03/2026' leaves getAttribute('start')
    //   untouched; reset restores '2026-03-10'.
    const el = await mountRange({
      attrs: { start: '2026-03-10', end: '2026-03-20', format: 'dd/mm/yyyy' },
    });
    expect(el.start).toBe('2026-03-10');
    expect(el.defaultStart).toBe('2026-03-10');
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('.input')!.value)
      .toBe('10/03/2026  —  20/03/2026');

    el.start = '12/03/2026';
    await wait(SETTLE);
    expect(el.start).toBe('12/03/2026');
    expect(el.getAttribute('start')).toBe('2026-03-10');

    (el as any).formResetCallback();
    await wait(SETTLE);
    expect(el.start).toBe('2026-03-10');
    expect(el.end).toBe('2026-03-20');
  });

  it('a reset from impossible authored defaults restores them verbatim, still invalid', async () => {
    // "An impossible live/default/RESTORED endpoint remains observable as its
    // exact string, submits ''" — the reset path must not sanitize either.
    const el = await mountRange({
      attrs: { name: 'stay', start: '2026-02-31', end: '2026-04-31', required: true },
    });
    el.start = '2026-03-10';
    el.end = '2026-03-20';
    await wait(SETTLE);

    (el as any).formResetCallback();
    await wait(SETTLE);

    expect(el.start).toBe('2026-02-31');
    expect(el.end).toBe('2026-04-31');
    expect(formEntries(el)).toEqual([['stay-start', ''], ['stay-end', '']]);
    expect(activeFlags(el)).toEqual(['badInput', 'valueMissing']);
  });

  it('an empty live assignment empties the endpoint without touching the default', async () => {
    const el = await mountRange({ attrs: { start: '2026-03-10' } });
    el.start = '';
    await wait(SETTLE);
    expect(el.start).toBe('');
    expect(el.defaultStart).toBe('2026-03-10');
    expect(el.getAttribute('start')).toBe('2026-03-10');
  });

  it('a dirty range ignores later default changes, a pristine one follows them', async () => {
    // "Assigning ... dirties live state. Later default changes do not
    // overwrite a dirty range."
    const el = await mountRange({});
    el.defaultStart = '2026-06-01';
    el.defaultEnd = '2026-06-30';
    await wait(SETTLE);
    expect(el.start, 'a pristine range must track its defaults').toBe('2026-06-01');
    expect(el.end).toBe('2026-06-30');

    el.start = '2026-07-01';
    el.end = '2026-07-31';
    await wait(SETTLE);
    el.defaultStart = '2026-08-01';
    el.defaultEnd = '2026-08-31';
    await wait(SETTLE);
    expect(el.start, 'a dirty range was overwritten by a default change').toBe('2026-07-01');
    expect(el.end).toBe('2026-07-31');
  });
});
