/**
 * Matrix slice DATE-TIME-PICKER / EVENTS — what the control tells its host.
 *
 * Documented contract:
 *
 *     'datetime-change' -> { value, date, dateString, timeString, iso, dateTimePicker }
 *     'datetimepicker-focus' / 'datetimepicker-blur'
 *     'datetimepicker-open' / 'datetimepicker-close'
 *     'datetimepicker-clear'
 *
 *   · "Reset/restore do not emit customer events."
 *   · "Clear preserves existing event order: clear, then change."
 *
 * The cross: every documented emitter is exercised through both the method and
 * the user-facing affordance where it has one (open() and the toggle button,
 * clear() and the clear button), and the change detail is checked against the
 * documented shape for a selection made in each of the three panel surfaces
 * (calendar day, hour column, period column).
 *
 * ── FINDING MATRIX-date-time-picker-1 ───────────────────────────────────────
 * A single open dispatches `datetimepicker-open` TWICE, and a single close
 * dispatches `datetimepicker-close` twice. `open()` emits the event itself and
 * ALSO sets `showPanel = true`, whose `@watch('show-panel')` handler emits the
 * same event again; `close()` is the mirror image.
 *
 *   combo:    variant=dropdown, enabled, open() called once
 *   expected: ['datetimepicker-open']
 *   actual:   ['datetimepicker-open', 'datetimepicker-open']
 *
 *   combo:    variant=dropdown, open, close() called once
 *   expected: ['datetimepicker-close']
 *   actual:   ['datetimepicker-close', 'datetimepicker-close']
 *
 *   combo:    variant=dropdown, enabled, the toggle button clicked once
 *   expected: ['datetimepicker-open']
 *   actual:   ['datetimepicker-open', 'datetimepicker-open']
 *
 * Any host that counts opens — an analytics hook, a "load the slots once the
 * calendar appears" fetch — fires twice per interaction. The assertions below
 * are the documented ones and are NOT weakened; they are marked `it.fails` so
 * the divergence is reported.
 *
 * Everything else in this file passes.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPicker, cleanupPickers, installInternalsMock, restoreInternalsMock,
  collectEvents, sequence, readFacts, part, click, shadow,
  wait, SETTLE, inputOf,
} from './date-time-picker-support';

describe('date-time-picker matrix: events', () => {
  beforeEach(() => installInternalsMock());
  afterEach(() => { cleanupPickers(); restoreInternalsMock(); });

  // ── MATRIX-date-time-picker-1 ─────────────────────────────────────────────

  it.fails('MATRIX-date-time-picker-1 open() announces one open', async () => {
    const el = await mountPicker({});
    const seen = collectEvents(el, ['datetimepicker-open']);

    el.open();
    await wait(SETTLE);

    expect(readFacts(el).panelOpen, 'the panel did open').toBe(true);
    expect(sequence(seen)).toEqual(['datetimepicker-open']);
  });

  it.fails('MATRIX-date-time-picker-1 close() announces one close', async () => {
    const el = await mountPicker({});
    el.open();
    await wait(SETTLE);

    const seen = collectEvents(el, ['datetimepicker-close']);
    el.close();
    await wait(SETTLE);

    expect(readFacts(el).panelOpen, 'the panel did close').toBe(false);
    expect(sequence(seen)).toEqual(['datetimepicker-close']);
  });

  it.fails('MATRIX-date-time-picker-1 the toggle button announces one open', async () => {
    const el = await mountPicker({});
    const seen = collectEvents(el, ['datetimepicker-open']);

    click(part(el, 'toggle'));
    await wait(SETTLE);

    expect(readFacts(el).panelOpen).toBe(true);
    expect(sequence(seen)).toEqual(['datetimepicker-open']);
  });

  // The state transition itself is correct, which is what makes the duplicate
  // dispatch a reporting bug rather than a broken panel.
  it('open() and close() do move the panel between its two states', async () => {
    const el = await mountPicker({});
    expect(readFacts(el).panelOpen).toBe(false);
    el.open();
    await wait(SETTLE);
    expect(readFacts(el).panelOpen).toBe(true);
    el.close();
    await wait(SETTLE);
    expect(readFacts(el).panelOpen).toBe(false);
  });

  // ── Clear ─────────────────────────────────────────────────────────────────

  it('clear() emits clear then change, in that order', async () => {
    const el = await mountPicker({ attrs: { clearable: true }, liveValue: '2026-03-10T14:05' });
    const seen = collectEvents(el, ['datetimepicker-clear', 'datetime-change']);

    el.clear();
    await wait(SETTLE);

    expect(sequence(seen)).toEqual(['datetimepicker-clear', 'datetime-change']);
    expect(el.value).toBe('');
    expect(readFacts(el).formValue).toBe('');
  });

  it('the clear button emits clear then change, in that order', async () => {
    const el = await mountPicker({ attrs: { clearable: true }, liveValue: '2026-03-10T14:05' });
    const seen = collectEvents(el, ['datetimepicker-clear', 'datetime-change']);

    click(part(el, 'clear'));
    await wait(SETTLE);

    expect(sequence(seen)).toEqual(['datetimepicker-clear', 'datetime-change']);
    expect(el.value).toBe('');
  });

  it('the change that follows a clear reports an empty value', async () => {
    const el = await mountPicker({ attrs: { clearable: true }, liveValue: '2026-03-10T14:05' });
    const seen = collectEvents(el, ['datetime-change']);

    el.clear();
    await wait(SETTLE);

    expect(seen[0].detail.value).toBe('');
    expect(seen[0].detail.date).toBeNull();
    expect(seen[0].detail.iso).toBe('');
  });

  // ── Change, from each panel surface ───────────────────────────────────────

  it('selecting a calendar day emits the documented change detail', async () => {
    const el = await mountPicker({ liveValue: '2026-03-10T14:05' });
    el.open();
    await wait(SETTLE);

    const seen = collectEvents(el, ['datetime-change']);
    const days = [...shadow(el).querySelectorAll('.calendar-days .day')]
      .filter(day => !day.classList.contains('day--empty'));
    click(days[14]); // the 15th
    await wait(SETTLE);

    expect(seen).toHaveLength(1);
    const detail = seen[0].detail;
    expect(detail.value).toBe('2026-03-15T14:05');
    expect(detail.dateString).toBe('2026-03-15');
    expect(detail.timeString).toBe('14:05');
    expect(detail.iso, 'iso is the canonical LOCAL datetime').toBe('2026-03-15T14:05');
    expect(detail.date).toBeInstanceOf(Date);
    expect(detail.dateTimePicker, 'the detail carries the control itself').toBe(el);
  });

  it('selecting an hour keeps the date and moves only the time', async () => {
    const el = await mountPicker({
      attrs: { 'time-format': '24h' },
      liveValue: '2026-03-10T14:05',
    });
    el.open();
    await wait(SETTLE);

    const seen = collectEvents(el, ['datetime-change']);
    const hours = [...shadow(el).querySelectorAll('[data-time-unit="hours"] .time-item')];
    click(hours[9]);
    await wait(SETTLE);

    expect(seen).toHaveLength(1);
    expect(seen[0].detail.dateString, 'the date must not move').toBe('2026-03-10');
    expect(el.value.startsWith('2026-03-10T')).toBe(true);
  });

  it('on a 12-hour clock the period column moves the value by twelve hours', async () => {
    const el = await mountPicker({
      attrs: { 'time-format': '12h' },
      liveValue: '2026-03-10T14:05',
    });
    el.open();
    await wait(SETTLE);

    const period = [...shadow(el).querySelectorAll('[data-time-unit="period"] .time-item')];
    expect(period, 'a 12-hour clock has an AM and a PM').toHaveLength(2);

    click(period[0]); // AM
    await wait(SETTLE);

    expect(el.value).toBe('2026-03-10T02:05');
  });

  // ── Focus and blur ────────────────────────────────────────────────────────

  it('the editable field reports focus and blur', async () => {
    const el = await mountPicker({});
    const seen = collectEvents(el, ['datetimepicker-focus', 'datetimepicker-blur']);

    inputOf(el)?.dispatchEvent(new FocusEvent('focus', { bubbles: true, composed: true }));
    await wait(SETTLE);
    inputOf(el)?.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));
    await wait(SETTLE);

    expect(sequence(seen)).toEqual(['datetimepicker-focus', 'datetimepicker-blur']);
  });

  // ── Silence where the docs require it ─────────────────────────────────────

  it('assigning value directly is silent', async () => {
    const el = await mountPicker({});
    const seen = collectEvents(el);

    el.value = '2026-03-10T14:05';
    await wait(SETTLE);

    expect(sequence(seen)).toEqual([]);
  });

  it('form.reset() restores the default without emitting customer events', async () => {
    const el = await mountPicker({ attrs: { value: '2026-03-10T14:05' } });
    el.value = '2026-04-01T08:00';
    await wait(SETTLE);

    const seen = collectEvents(el);
    (el as any).formResetCallback();
    await wait(SETTLE);

    expect(el.value, 'reset restores defaultValue').toBe('2026-03-10T14:05');
    expect(sequence(seen), 'reset is silent').toEqual([]);
  });

  it('state restoration is silent', async () => {
    const el = await mountPicker({});
    const seen = collectEvents(el);

    (el as any).formStateRestoreCallback('2026-03-10T14:05', 'restore');
    await wait(SETTLE);

    expect(el.value).toBe('2026-03-10T14:05');
    expect(sequence(seen)).toEqual([]);
  });

  it('restoration ignores File, FormData and null', async () => {
    const el = await mountPicker({ liveValue: '2026-03-10T14:05' });

    for (const state of [null, new File([], 'x.txt'), new FormData()]) {
      (el as any).formStateRestoreCallback(state, 'restore');
      await wait(SETTLE);
      expect(el.value, `restoring ${state === null ? 'null' : state.constructor.name} changed the value`)
        .toBe('2026-03-10T14:05');
    }
  });

  it('restoration preserves the exact visible text, even when impossible', async () => {
    const el = await mountPicker({});
    (el as any).formStateRestoreCallback('2026-02-30T10:00', 'restore');
    await wait(SETTLE);

    const facts = readFacts(el);
    expect(facts.visible).toBe('2026-02-30T10:00');
    expect(facts.flags).toEqual(['badInput']);
    expect(facts.formValue).toBe('');
  });
});
