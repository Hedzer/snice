// Defect guard: clicking a day's "+N more" chip must DO something on its own.
//
// The chip already reported its day through `calendar-more-click`, but that
// event is app-defined wiring — a calendar dropped on a page with no listener
// showed a control that visibly did nothing when clicked, which reads as
// broken. The component now owns a default action: the chip opens the shared
// `.calendar__popover` overlay listing that day's hidden events, with the same
// Escape / outside-click dismissal and focus return the event popover uses.
//
// The default is a default, not a policy: `calendar-more-click` is cancelable,
// so an app that wants its own day view calls `event.preventDefault()` and the
// built-in panel never opens.
//
// happy-dom lays nothing out, so the lane budget falls back to
// DEFAULT_EVENT_LANES (3): a day carrying five single-day events renders three
// bars and hides two behind the chip.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../packages/components/src/calendar/snice-calendar.types';

const DAY = new Date(2026, 5, 10); // Wed 10 June 2026

const q = (cal: any, sel: string) => cal.shadowRoot.querySelector(sel) as HTMLElement | null;
const qa = (cal: any, sel: string) =>
  Array.from(cal.shadowRoot.querySelectorAll(sel)) as HTMLElement[];

const chip = (cal: any) => q(cal, '.calendar__more')!;
const panel = (cal: any) => q(cal, '.calendar__popover')!;
const entries = (cal: any) => qa(cal, '.calendar__more-item');

function fiveOn(day: Date): CalendarEvent[] {
  return [
    { id: 'a', title: 'Alpha', start: day, color: '#dc2626' },
    { id: 'b', title: 'Beta', start: day, color: '#2563eb' },
    { id: 'c', title: 'Gamma', start: day, color: '#16a34a' },
    { id: 'd', title: 'Delta', start: day, color: '#7c3aed' },
    { id: 'e', title: 'Epsilon', start: day, color: '#f59e0b' },
  ];
}

describe('snice-calendar — built-in "+N more" panel', () => {
  let calendar: SniceCalendarElement | undefined;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
    calendar = undefined;
  });

  async function makeCalendar(events: CalendarEvent[] = fiveOn(DAY)): Promise<any> {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    (calendar as any).goToDate(new Date(DAY));
    (calendar as any).events = events;
    await wait(20);
    return calendar as any;
  }

  it('opens a panel listing the hidden events when the chip is clicked', async () => {
    const cal = await makeCalendar();
    expect(chip(cal).textContent).toBe('+2 more');
    expect(panel(cal).hidden).toBe(true);

    chip(cal).click();
    await wait(20);

    expect(panel(cal).hidden).toBe(false);
    // Exactly the events the lane budget dropped — not the whole day.
    expect(entries(cal).map(e => e.textContent?.trim())).toEqual(['Delta', 'Epsilon']);
  });

  it('shows each entry with its event colour dot', async () => {
    const cal = await makeCalendar();
    chip(cal).click();
    await wait(20);

    const dots = qa(cal, '.calendar__more-dot');
    expect(dots.length).toBe(2);
    expect(dots[0].style.background).toBe('#7c3aed'); // Delta
    expect(dots[1].style.background).toBe('#f59e0b'); // Epsilon
  });

  it('makes calendar-more-click cancelable and suppresses the panel on preventDefault', async () => {
    const cal = await makeCalendar();
    let seen: Event | null = null;
    cal.addEventListener('calendar-more-click', (e: Event) => {
      seen = e;
      e.preventDefault();
    });

    chip(cal).click();
    await wait(20);

    expect(seen).not.toBeNull();
    expect((seen as unknown as Event).cancelable).toBe(true);
    expect(panel(cal).hidden).toBe(true);
    expect(entries(cal).length).toBe(0);
  });

  it('still reports the day and hidden count on the event', async () => {
    const cal = await makeCalendar();
    let detail: any = null;
    cal.addEventListener('calendar-more-click', (e: any) => { detail = e.detail; });

    chip(cal).click();
    await wait(20);

    expect(detail.count).toBe(2);
    expect(detail.date.getDate()).toBe(10);
    expect(detail.calendar).toBe(cal);
  });

  it('fires calendar-event-click when a panel entry is activated', async () => {
    const cal = await makeCalendar();
    const clicked: string[] = [];
    cal.addEventListener('calendar-event-click', (e: any) => clicked.push(e.detail.event.id));

    chip(cal).click();
    await wait(20);
    entries(cal)[1].click();
    await wait(20);

    expect(clicked).toEqual(['e']);
  });

  it('opens the event popover for an entry whose event has popover content', async () => {
    const events = fiveOn(DAY);
    events[4].popover = 'Epsilon runs all afternoon';
    const cal = await makeCalendar(events);

    chip(cal).click();
    await wait(20);
    entries(cal)[1].click();
    await wait(30);

    expect(panel(cal).hidden).toBe(false);
    expect(panel(cal).textContent).toContain('Epsilon runs all afternoon');
    // The list has been replaced by the event's own details.
    expect(entries(cal).length).toBe(0);
  });

  it('closes the panel on Escape and returns focus to the chip', async () => {
    const cal = await makeCalendar();
    chip(cal).click();
    await wait(20);
    expect(panel(cal).hidden).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(20);

    expect(panel(cal).hidden).toBe(true);
    expect(cal.shadowRoot.activeElement).toBe(chip(cal));
  });

  it('closes the panel on an outside pointer press', async () => {
    const cal = await makeCalendar();
    chip(cal).click();
    await wait(20);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    await wait(20);

    expect(panel(cal).hidden).toBe(true);
  });

  it('exposes the panel as a labelled dialog with activatable entries', async () => {
    const cal = await makeCalendar();
    chip(cal).click();
    await wait(20);

    const dialog = panel(cal);
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-label')).toContain('June');
    expect(q(cal, '.calendar__more-list')?.getAttribute('role')).toBe('list');
    entries(cal).forEach(entry => {
      expect(entry.tagName).toBe('BUTTON');
      expect(entry.getAttribute('part')).toBe('more-item');
      expect(entry.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  it('reports the panel state on the chip through aria-expanded', async () => {
    // The chip advertises aria-haspopup="dialog"; a trigger that claims a popup
    // owes the reader whether it is currently showing.
    const cal = await makeCalendar();
    expect(chip(cal).getAttribute('aria-haspopup')).toBe('dialog');
    expect(chip(cal).getAttribute('aria-expanded')).toBe('false');

    chip(cal).click();
    await wait(20);
    expect(chip(cal).getAttribute('aria-expanded')).toBe('true');

    (cal as any).closeEventPopover();
    await wait(20);
    expect(chip(cal).getAttribute('aria-expanded')).toBe('false');
  });

  it('re-opens with the current day when a different chip is clicked', async () => {
    const other = new Date(2026, 5, 17);
    const cal = await makeCalendar([
      ...fiveOn(DAY),
      ...fiveOn(other).map(e => ({ ...e, id: `x-${e.id}`, title: `X${e.title}` })),
    ]);

    const chips = qa(cal, '.calendar__more');
    expect(chips.length).toBe(2);

    chips[0].click();
    await wait(20);
    expect(entries(cal).map(e => e.textContent?.trim())).toEqual(['Delta', 'Epsilon']);

    chips[1].click();
    await wait(20);
    expect(entries(cal).map(e => e.textContent?.trim())).toEqual(['XDelta', 'XEpsilon']);
  });
});
