// Adaptive visible-lane count: how many event stripes a week shows is derived
// from the height a day cell actually has, not from a flat constant. The
// pixel-accurate proof lives in tests/live/components/calendar/calendar-lanes.spec.ts
// (height math needs real layout); this suite covers the plumbing — the
// derivation itself, the no-layout fallback, and the row reservation — by
// handing the calendar a measured cell height.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../packages/components/src/calendar/snice-calendar.types';

/** Lane geometry, in rem — mirrors snice-calendar.css. */
const STACK_TOP = 2.125;
const LANE = 1.375;
const CHIP = 1;

const cells = (cal: any): HTMLElement[] =>
  Array.from(cal.shadowRoot.querySelectorAll('.calendar__day'));
const bars = (cal: any): HTMLElement[] =>
  Array.from(cal.shadowRoot.querySelectorAll('.calendar__event-bar'));
const chip = (cal: any): HTMLElement | null =>
  cal.shadowRoot.querySelector('.calendar__more');

/** happy-dom lays nothing out, so the measured cell is supplied here. */
function measureCellsAt(cal: any, heightPx: number) {
  cells(cal).forEach(cell => {
    cell.getBoundingClientRect = () => ({
      x: 0, y: 0, top: 0, left: 0, right: 0, bottom: heightPx,
      width: heightPx, height: heightPx, toJSON: () => ({}),
    }) as DOMRect;
  });
}

function sameDayEvents(count: number, day: Date): CalendarEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1, title: `Event ${i + 1}`, start: new Date(day),
  }));
}

describe('snice-calendar adaptive lane budget', () => {
  let calendar: SniceCalendarElement;
  const day = new Date(2026, 5, 10); // Wed 10 June 2026

  async function mount(options: { height?: number; cellSizing?: string; events: number } ) {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar',
      options.cellSizing ? { 'cell-sizing': options.cellSizing } : {});
    (calendar as any).goToDate(new Date(day));
    await wait(20);
    if (options.height !== undefined) measureCellsAt(calendar, options.height);
    (calendar as any).events = sameDayEvents(options.events, day);
    await wait(20);
    return calendar as any;
  }

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  it('falls back to three lanes when there is no layout to measure', async () => {
    const cal = await mount({ events: 5 });

    expect(bars(cal).length).toBe(3);
    expect(chip(cal)?.textContent).toBe('+2 more');
  });

  it('fills a tall cell: seven lanes and the remainder in the chip', async () => {
    // 13rem of cell: the day-number strip, seven lanes and the chip's strip.
    const cal = await mount({ height: 13 * 16, events: 8 });

    expect(bars(cal).length).toBe(7);
    expect(chip(cal)?.textContent).toBe('+1 more');
  });

  it('keeps at least one lane in a cell too short for the stack', async () => {
    const cal = await mount({ height: 4.5 * 16, events: 8 });

    expect(bars(cal).length).toBe(1);
    expect(chip(cal)?.textContent).toBe('+7 more');
  });

  it('shows no chip while every lane still fits', async () => {
    const cal = await mount({ height: 13 * 16, events: 5 });

    expect(bars(cal).length).toBe(5);
    expect(chip(cal)).toBeNull();
  });

  it('lets an unconstrained stretch cell grow to fit every lane', async () => {
    // The 3rem stretch floor is the cell's whole intrinsic height: rows
    // collapse to content there, so the stack has no budget to run out of.
    const cal = await mount({ height: 3 * 16, cellSizing: 'stretch', events: 8 });

    expect(bars(cal).length).toBe(8);
    expect(chip(cal)).toBeNull();
  });

  it('reserves row height only when the row does not already have it', async () => {
    const roomy = await mount({ height: 13 * 16, events: 8 });
    const roomyCell = cells(roomy).find(c => (c as any).__date?.getDate() === 10)!;
    // 2.125 + 7 * 1.375 + 1 = 12.75rem fits inside the 13rem cell.
    expect(STACK_TOP + 7 * LANE + CHIP).toBeLessThanOrEqual(13);
    expect(roomyCell.style.getPropertyValue('--calendar-week-lanes')).toBe('');

    removeComponent(roomy);

    // 3rem of cell cannot hold even one lane plus the chip, so the row has to
    // grow — that is the one case the reservation still exists for.
    const tight = await mount({ height: 3 * 16, events: 8 });
    const tightCell = cells(tight).find(c => (c as any).__date?.getDate() === 10)!;
    expect(tightCell.style.getPropertyValue('--calendar-week-lanes')).toBe('1');
    expect(tightCell.style.getPropertyValue('--calendar-week-more')).toBe('1rem');
  });

  it('re-derives the lane count when the cell height changes', async () => {
    const cal = await mount({ height: 4.5 * 16, events: 8 });
    expect(bars(cal).length).toBe(1);

    measureCellsAt(cal, 13 * 16);
    cal.handleCalendarResize({ contentRect: { width: 400, height: 13 * 16 * 6 } });
    await wait(20);

    expect(bars(cal).length).toBe(7);
    expect(chip(cal)?.textContent).toBe('+1 more');
  });
});
