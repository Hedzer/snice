/**
 * Matrix slice TIME-PICKER / EVENTS AND INTERACTION.
 *
 * Contract (docs/ai/components/time-picker.md § Events and § Interaction):
 *   `time-change` -> `{ value, hours, minutes, seconds, formatted, timePicker }`
 *     "for valid typed input, selector changes, and after clear."
 *   `timepicker-clear` -> `{ timePicker }`, "before the clear-triggered
 *     `time-change`."
 *   `timepicker-focus` / `timepicker-blur` / `timepicker-open` /
 *     `timepicker-close` -> `{ timePicker }`.
 *   "Property assignment, form reset, and form-state restore emit no synthetic
 *    user-change event."
 *   "Dropdown: input click, clock click, `Enter`, or `ArrowDown` opens;
 *    `Escape` closes. Space is not intercepted…"
 *   "Range logic disables selector intervals wholly outside min/max. Guards
 *    also reject disabled option events."
 *   "Public `clear()` remains an imperative API and emits clear then change."
 *
 * Dimensions: opener (4) x format (2) = 8 opening combos, the selector cross
 * (unit 4 x format 2 = 8), the range-disabling sweep, and the event contracts.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unmountAll, product, captureEvents, click, finding } from '../matrix-utils';
import {
  picker, mountPicker, pickerProblems, read, typeInto, clickOption, optionFor,
  pressKey, part, installInternalsMock, restoreInternalsMock, internalsFor,
  FORMATS, type TimePickerFormat,
} from './time-picker-support';

describe('time-picker matrix: opening and closing', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  for (const point of product({
    opener: ['input-click', 'toggle-click', 'Enter', 'ArrowDown'] as const,
    format: FORMATS,
  })) {
    const opener = point.opener as 'input-click' | 'toggle-click' | 'Enter' | 'ArrowDown';
    const format = point.format as TimePickerFormat;

    it(`${opener} opens a ${format} dropdown, and Escape closes it`, async () => {
      const c = picker({ format, defaultValue: '14:05', step: 5, name: 'when' });
      const el = await mountPicker(c);

      switch (opener) {
        case 'input-click': click(part(el, 'input')); break;
        case 'toggle-click': click(part(el, 'toggle')); break;
        default: await pressKey(el, opener); break;
      }
      await (el as any).rendered;
      expect(read(el).dropdownHidden, `${opener} did not open the dropdown`).toBe(false);

      await pressKey(el, 'Escape');
      expect(read(el).dropdownHidden, 'Escape did not close the dropdown').toBe(true);
    });
  }

  /**
   * MATRIX-time-picker-1
   *
   * Combo:    every open and every close, in both variants, by every documented
   *           opener (input click, clock click, Enter, ArrowDown, `open()`) and
   *           by `close()`/Escape/outside click.
   * Expected: § Events lists `timepicker-open` and `timepicker-close` as the
   *           announcements of opening and closing — one announcement per
   *           transition, like every other event this component documents.
   * Actual:   each transition announces itself TWICE. `open()` emits directly
   *           AND sets `showDropdown`, whose `@watch('show-dropdown')` handler
   *           emits again; `close()` does the same with `timepicker-close`. A
   *           listener that counts opens (analytics, a focus trap, a "seen it
   *           once" flag) counts double.
   *
   * The assertion below is the documented one and is NOT weakened; it is
   * declared `it.fails`, so it goes red the day the duplicate is removed and
   * this finding can be closed.
   */
  it.fails(finding('MATRIX-time-picker-1',
    'opening announces itself exactly once'), async () => {
    const c = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['timepicker-open', 'timepicker-close']);

    click(part(el, 'toggle'));
    await (el as any).rendered;
    expect(events.types()).toEqual(['timepicker-open']);

    await pressKey(el, 'Escape');
    expect(events.types()).toEqual(['timepicker-open', 'timepicker-close']);
  });

  it('every open is announced at least once, and every close after it', async () => {
    // The half of the contract that holds today, kept green so a regression to
    // NO event is still caught while MATRIX-time-picker-1 is open.
    const c = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['timepicker-open', 'timepicker-close']);

    click(part(el, 'toggle'));
    await (el as any).rendered;
    expect(events.types().every(type => type === 'timepicker-open')).toBe(true);
    expect(events.types().length).toBeGreaterThan(0);

    await pressKey(el, 'Escape');
    expect(events.types().at(-1)).toBe('timepicker-close');
    expect(events.events.at(-1)!.detail).toEqual({ timePicker: el });
  });

  it('Space is not intercepted, because a 12-hour clock needs it', async () => {
    const c = picker({ format: '12h', step: 5, name: 'when' });
    const el = await mountPicker(c);
    await pressKey(el, ' ');
    expect(read(el).dropdownHidden, 'Space opened the dropdown').toBe(true);

    // …and it can still be typed as part of a 12-hour time.
    await typeInto(el, '2:05 PM');
    expect(internalsFor(el).formValue).toBe('14:05');
  });

  it('open() and close() are the imperative twins of the same state', async () => {
    const c = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['timepicker-open', 'timepicker-close']);

    el.open();
    await (el as any).rendered;
    expect(read(el).dropdownHidden).toBe(false);

    el.close();
    await (el as any).rendered;
    expect(read(el).dropdownHidden).toBe(true);
    // Only the ORDER is asserted here: the count is pinned by
    // MATRIX-time-picker-1 above, and repeating it in every test would spread
    // one finding across the whole slice.
    expect(events.types()[0]).toBe('timepicker-open');
    expect(events.types().at(-1)).toBe('timepicker-close');
  });

  it('the inline variant has nothing to open', async () => {
    const c = picker({ variant: 'inline', defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    el.open();
    await (el as any).rendered;
    // The selectors were already visible; opening cannot hide them.
    expect(read(el).dropdownHidden).toBe(false);
    expect(pickerProblems(el, c)).toEqual([]);
  });

  it('an outside click closes an open dropdown', async () => {
    const c = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    el.open();
    await (el as any).rendered;

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await (el as any).rendered;
    expect(read(el).dropdownHidden, 'an outside click left the dropdown open').toBe(true);
  });
});

describe('time-picker matrix: selectors', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  it('choosing an hour, a minute and a second builds the documented value', async () => {
    const c = picker({
      defaultValue: '00:00:00', showSeconds: true, step: 5, name: 'when',
    });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['time-change']);

    await clickOption(el, 'hours', '14');
    await clickOption(el, 'minutes', '05');
    await clickOption(el, 'seconds', '10');

    expect(internalsFor(el).formValue).toBe('14:05:10');
    expect(read(el).inputValue).toBe('14:05:10');
    expect(events.types(), 'one event per selection').toEqual(
      ['time-change', 'time-change', 'time-change']);
    expect(events.events.at(-1)!.detail).toEqual({
      value: '14:05:10', hours: 14, minutes: 5, seconds: 10,
      formatted: '14:05:10', timePicker: el,
    });
    expect(pickerProblems(el, c, { visible: '14:05:10', canonical: '14:05:10' })).toEqual([]);
  });

  it('the 12-hour period column moves the value across noon', async () => {
    const c = picker({ format: '12h', defaultValue: '02:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    expect(read(el).inputValue).toBe('2:05 AM');

    await clickOption(el, 'period', 'PM');

    expect(internalsFor(el).formValue).toBe('14:05');
    expect(read(el).inputValue).toBe('2:05 PM');
    expect(pickerProblems(el, c, { visible: '2:05 PM', canonical: '14:05' })).toEqual([]);
  });

  it('the selected option in each column is the one the value names', async () => {
    const c = picker({
      format: '12h', showSeconds: true, defaultValue: '14:05:10', step: 5, name: 'when',
    });
    const el = await mountPicker(c);
    const r = read(el);
    expect(r.hours!.selected).toEqual(['2']);
    expect(r.minutes!.selected).toEqual(['05']);
    expect(r.seconds!.selected).toEqual(['10']);
    expect(r.period!.selected).toEqual(['PM']);
  });

  // ── "Range logic disables selector intervals wholly outside min/max" ─────

  it('hours wholly outside the range are disabled, and the boundary hour is not', async () => {
    const c = picker({ minTime: '09:00', maxTime: '17:00', step: 15, name: 'when' });
    const el = await mountPicker(c);
    const hours = read(el).hours!;

    expect(hours.disabled, 'the wrong hours are disabled')
      .toEqual(['00', '01', '02', '03', '04', '05', '06', '07', '08', '18', '19',
        '20', '21', '22', '23']);
    // 17:00 is inclusive, so the 17:00-17:59 interval INTERSECTS the range.
    expect(hours.disabled.includes('17'), 'the inclusive upper bound hour was disabled')
      .toBe(false);
  });

  it('a click on a disabled option changes nothing', async () => {
    const c = picker({ minTime: '09:00', maxTime: '17:00', defaultValue: '09:00', step: 15, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['time-change']);

    const blocked = optionFor(el, 'hours', '03')!;
    expect(blocked.disabled, 'the out-of-range hour is not disabled').toBe(true);
    blocked.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await (el as any).rendered;

    expect(el.value, 'a disabled option moved the value').toBe('09:00');
    expect(events.types(), 'a disabled option emitted an event').toEqual([]);
  });

  it('a period wholly outside the range is disabled', async () => {
    const c = picker({ format: '12h', minTime: '13:00', maxTime: '17:00', step: 15, name: 'when' });
    const el = await mountPicker(c);
    expect(read(el).period!.disabled, 'the morning is still selectable in an afternoon range')
      .toEqual(['AM']);
  });
});

describe('time-picker matrix: the documented events', () => {
  beforeEach(() => { installInternalsMock(); });
  afterEach(() => { restoreInternalsMock(); unmountAll(); });

  it('valid typed input emits one time-change with the documented detail', async () => {
    const c = picker({ format: '12h', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['time-change']);

    await typeInto(el, '2:05 PM');

    expect(events.types()).toEqual(['time-change']);
    expect(events.events[0].detail).toEqual({
      value: '14:05', hours: 14, minutes: 5, seconds: 0,
      formatted: '2:05 PM', timePicker: el,
    });
  });

  it('malformed typed input emits nothing', async () => {
    const c = picker({ step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['time-change']);
    await typeInto(el, '14:');
    expect(events.types(), 'malformed text announced a change').toEqual([]);
  });

  it('clear() emits timepicker-clear and then time-change', async () => {
    const c = picker({ defaultValue: '14:05', clearable: true, step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['timepicker-clear', 'time-change']);

    el.clear();
    await (el as any).rendered;

    expect(events.types(), 'the clear event did not come first')
      .toEqual(['timepicker-clear', 'time-change']);
    expect(events.events[1].detail.value).toBe('');
    expect(internalsFor(el).formValue).toBe('');
    expect(pickerProblems(el, c, { visible: '', canonical: '' })).toEqual([]);
  });

  it('the clear button follows the same order as clear()', async () => {
    const c = picker({ defaultValue: '14:05', clearable: true, step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['timepicker-clear', 'time-change']);

    click(part(el, 'clear'));
    await (el as any).rendered;

    expect(events.types()).toEqual(['timepicker-clear', 'time-change']);
  });

  it('focus and blur are announced', async () => {
    const c = picker({ defaultValue: '14:05', step: 5, name: 'when' });
    const el = await mountPicker(c);
    const events = captureEvents(el, ['timepicker-focus', 'timepicker-blur']);
    const input = part<HTMLInputElement>(el, 'input')!;

    input.dispatchEvent(new FocusEvent('focus', { bubbles: true, composed: true }));
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));
    await (el as any).rendered;

    expect(events.types()).toEqual(['timepicker-focus', 'timepicker-blur']);
    expect(events.events[0].detail).toEqual({ timePicker: el });
  });

  for (const source of ['assignment', 'reset', 'restore'] as const) {
    it(`${source} emits no synthetic user-change event`, async () => {
      const c = picker({ defaultValue: '09:00', step: 5, name: 'when' });
      const el = await mountPicker(c);
      const events = captureEvents(el, ['time-change', 'timepicker-clear']);

      switch (source) {
        case 'assignment': el.value = '11:45'; break;
        case 'reset': el.formResetCallback(); break;
        case 'restore': el.formStateRestoreCallback('11:45'); break;
      }
      await (el as any).rendered;

      expect(events.types(), `${source} announced a user change`).toEqual([]);
    });
  }
});
