import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../components/calendar/snice-calendar.types';

describe('snice-calendar', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) {
      removeComponent(calendar as HTMLElement);
    }
  });

  it('should render', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    expect(calendar).toBeTruthy();
  });

  it('should have default properties', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    expect(calendar.view).toBe('month');
    expect(calendar.highlightToday).toBe(true);
    expect(calendar.showWeekNumbers).toBe(false);
    expect(calendar.firstDayOfWeek).toBe(0);
  });

  it('should support different views', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      view: 'week'
    });
    expect(calendar.view).toBe('week');
  });

  it('should support custom locale', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      locale: 'fr-FR'
    });
    expect(calendar.locale).toBe('fr-FR');
  });

  it('should support events', async () => {
    const events: CalendarEvent[] = [
      { id: 1, title: 'Meeting', start: new Date() }
    ];

    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.events = events;
    await wait();

    expect(calendar.events.length).toBe(1);
  });

  it('should go to today', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    const pastDate = new Date(2020, 0, 1);
    calendar.value = pastDate;
    await wait();

    calendar.goToToday();
    await wait();

    const today = new Date();
    const value = calendar.value instanceof Date ? calendar.value : new Date(calendar.value);
    expect(value.toDateString()).toBe(today.toDateString());
  });

  it.skip('should navigate to previous month', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    const initialMonth = calendar.getDisplayedMonth();

    calendar.previousMonth();
    await wait();

    const newMonth = calendar.getDisplayedMonth();
    expect(newMonth.month).not.toBe(initialMonth.month);
  });

  it.skip('should navigate to next month', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    const initialMonth = calendar.getDisplayedMonth();

    calendar.nextMonth();
    await wait();

    const newMonth = calendar.getDisplayedMonth();
    expect(newMonth.month).not.toBe(initialMonth.month);
  });

  it('should get displayed month', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    const month = calendar.getDisplayedMonth();

    expect(month).toHaveProperty('month');
    expect(month).toHaveProperty('year');
    expect(typeof month.month).toBe('number');
    expect(typeof month.year).toBe('number');
  });

  it('should get events for date', async () => {
    const today = new Date();
    const events: CalendarEvent[] = [
      { id: 1, title: 'Meeting', start: today }
    ];

    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.events = events;
    await wait();

    const dayEvents = calendar.getEventsForDate(today);
    expect(dayEvents.length).toBe(1);
    expect(dayEvents[0].title).toBe('Meeting');
  });

  it('should support min date', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'min-date': new Date(2024, 0, 1).toISOString()
    });
    expect(calendar.minDate).toBeTruthy();
  });

  it('should support max date', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'max-date': new Date(2024, 11, 31).toISOString()
    });
    expect(calendar.maxDate).toBeTruthy();
  });

  it('should support first day of week', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'first-day-of-week': 1
    });
    expect(calendar.firstDayOfWeek).toBe(1);
  });

  it('should support show week numbers', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', {
      'show-week-numbers': true
    });
    expect(calendar.showWeekNumbers).toBe(true);
  });

  it('should go to specific date', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    const targetDate = new Date(2024, 5, 15);

    calendar.goToDate(targetDate);
    await wait();

    const value = calendar.value instanceof Date ? calendar.value : new Date(calendar.value);
    expect(value.toDateString()).toBe(targetDate.toDateString());
  });
});
