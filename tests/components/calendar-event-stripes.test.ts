// Continuous event stripes in <snice-calendar>: multi-day events render as
// bars that span their days within each week row and chop at week boundaries
// with continues-left/right styling — one bar per (event × week), lane-stacked
// like professional calendars, with a per-day "+N more" overflow chip.
//
// Fixed frame: June 2026, firstDayOfWeek=0 → the month grid starts on
// Sunday May 31 2026. Week row 0 spans May 31 – Jun 6, row 1 Jun 7 – 13.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../packages/components/src/calendar/snice-calendar.types';

describe('snice-calendar event stripes', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  async function makeCalendar(events: CalendarEvent[]) {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.goToDate(new Date(2026, 5, 15)); // June 2026
    calendar.events = events;
    await wait(20);
    return calendar as any;
  }

  function bars(cal: any, eventId?: string | number) {
    const all = Array.from(
      cal.shadowRoot.querySelectorAll('.calendar__event-bar')) as HTMLElement[];
    return eventId === undefined
      ? all
      : all.filter(b => b.getAttribute('data-event-id') === String(eventId));
  }

  it('renders a single-day event as a one-column bar with no continuation', async () => {
    const cal = await makeCalendar([
      { id: 'solo', title: 'Standup', start: new Date(2026, 5, 2) },
    ]);

    const segs = bars(cal, 'solo');
    expect(segs.length).toBe(1);
    const bar = segs[0];
    // May 31 = column 1 (Sunday), so Jun 2 (Tuesday) = column 3; row 1 is the
    // weekday header, so week row 0 = grid row 2.
    expect(bar.style.gridColumn).toBe('3 / 4');
    expect(bar.style.gridRow).toBe('2');
    expect(bar.textContent).toBe('Standup');
    expect(bar.classList.contains('calendar__event-bar--continues-left')).toBe(false);
    expect(bar.classList.contains('calendar__event-bar--continues-right')).toBe(false);
  });

  it('renders a within-week range as one continuous bar spanning its days', async () => {
    const cal = await makeCalendar([
      { id: 'trip', title: 'Trip', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
    ]);

    const segs = bars(cal, 'trip');
    expect(segs.length).toBe(1);
    expect(segs[0].style.gridColumn).toBe('3 / 7'); // Tue..Fri = cols 3-6
    expect(segs[0].style.gridRow).toBe('2');
  });

  it('chops a cross-week range at the week boundary with continuation styling', async () => {
    const cal = await makeCalendar([
      { id: 'conf', title: 'Conf', start: new Date(2026, 5, 4), end: new Date(2026, 5, 10) },
    ]);

    const segs = bars(cal, 'conf');
    expect(segs.length).toBe(2);

    const [first, second] = segs;
    expect(first.style.gridRow).toBe('2');
    expect(first.style.gridColumn).toBe('5 / 8'); // Thu Jun 4 .. Sat Jun 6
    expect(first.classList.contains('calendar__event-bar--continues-right')).toBe(true);
    expect(first.classList.contains('calendar__event-bar--continues-left')).toBe(false);

    expect(second.style.gridRow).toBe('3');
    expect(second.style.gridColumn).toBe('1 / 5'); // Sun Jun 7 .. Wed Jun 10
    expect(second.classList.contains('calendar__event-bar--continues-left')).toBe(true);
    expect(second.classList.contains('calendar__event-bar--continues-right')).toBe(false);

    // The title repeats on every weekly segment, like pro calendars.
    expect(first.textContent).toBe('Conf');
    expect(second.textContent).toBe('Conf');
  });

  it('marks an event flowing in from before the visible grid as continuing left', async () => {
    const cal = await makeCalendar([
      { id: 'long', title: 'Long', start: new Date(2026, 4, 20), end: new Date(2026, 5, 1) },
    ]);

    const segs = bars(cal, 'long');
    expect(segs.length).toBe(1);
    expect(segs[0].style.gridRow).toBe('2');
    expect(segs[0].style.gridColumn).toBe('1 / 3'); // May 31 .. Jun 1
    expect(segs[0].classList.contains('calendar__event-bar--continues-left')).toBe(true);
  });

  it('stacks overlapping events into stable lanes (earlier start first, longer first on ties)', async () => {
    const cal = await makeCalendar([
      { id: 'b', title: 'B', start: new Date(2026, 5, 4), end: new Date(2026, 5, 10) },
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
      { id: 'c', title: 'C', start: new Date(2026, 5, 2) },
    ]);

    // Week 0: A starts first → lane 0; C ties A's start but is shorter → lane 1;
    // B overlaps A → first free lane 1 for its columns.
    expect(bars(cal, 'a')[0].getAttribute('data-lane')).toBe('0');
    expect(bars(cal, 'c')[0].getAttribute('data-lane')).toBe('1');
    expect(bars(cal, 'b')[0].getAttribute('data-lane')).toBe('1');

    // Week 1: B is alone → back to lane 0.
    expect(bars(cal, 'b')[1].getAttribute('data-lane')).toBe('0');
  });

  it('caps visible lanes and shows a per-day "+N more" chip for the overflow', async () => {
    const day = new Date(2026, 5, 3);
    const cal = await makeCalendar([
      { id: 1, title: 'One', start: day },
      { id: 2, title: 'Two', start: day },
      { id: 3, title: 'Three', start: day },
      { id: 4, title: 'Four', start: day },
      { id: 5, title: 'Five', start: day },
    ]);

    const visible = bars(cal);
    expect(visible.length).toBe(3); // lanes 0-2 render, 4th/5th don't

    const cells = Array.from(cal.shadowRoot.querySelectorAll('.calendar__day')) as HTMLElement[];
    const jun3 = cells.find(c => (c as any).__date?.getDate() === 3
      && (c as any).__date?.getMonth() === 5)!;
    const more = jun3.querySelector('.calendar__more') as HTMLElement;
    expect(more).toBeTruthy();
    expect(more.textContent).toBe('+2 more');

    // Days without overflow show no chip.
    const jun9 = cells.find(c => (c as any).__date?.getDate() === 9
      && (c as any).__date?.getMonth() === 5)!;
    expect(jun9.querySelector('.calendar__more')).toBeNull();
  });

  it('grows week-row height with the lane stack so bars never spill out', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
      { id: 'b', title: 'B', start: new Date(2026, 5, 3) },
      { id: 'c', title: 'C', start: new Date(2026, 5, 3) },
    ]);

    const cells = Array.from(cal.shadowRoot.querySelectorAll('.calendar__day')) as HTMLElement[];
    // Week row 0 (cells 0-6) stacks three lanes — every cell in the row
    // reserves that height; a week with no events reserves none.
    for (const cell of cells.slice(0, 7)) {
      expect(cell.style.getPropertyValue('--calendar-week-lanes')).toBe('3');
    }
    for (const cell of cells.slice(7, 14)) {
      expect(cell.style.getPropertyValue('--calendar-week-lanes')).toBe('');
    }
  });

  it('reserves extra row height for the "+N more" chip', async () => {
    const day = new Date(2026, 5, 3);
    const cal = await makeCalendar([
      { id: 1, title: 'One', start: day },
      { id: 2, title: 'Two', start: day },
      { id: 3, title: 'Three', start: day },
      { id: 4, title: 'Four', start: day },
    ]);

    const cells = Array.from(cal.shadowRoot.querySelectorAll('.calendar__day')) as HTMLElement[];
    for (const cell of cells.slice(0, 7)) {
      expect(cell.style.getPropertyValue('--calendar-week-lanes')).toBe('3');
      expect(cell.style.getPropertyValue('--calendar-week-more')).toBe('1rem');
    }
  });

  it('clears reserved row height when events leave the visible month', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
    ]);
    const cells = Array.from(cal.shadowRoot.querySelectorAll('.calendar__day')) as HTMLElement[];
    expect(cells[0].style.getPropertyValue('--calendar-week-lanes')).toBe('1');

    calendar.nextMonth();
    await wait(20);
    expect(cells[0].style.getPropertyValue('--calendar-week-lanes')).toBe('');
  });

  it('clicking a bar dispatches calendar-event-click and not a day selection', async () => {
    const cal = await makeCalendar([
      { id: 'trip', title: 'Trip', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
    ]);

    const clicked: any[] = [];
    const changed: any[] = [];
    (cal as HTMLElement).addEventListener('calendar-event-click',
      (e: any) => clicked.push(e.detail.event));
    (cal as HTMLElement).addEventListener('calendar-change',
      (e: any) => changed.push(e.detail.value));

    bars(cal, 'trip')[0].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(10);

    expect(clicked.length).toBe(1);
    expect(clicked[0].id).toBe('trip');
    expect(changed.length).toBe(0);
  });

  it('applies the event color to its bars', async () => {
    const cal = await makeCalendar([
      { id: 'conf', title: 'Conf', start: new Date(2026, 5, 4), end: new Date(2026, 5, 10), color: 'rgb(200, 30, 30)' },
    ]);

    for (const bar of bars(cal, 'conf')) {
      expect(bar.style.background).toContain('rgb(200, 30, 30)');
    }
  });

  it('forwards a custom className onto the bar and its part attribute', async () => {
    const cal = await makeCalendar([
      { id: 'conf', title: 'Conf', start: new Date(2026, 5, 4), end: new Date(2026, 5, 10), className: 'urgent' },
      { id: 'solo', title: 'Standup', start: new Date(2026, 5, 2) },
    ]);

    for (const bar of bars(cal, 'conf')) {
      expect(bar.classList.contains('urgent')).toBe(true);
      // Exposed as an extra part name so consumers can style specific events
      // from outside: snice-calendar::part(urgent) { ... }
      expect(bar.getAttribute('part')).toBe('event-bar urgent');
    }
    expect(bars(cal, 'solo')[0].getAttribute('part')).toBe('event-bar');
  });

  it('renders an optional avatar as <snice-avatar> on every segment of the bar', async () => {
    const src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
    const cal = await makeCalendar([
      { id: 'conf', title: 'Conf', start: new Date(2026, 5, 4), end: new Date(2026, 5, 10),
        avatar: { src, name: 'Ada Lovelace', alt: 'Ada' } },
      { id: 'solo', title: 'Standup', start: new Date(2026, 5, 2) },
    ]);

    const segs = bars(cal, 'conf');
    expect(segs.length).toBe(2);
    for (const bar of segs) {
      const avatar = bar.querySelector('snice-avatar.calendar__event-avatar') as any;
      expect(avatar).toBeTruthy();
      expect(avatar.src).toBe(src);
      expect(avatar.name).toBe('Ada Lovelace');
      expect(avatar.alt).toBe('Ada');
      expect(avatar.getAttribute('part')).toBe('event-avatar');
      // Attributes (not just properties) so the avatar's :host([shape])/
      // :host([size]) styling applies — otherwise the avatar renders square.
      expect(avatar.getAttribute('shape')).toBe('circle');
      expect(avatar.getAttribute('size')).toBe('xs');
      // Bar avatars are tiny thumbnails — eager loading, since lazy-load
      // gives nothing at this size and stalls on very tall pages.
      expect(avatar.getAttribute('loading')).toBe('eager');
      // The title still reads correctly next to the avatar.
      expect((bar.querySelector('.calendar__event-title') as HTMLElement).textContent).toBe('Conf');
    }

    expect(bars(cal, 'solo')[0].querySelector('snice-avatar')).toBeNull();
  });

  it('accepts a plain string avatar as image-src shorthand', async () => {
    const cal = await makeCalendar([
      { id: 'solo', title: 'Standup', start: new Date(2026, 5, 2), avatar: '/avatars/sam.png' },
    ]);

    const avatar = bars(cal, 'solo')[0].querySelector('snice-avatar') as any;
    expect(avatar).toBeTruthy();
    expect(avatar.src).toBe('/avatars/sam.png');
  });

  it('renders an initials-only avatar when only a name is given', async () => {
    const cal = await makeCalendar([
      { id: 'solo', title: 'Standup', start: new Date(2026, 5, 2), avatar: { name: 'Dana Ives' } },
    ]);

    const avatar = bars(cal, 'solo')[0].querySelector('snice-avatar') as any;
    expect(avatar).toBeTruthy();
    expect(avatar.name).toBe('Dana Ives');
    expect(avatar.src).toBeFalsy();
  });

  it('shows a static string tooltip on bar hover and hides on leave', async () => {
    const cal = await makeCalendar([
      { id: 'solo', title: 'Standup', start: new Date(2026, 5, 2), tooltip: 'Daily standup, room 4' },
    ]);

    const tip = cal.shadowRoot.querySelector('.calendar__tooltip') as HTMLElement;
    expect(tip.hidden).toBe(true);

    const bar = bars(cal, 'solo')[0];
    bar.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(10);
    expect(tip.hidden).toBe(false);
    expect(tip.textContent).toBe('Daily standup, room 4');
    expect(bar.getAttribute('aria-describedby')).toBe(tip.id);

    bar.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(10);
    expect(tip.hidden).toBe(true);
    expect(bar.hasAttribute('aria-describedby')).toBe(false);
  });

  it('loads rich tooltip content lazily from the eventTooltip provider', async () => {
    const cal = await makeCalendar([
      { id: 'conf', title: 'Conf', start: new Date(2026, 5, 4), end: new Date(2026, 5, 10) },
    ]);

    const seen: any[] = [];
    (calendar as any).eventTooltip = async (event: CalendarEvent) => {
      seen.push(event.id);
      await wait(5); // simulates fetching details
      const rich = document.createElement('div');
      rich.innerHTML = '<strong>Conf 2026</strong><p>3 attendees</p>';
      return rich;
    };

    const bar = bars(cal, 'conf')[0];
    bar.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    const tip = cal.shadowRoot.querySelector('.calendar__tooltip') as HTMLElement;
    expect(seen).toEqual(['conf']);
    expect(tip.hidden).toBe(false);
    expect(tip.querySelector('strong')?.textContent).toBe('Conf 2026');
    expect(tip.querySelector('p')?.textContent).toBe('3 attendees');
  });

  it('discards a provider result that resolves after the pointer left', async () => {
    const cal = await makeCalendar([
      { id: 'solo', title: 'Standup', start: new Date(2026, 5, 2) },
    ]);

    (calendar as any).eventTooltip = async () => {
      await wait(30);
      return 'late content';
    };

    const bar = bars(cal, 'solo')[0];
    bar.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(5);
    bar.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(50); // provider resolves after leave — must stay hidden

    const tip = cal.shadowRoot.querySelector('.calendar__tooltip') as HTMLElement;
    expect(tip.hidden).toBe(true);
  });

  it('suppresses the native title attribute when a tooltip is configured', async () => {
    const cal = await makeCalendar([
      { id: 'a', title: 'A', start: new Date(2026, 5, 2), tooltip: 'tip' },
      { id: 'b', title: 'B', start: new Date(2026, 5, 3) },
    ]);

    expect(bars(cal, 'a')[0].hasAttribute('title')).toBe(false);
    expect(bars(cal, 'b')[0].getAttribute('title')).toBe('B');
  });

  it('does not repeat the title as per-day chips anymore', async () => {
    const cal = await makeCalendar([
      { id: 'trip', title: 'Trip', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
    ]);

    expect(cal.shadowRoot.querySelectorAll('.calendar__event').length).toBe(0);
    expect(bars(cal, 'trip').length).toBe(1);
  });

  it('rebuilds stripes when navigating months', async () => {
    const cal = await makeCalendar([
      { id: 'trip', title: 'Trip', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
    ]);
    expect(bars(cal).length).toBe(1);

    calendar.nextMonth(); // July 2026 — event out of frame
    await wait(20);
    expect(bars(cal).length).toBe(0);

    calendar.previousMonth();
    await wait(20);
    expect(bars(cal).length).toBe(1);
  });

  it('honors firstDayOfWeek when computing stripe columns', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    (calendar as any).firstDayOfWeek = 1; // Monday grid: week starts Jun 1 2026
    calendar.goToDate(new Date(2026, 5, 15));
    calendar.events = [
      { id: 'trip', title: 'Trip', start: new Date(2026, 5, 2), end: new Date(2026, 5, 5) },
    ];
    await wait(20);

    const segs = bars(calendar as any, 'trip');
    expect(segs.length).toBe(1);
    // Monday Jun 1 = column 1, so Tue Jun 2 = column 2 .. Fri Jun 5 = column 5.
    expect(segs[0].style.gridColumn).toBe('2 / 6');
    expect(segs[0].style.gridRow).toBe('2');
  });
});
