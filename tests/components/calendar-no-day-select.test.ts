// `no-day-select` on <snice-calendar>: display-oriented calendars opt out of
// day selection — clicking a day neither highlights it nor fires
// calendar-change, while event bars stay fully interactive.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement } from '../../packages/components/src/calendar/snice-calendar.types';

describe('snice-calendar no-day-select', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  function dayCell(cal: any, day: number): HTMLElement {
    return [...cal.shadowRoot.querySelectorAll('.calendar__day')]
      .find((c: any) => c.__date?.getDate() === day && c.__date?.getMonth() === 5) as HTMLElement;
  }

  it('defaults to selectable days', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    expect((calendar as any).noDaySelect).toBe(false);
  });

  it('clicking a day does not select it and fires no calendar-change', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', { 'no-day-select': true });
    calendar.goToDate(new Date(2026, 5, 15));
    await wait(20);
    const changes: any[] = [];
    (calendar as HTMLElement).addEventListener('calendar-change', (e: any) => changes.push(e.detail));

    const cell = dayCell(calendar as any, 10);
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(20);

    expect(cell.classList.contains('calendar__day--selected')).toBe(false);
    expect(changes).toEqual([]);
  });

  it('Enter on a day cell does not select in no-day-select mode', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', { 'no-day-select': true });
    calendar.goToDate(new Date(2026, 5, 15));
    await wait(20);
    const changes: any[] = [];
    (calendar as HTMLElement).addEventListener('calendar-change', (e: any) => changes.push(e.detail));

    const cell = dayCell(calendar as any, 10);
    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await wait(20);

    expect(cell.classList.contains('calendar__day--selected')).toBe(false);
    expect(changes).toEqual([]);
  });

  it('marks day cells non-interactive for pointer affordance', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', { 'no-day-select': true });
    await wait(20);
    const cell = (calendar as any).shadowRoot.querySelector('.calendar__day') as HTMLElement;
    expect(cell.classList.contains('calendar__day--static')).toBe(true);
  });

  it('event bars remain clickable in no-day-select mode', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', { 'no-day-select': true });
    calendar.goToDate(new Date(2026, 5, 15));
    calendar.events = [{ id: 'e', title: 'E', start: new Date(2026, 5, 10) }];
    await wait(20);
    const clicks: any[] = [];
    (calendar as HTMLElement).addEventListener('calendar-event-click', (e: any) => clicks.push(e.detail.event.id));

    const bar = (calendar as any).shadowRoot.querySelector('.calendar__event-bar') as HTMLElement;
    bar.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(20);
    expect(clicks).toEqual(['e']);
  });

  it('toggling the property back re-enables selection', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', { 'no-day-select': true });
    calendar.goToDate(new Date(2026, 5, 15));
    await wait(20);

    (calendar as any).noDaySelect = false;
    await wait(20);

    const cell = dayCell(calendar as any, 10);
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(20);
    expect(cell.classList.contains('calendar__day--selected')).toBe(true);
  });
});
