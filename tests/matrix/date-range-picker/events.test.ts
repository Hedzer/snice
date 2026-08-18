/**
 * Matrix slice DATE-RANGE-PICKER / EVENTS — the interaction surface.
 *
 * Dimensions: open path (4: input click, calendar toggle, Enter, Space) x
 * state (2: plain, blocked) = 8; selection journey (4: in-order, earlier
 * second click, same-day pair, dual-column) x nothing; presets (4 kinds);
 * clear x shape (3); plus the ordering/bubbling/silence regressions.
 *
 * Documented contract (docs/ai/components/date-range-picker.md "Events" and
 * "CSS parts and accessibility"):
 *   · The seven `daterange-*` events, with the documented details:
 *     `daterange-change -> { start, end, startDate, endDate, startIso, endIso,
 *     dateRangePicker }`, `daterange-preset -> { label, start, end,
 *     dateRangePicker }`, the others carrying `{ dateRangePicker }`.
 *   · "All component events bubble and are composed."
 *   · "Clear emits `daterange-clear` before `daterange-change`; preset
 *     selection emits change before preset."
 *   · "Direct assignments, default changes, reset, and restoration are
 *     silent."
 *   · "Enter/Space opens from the range input; Escape closes."
 *   · "Calendar and preset selection write live strings in the configured
 *     display format."
 *   · "Direct reversed assignments remain reversed and invalid.
 *     `selectRange(Date, Date)` preserves its selection convenience and orders
 *     reversed valid arguments."
 *   · "Invalid `Date` arguments and presets with an impossible endpoint are
 *     ignored atomically without preview, mutation, close, or events."
 *
 * it.fails policy: no finding is pinned in this file. (MATRIX-date-range-picker-1,
 * the double daterange-open/daterange-close dispatch, was fixed; its rows run
 * unpinned as the regression guard.)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { product } from '../matrix-utils';
import {
  mountRange, cleanupRanges, installInternalsMock, restoreInternalsMock,
  inputOf, toggleOf, dayButtons, click, press, hover, viewOn,
  recordEvents, namesOf, wait, SETTLE, type DateRangePreset,
} from './date-range-picker-support';
import { finding } from '../matrix-utils';

describe('date-range-picker matrix: events and interaction', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupRanges(); restoreInternalsMock(); });

  // ── Opening: "Enter/Space opens from the range input" ─────────────────────
  const OPEN_PATHS = [
    { name: 'input-click', open: (el: any) => click(inputOf(el)) },
    { name: 'toggle-click', open: (el: any) => click(toggleOf(el)) },
    { name: 'enter', open: (el: any) => press(inputOf(el), 'Enter') },
    { name: 'space', open: (el: any) => press(inputOf(el), ' ') },
  ] as const;

  for (const { path, blocked } of product({
    path: OPEN_PATHS,
    blocked: [false, true],
  })) {
    const state = blocked ? 'readonly' : 'plain';

    it(`open/${path.name}/${state}`, async () => {
      const el = await mountRange({
        attrs: blocked ? { readonly: true } : {},
      });

      path.open(el);
      await wait(SETTLE);

      if (blocked) {
        expect(el.showCalendar, 'a blocked control opened its calendar').toBe(false);
      } else {
        expect(el.showCalendar, `${path.name} did not open the calendar`).toBe(true);

        if (path.name === 'enter' || path.name === 'space') {
          press(inputOf(el), 'Escape');
        } else {
          el.close();
        }
        await wait(SETTLE);
        expect(el.showCalendar).toBe(false);
      }
    });

    if (!blocked) {
      // MATRIX-date-range-picker-1 (fixed): one open or close used to announce
      // its event TWICE (the `show-calendar` watcher plus the imperative emit
      // in open()/close()). The doc lists each daterange-* event as THE
      // notification of its transition, so exactly one is expected. Unpinned
      // regression guard.
      it(
        finding('MATRIX-date-range-picker-1',
          `${path.name} announces daterange-open exactly once (fixed)`),
        async () => {
          const el = await mountRange({});
          const seen = recordEvents(el);
          path.open(el);
          await wait(SETTLE);
          expect(namesOf(seen)).toEqual(['daterange-open']);
        });
    }
  }

  it.each(['disabled', 'loading'] as const)('open()/open-paths stay inert while %s', async state => {
    const el = await mountRange({ attrs: { [state]: true } });
    el.open();
    await wait(SETTLE);
    expect(el.showCalendar).toBe(false);
    press(inputOf(el), 'Enter');
    await wait(SETTLE);
    expect(el.showCalendar).toBe(false);
  });

  // ── The two-click selection journey ────────────────────────────────────────
  it('two clicks build a range: first start-only, then the complete change', async () => {
    const el = await mountRange({});
    await viewOn(el, '2026-03-01');
    el.open();
    await wait(SETTLE);
    const seen = recordEvents(el);
    const day = (iso: string) =>
      dayButtons(el).find(button => button.getAttribute('data-date') === iso)!;

    click(day('2026-03-05'));
    await wait(SETTLE);
    // First click: "Calendar ... selection write live strings in the
    // configured display format" — start only, no event yet.
    expect([el.start, el.end]).toEqual(['03/05/2026', '']);
    expect(el.showCalendar, 'the calendar closed mid-selection').toBe(true);
    expect(namesOf(seen)).toEqual([]);

    click(day('2026-03-12'));
    await wait(SETTLE);
    expect([el.start, el.end]).toEqual(['03/05/2026', '03/12/2026']);
    expect(el.showCalendar).toBe(false);
    // Completion emits the change BEFORE any close it causes.
    expect(seen[0].type, 'the completion change must come first').toBe('daterange-change');
    const detail = seen[0].detail;
    expect(detail).toMatchObject({
      start: '03/05/2026', end: '03/12/2026',
      startIso: '2026-03-05', endIso: '2026-03-12',
    });
    expect(detail.dateRangePicker).toBe(el);
    expect(detail.startDate).toBeInstanceOf(Date);
    expect(detail.endDate).toBeInstanceOf(Date);
  });

  // MATRIX-date-range-picker-1 (fixed): the close after completion used to
  // announce itself twice, so the exact documented sequence could not hold.
  // Unpinned regression guard.
  it(
    finding('MATRIX-date-range-picker-1',
      'completion emits exactly [daterange-change, daterange-close] (fixed)'),
    async () => {
      const el = await mountRange({});
      await viewOn(el, '2026-03-01');
      el.open();
      await wait(SETTLE);
      const seen = recordEvents(el);
      const day = (iso: string) =>
        dayButtons(el).find(button => button.getAttribute('data-date') === iso)!;
      click(day('2026-03-05'));
      click(day('2026-03-12'));
      await wait(SETTLE);
      expect(namesOf(seen)).toEqual(['daterange-change', 'daterange-close']);
    });

  it('an earlier second click restarts the start instead of reversing', async () => {
    const el = await mountRange({});
    await viewOn(el, '2026-03-01');
    el.open();
    await wait(SETTLE);
    const day = (iso: string) =>
      dayButtons(el).find(button => button.getAttribute('data-date') === iso)!;

    click(day('2026-03-15'));
    click(day('2026-03-05'));
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['03/05/2026', '']);
    expect(el.showCalendar, 'the calendar closed mid-selection').toBe(true);
  });

  it('a same-day pair selects a valid one-day range', async () => {
    const el = await mountRange({});
    await viewOn(el, '2026-03-01');
    el.open();
    await wait(SETTLE);
    const seen = recordEvents(el);
    const day = (iso: string) =>
      dayButtons(el).find(button => button.getAttribute('data-date') === iso)!;

    click(day('2026-03-05'));
    click(day('2026-03-05'));
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['03/05/2026', '03/05/2026']);
    expect(el.checkValidity()).toBe(true);
    expect(seen[0].type).toBe('daterange-change');
  });

  it('a dual-column selection can span the two visible months', async () => {
    const el = await mountRange({ attrs: { columns: 2 } });
    await viewOn(el, '2026-03-01');
    el.open();
    await wait(SETTLE);
    const day = (iso: string) =>
      dayButtons(el).find(button => button.getAttribute('data-date') === iso)!;

    click(day('2026-03-30'));
    click(day('2026-04-02'));
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['03/30/2026', '04/02/2026']);
  });

  // ── Presets ────────────────────────────────────────────────────────────────
  // All preset ranges live in March 2026, and the view is anchored there
  // (viewOn) so the journey is independent of the machine's today.
  const PRESETS: Array<{
    name: string;
    presets: DateRangePreset[];
    applied: boolean;
    why: string;
  }> = [
    {
      name: 'date-endpoints',
      presets: [{ label: 'March', start: new Date(2026, 2, 1), end: new Date(2026, 2, 31) }],
      applied: true,
      why: 'Date endpoints are the documented preset form',
    },
    {
      name: 'string-endpoints',
      presets: [{ label: 'MarchAgain', start: '2026-03-01', end: '2026-03-31' }],
      applied: true,
      why: '"Date|string endpoints"',
    },
    {
      name: 'impossible-string',
      presets: [{ label: 'Rolled', start: '2026-02-31', end: '2026-03-20' }],
      applied: false,
      why: '"presets with an impossible endpoint are ignored atomically without preview, mutation, close, or events"',
    },
    {
      name: 'invalid-date',
      presets: [{ label: 'Invalid', start: new Date(Number.NaN), end: new Date(2026, 2, 20) }],
      applied: false,
      why: '"Invalid `Date` arguments ... are ignored atomically"',
    },
  ];

  for (const spec of PRESETS) {
    it(`preset/${spec.name}: ${spec.why}`, async () => {
      const el = await mountRange({
        props: { presets: spec.presets },
      });
      await viewOn(el, '2026-03-01');
      // Hold a range the ignored presets must not touch.
      el.start = '2026-03-10';
      el.end = '2026-03-20';
      await wait(SETTLE);
      el.open();
      await wait(SETTLE);
      const seen = recordEvents(el);
      const button = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-preset="0"]')!;
      expect(button.textContent!.trim()).toBe(spec.presets[0].label);

      // Hover asks for a preview; an impossible preset must preview nothing.
      hover(button);
      await wait(SETTLE);
      const dayClass = (iso: string) =>
        dayButtons(el).find(b => b.getAttribute('data-date') === iso)?.className ?? '(absent)';
      if (spec.applied) {
        expect(dayClass('2026-03-01'), 'a valid preset previews nothing')
          .toContain('preset-preview');
      } else {
        expect(dayClass('2026-03-15'), 'an impossible preset previewed')
          .not.toContain('preset-preview');
      }

      click(button);
      await wait(SETTLE);

      if (spec.applied) {
        // "preset selection emits change before preset" — the documented
        // ORDER claim. (The single close that follows is asserted as
        // MATRIX-date-range-picker-1 below.)
        expect(seen[0].type, 'the preset change must come first').toBe('daterange-change');
        expect(seen[1].type, 'the preset event must follow the change').toBe('daterange-preset');
        expect(seen[1].detail).toMatchObject({ label: spec.presets[0].label });
        expect(seen[1].detail.dateRangePicker).toBe(el);
        expect(el.showCalendar).toBe(false);
      } else {
        // "without preview, mutation, close, or events."
        expect(namesOf(seen)).toEqual([]);
        expect([el.start, el.end], 'an ignored preset mutated the range')
          .toEqual(['2026-03-10', '2026-03-20']);
        expect(el.showCalendar, 'an ignored preset closed the calendar').toBe(true);
      }
    });
  }

  it('a reversed preset previews in chronological order and selects normalized', async () => {
    const el = await mountRange({
      props: { presets: [{ label: 'Reverse', start: '2026-03-20', end: '2026-03-10' }] },
    });
    await viewOn(el, '2026-03-01');
    el.open();
    await wait(SETTLE);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>('[data-preset="0"]')!;

    hover(button);
    await wait(SETTLE);
    const day = (iso: string) =>
      dayButtons(el).find(b => b.getAttribute('data-date') === iso)!;
    expect(day('2026-03-10').className).toContain('preset-preview-endpoint');
    expect(day('2026-03-20').className).toContain('preset-preview-endpoint');

    click(button);
    await wait(SETTLE);
    // selectRange orders reversed valid arguments.
    expect([el.start, el.end]).toEqual(['03/10/2026', '03/20/2026']);
  });

  // ── selectRange and clear ──────────────────────────────────────────────────
  it('selectRange orders reversed arguments and emits exactly one change', async () => {
    const el = await mountRange({});
    const seen = recordEvents(el);

    el.selectRange(new Date(2026, 3, 20), new Date(2026, 2, 10));
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['03/10/2026', '04/20/2026']);
    expect(namesOf(seen)).toEqual(['daterange-change']);
    expect(seen[0].detail).toMatchObject({
      start: '03/10/2026', end: '04/20/2026',
      startIso: '2026-03-10', endIso: '2026-04-20',
    });
  });

  it('selectRange with an invalid Date is ignored atomically', async () => {
    const el = await mountRange({
      attrs: { start: '2026-03-10', end: '2026-03-20' },
    });
    const seen = recordEvents(el);

    el.selectRange(new Date(Number.NaN), new Date(2026, 2, 25));
    el.selectRange(new Date(2026, 2, 5), new Date(Number.NaN));
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['2026-03-10', '2026-03-20']);
    expect(namesOf(seen)).toEqual([]);
  });

  it.each([
    ['2026-03-01', '2026-03-15'],
    ['2026-03-01', ''],
    ['bad-start', 'bad-end'],
  ])('clear on [%s, %s] emits clear before change and empties everything', async (start, end) => {
    const el = await mountRange({ attrs: { clearable: true }, live: { start, end } });
    await wait(SETTLE);
    const seen = recordEvents(el);

    const clear = el.shadowRoot!.querySelector<HTMLButtonElement>('.clear-button')!;
    expect(clear.style.display, 'the clear affordance is hidden with a range held').not.toBe('none');
    click(clear);
    await wait(SETTLE);

    expect([el.start, el.end]).toEqual(['', '']);
    // "Clear emits daterange-clear before daterange-change" — the documented
    // order claim, asserted as the leading pair (clear() also refocuses the
    // field, which the doc's own focus semantics report afterwards).
    expect(namesOf(seen).slice(0, 2),
      'clear did not lead with [daterange-clear, daterange-change]')
      .toEqual(['daterange-clear', 'daterange-change']);
    expect(seen[0].detail.dateRangePicker).toBe(el);
  });

  // MATRIX-date-range-picker-1 (fixed, the preset face of it): a preset
  // selection used to close with a doubly announced close, so the exact
  // documented tail `[change, preset, close]` could not hold. Unpinned
  // regression guard.
  it(
    finding('MATRIX-date-range-picker-1',
      'a preset emits exactly [change, preset, close] (fixed)'),
    async () => {
      const el = await mountRange({
        props: { presets: [{ label: 'April', start: '2026-04-01', end: '2026-04-30' }] },
      });
      el.open();
      await wait(SETTLE);
      const seen = recordEvents(el);
      click(el.shadowRoot!.querySelector<HTMLButtonElement>('[data-preset="0"]')!);
      await wait(SETTLE);
      expect(namesOf(seen)).toEqual(
        ['daterange-change', 'daterange-preset', 'daterange-close']);
    });

  // ── Silence and propagation ────────────────────────────────────────────────
  it('direct assignments, default changes, reset, and restoration are silent', async () => {
    const el = await mountRange({
      attrs: { name: 'stay', start: '2026-03-10', end: '2026-03-20' },
    });
    const seen = recordEvents(el);

    el.start = '2026-04-01';
    el.end = '2026-04-30';
    el.defaultStart = '2026-05-01';
    el.defaultEnd = '2026-05-31';
    (el as any).formResetCallback();
    (el as any).formStateRestoreCallback(JSON.stringify(['2026-06-01', '2026-06-30']), 'restore');
    await wait(SETTLE);

    expect(namesOf(seen), 'one of the silent paths emitted a customer event').toEqual([]);
    // Restoration won the last write.
    expect([el.start, el.end]).toEqual(['2026-06-01', '2026-06-30']);
  });

  it('every documented event bubbles and is composed', async () => {
    const el = await mountRange({});
    const collected: Array<{ type: string; bubbles: boolean; composed: boolean }> = [];
    const handler = (event: Event) => {
      collected.push({
        type: event.type,
        bubbles: event.bubbles,
        composed: event.composed,
      });
    };
    // Reaching `document` at all proves composed:true crossed the shadow
    // boundary; bubbles is read off the received event.
    for (const type of ['daterange-change', 'daterange-preset', 'daterange-clear',
      'daterange-open', 'daterange-close', 'daterange-focus', 'daterange-blur']) {
      document.addEventListener(type, handler);
    }

    el.open();
    inputOf(el)!.dispatchEvent(new FocusEvent('focus', { composed: true }));
    el.selectRange(new Date(2026, 2, 1), new Date(2026, 2, 15));
    el.clear();
    el.close();
    inputOf(el)!.dispatchEvent(new FocusEvent('blur', { composed: true }));
    await wait(SETTLE);

    for (const type of ['daterange-change', 'daterange-preset', 'daterange-clear',
      'daterange-open', 'daterange-close', 'daterange-focus', 'daterange-blur']) {
      document.removeEventListener(type, handler);
    }

    // preset never fires here (no preset selected) — the other six do.
    const types = collected.map(entry => entry.type);
    for (const expected of ['daterange-change', 'daterange-clear', 'daterange-open',
      'daterange-close', 'daterange-focus', 'daterange-blur']) {
      expect(types, `${expected} never reached document`).toContain(expected);
    }
    expect(collected.every(entry => entry.bubbles && entry.composed),
      'a documented event neither bubbles nor is composed').toBe(true);
  });

  it('focus and blur are reported as daterange-focus/daterange-blur', async () => {
    const el = await mountRange({});
    const seen = recordEvents(el);
    inputOf(el)!.dispatchEvent(new FocusEvent('focus', { composed: true }));
    inputOf(el)!.dispatchEvent(new FocusEvent('blur', { composed: true }));
    await wait(SETTLE);
    expect(namesOf(seen)).toEqual(['daterange-focus', 'daterange-blur']);
    expect(seen[0].detail.dateRangePicker).toBe(el);
  });
});
