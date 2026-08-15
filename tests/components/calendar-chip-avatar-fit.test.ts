// An event chip is only as wide as the segment it spans — ~57px for a single
// day in a 400px month grid. The 0.875rem avatar plus its gap and padding eats
// most of that, which is how "Design sync" rendered as "Des…". Professional
// calendars keep the title (the payload) and drop the adornment when the
// segment cannot carry both, so the avatar is emitted only for segments at
// least AVATAR_MIN_SEGMENT_REM wide, and a narrow chip tightens its inline
// padding to hand the title every remaining pixel.
//
// Fixed frame: June 2026, firstDayOfWeek=0 → the grid starts Sunday May 31.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../packages/components/src/calendar/snice-calendar.types';

/** Segment width, in rem, below which the avatar is dropped — mirrors
 *  SniceCalendar.AVATAR_MIN_SEGMENT_REM. */
const AVATAR_MIN_REM = 4.5;

describe('snice-calendar event-chip avatar fit', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  /** happy-dom lays nothing out, so the measured cell box is supplied here. */
  function measureCells(cal: any, box: { width: number; height: number }) {
    (Array.from(cal.shadowRoot.querySelectorAll('.calendar__day')) as HTMLElement[])
      .forEach(cell => {
        cell.getBoundingClientRect = () => ({
          x: 0, y: 0, top: 0, left: 0, right: box.width, bottom: box.height,
          width: box.width, height: box.height, toJSON: () => ({}),
        }) as DOMRect;
      });
  }

  async function mount(events: CalendarEvent[], box?: { width: number; height: number }) {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.goToDate(new Date(2026, 5, 15)); // June 2026
    await wait(20);
    if (box) measureCells(calendar, box);
    calendar.events = events;
    await wait(20);
    return calendar as any;
  }

  const bars = (cal: any, id: string): HTMLElement[] =>
    (Array.from(cal.shadowRoot.querySelectorAll('.calendar__event-bar')) as HTMLElement[])
      .filter(b => b.getAttribute('data-event-id') === id);

  const avatarIn = (bar: HTMLElement) => bar.querySelector('snice-avatar');

  const oneDay: CalendarEvent[] = [{
    id: 'sync', title: 'Design sync', start: new Date(2026, 5, 2),
    avatar: { src: '/assets/avatars/pravatar-40-alice.jpg', name: 'Dana Ives' },
  }];

  it('drops the avatar and tightens padding on a one-cell chip', async () => {
    // 57px cell — the default month view at the 400px showcase width.
    const cal = await mount(oneDay, { width: 57, height: 120 });

    const [bar] = bars(cal, 'sync');
    expect(bar).toBeTruthy();
    expect(avatarIn(bar)).toBeNull();
    expect(bar.classList.contains('calendar__event-bar--compact')).toBe(true);
    // The title survives in full — truncation is the browser's call, not ours.
    expect(bar.textContent).toBe('Design sync');
  });

  it('keeps the avatar once one cell is wide enough for both', async () => {
    const cal = await mount(oneDay, { width: AVATAR_MIN_REM * 16 + 4, height: 120 });

    const [bar] = bars(cal, 'sync');
    expect(avatarIn(bar)).toBeTruthy();
    expect(bar.classList.contains('calendar__event-bar--compact')).toBe(false);
    expect(bar.textContent).toBe('Design sync');
  });

  it('measures the segment, not the cell: a multi-day span keeps the avatar', async () => {
    const cal = await mount([{
      id: 'oncall', title: 'On call',
      start: new Date(2026, 5, 2), end: new Date(2026, 5, 4), // Tue–Thu, one week row
      avatar: { src: '/assets/avatars/pravatar-40-bob.jpg', name: 'Sam Reyes' },
    }], { width: 57, height: 120 });

    const [bar] = bars(cal, 'oncall');
    expect(bar.style.gridColumn).toBe('3 / 6'); // three cells = 171px
    expect(avatarIn(bar)).toBeTruthy();
    expect(bar.classList.contains('calendar__event-bar--compact')).toBe(false);
  });

  it('keeps the avatar when there is no layout to measure', async () => {
    const cal = await mount(oneDay); // no measured box: headless / display:none

    const [bar] = bars(cal, 'sync');
    expect(avatarIn(bar)).toBeTruthy();
    expect(bar.classList.contains('calendar__event-bar--compact')).toBe(false);
  });

  it('re-decides on resize: a narrowed calendar drops the avatar', async () => {
    const cal = await mount(oneDay, { width: 96, height: 120 });
    expect(avatarIn(bars(cal, 'sync')[0])).toBeTruthy();

    measureCells(cal, { width: 57, height: 120 });
    cal.handleCalendarResize({ contentRect: { width: 400, height: 420 } } as ResizeObserverEntry);
    await wait(20);

    const [bar] = bars(cal, 'sync');
    expect(avatarIn(bar)).toBeNull();
    expect(bar.classList.contains('calendar__event-bar--compact')).toBe(true);
  });
});
