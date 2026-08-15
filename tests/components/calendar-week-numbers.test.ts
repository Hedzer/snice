import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement } from '../../packages/components/src/calendar/snice-calendar.types';

/**
 * `show-week-numbers` must actually draw a week-number column: a leading
 * column in the grid, a header corner cell, and one number per week row —
 * with the day cells pushed one column right so nothing overlaps.
 *
 * Numbering follows the start of the week: Monday-start calendars use
 * ISO-8601, every other start uses the "week containing January 1 is week 1"
 * rule.
 */
describe('snice-calendar show-week-numbers', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  const shadow = (el: SniceCalendarElement) => (el as any).shadowRoot as ShadowRoot;
  const weekNumbers = (el: SniceCalendarElement) =>
    [...shadow(el).querySelectorAll('.calendar__week-number:not(.calendar__week-number--header)')]
      .map(n => (n as HTMLElement).textContent!.trim());

  it('draws no week-number column by default', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    expect(calendar.showWeekNumbers).toBe(false);
    expect(shadow(calendar).querySelectorAll('.calendar__week-number').length).toBe(0);
    const firstDay = shadow(calendar).querySelector('.calendar__day') as HTMLElement;
    expect(firstDay.style.gridColumn).toBe('1');
  });

  it('draws one number per week row plus a header corner cell', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true,
    });
    calendar.goToDate(new Date(2026, 7, 14)); // August 2026
    await wait(20);

    expect(weekNumbers(calendar).length).toBe(6);
    expect(shadow(calendar).querySelectorAll('.calendar__week-number--header').length).toBe(1);
    expect(weekNumbers(calendar).every(text => /^\d+$/.test(text))).toBe(true);
  });

  it('pushes the weekday header and day cells one column right', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true,
    });
    await wait(20);

    const weekdays = [...shadow(calendar).querySelectorAll('.calendar__weekday')] as HTMLElement[];
    expect(weekdays[0].style.gridColumn).toBe('2');
    expect(weekdays[6].style.gridColumn).toBe('8');

    const days = [...shadow(calendar).querySelectorAll('.calendar__day')] as HTMLElement[];
    expect(days[0].style.gridColumn).toBe('2');
    expect(days[6].style.gridColumn).toBe('8');
    expect(days[7].style.gridColumn).toBe('2');

    // Every week-number cell owns the reserved first column.
    const numbers = [...shadow(calendar).querySelectorAll('.calendar__week-number')] as HTMLElement[];
    expect(numbers.every(n => n.style.gridColumn === '1')).toBe(true);
  });

  it('numbers Sunday-start weeks with the January-1 rule', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true,
    });
    calendar.goToDate(new Date(2026, 0, 15)); // January 2026, Sunday start
    await wait(20);

    // 2026-01-01 is a Thursday, so week 1 starts Sun 2025-12-28 — the grid's
    // first row. Six consecutive week rows follow.
    expect(weekNumbers(calendar)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('numbers Monday-start weeks with ISO-8601', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true,
      'first-day-of-week': 1,
    });
    calendar.goToDate(new Date(2026, 0, 15)); // January 2026, Monday start
    await wait(20);

    // ISO week 1 of 2026 is the week of Mon 2025-12-29 (it holds Thu 2026-01-01).
    expect(weekNumbers(calendar)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('numbers a December grid across the year boundary', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true,
      'first-day-of-week': 1,
    });
    calendar.goToDate(new Date(2025, 11, 15)); // December 2025, Monday start
    await wait(20);

    // Rows start Mon 2025-12-01 (ISO week 49) and run into 2026's week 1/2.
    expect(weekNumbers(calendar)).toEqual(['49', '50', '51', '52', '1', '2']);
  });

  it('adds and removes the column when the property toggles', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    await wait(20);
    expect(shadow(calendar).querySelectorAll('.calendar__week-number').length).toBe(0);

    calendar.showWeekNumbers = true;
    await wait(20);
    expect(weekNumbers(calendar).length).toBe(6);
    expect((shadow(calendar).querySelector('.calendar__day') as HTMLElement).style.gridColumn).toBe('2');

    calendar.showWeekNumbers = false;
    await wait(20);
    expect(shadow(calendar).querySelectorAll('.calendar__week-number').length).toBe(0);
    expect((shadow(calendar).querySelector('.calendar__day') as HTMLElement).style.gridColumn).toBe('1');
  });

  it('keeps event stripes aligned with their days when the column is shown', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true,
    });
    calendar.goToDate(new Date(2026, 7, 14));
    calendar.events = [{ id: 'e1', title: 'Ship', start: new Date(2026, 7, 5) }];
    await wait(30);

    const bar = shadow(calendar).querySelector('.calendar__event-bar') as HTMLElement;
    expect(bar).toBeTruthy();
    // Aug 5 2026 is a Wednesday: column 4 of the day grid, 5 with the offset.
    expect(bar.style.gridColumn).toBe('5 / 6');
  });

  it('exposes week numbers to assistive tech as row headers', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true,
    });
    await wait(20);

    const cells = [...shadow(calendar).querySelectorAll(
      '.calendar__week-number:not(.calendar__week-number--header)')] as HTMLElement[];
    expect(cells.every(c => c.getAttribute('role') === 'rowheader')).toBe(true);
    expect(cells.every(c => /^Week \d+$/.test(c.getAttribute('aria-label') || ''))).toBe(true);
  });
});
