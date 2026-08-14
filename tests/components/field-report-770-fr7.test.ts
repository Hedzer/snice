// Field report FR7 (against released 7.7.0, verified against current source):
// the <snice-calendar> "+N more" overflow chip is invisible, unstylable and
// inert.
//
//   div.calendar__more — 0.625rem, --snice-color-text-secondary (fallback
//   rgb(82 82 82), i.e. dark grey on a dark surface), no CSS part, no click
//   contract, no association back to the day it belongs to.
//
// Wanted contract, asserted below:
//   * part="more-chip" so the chip is themable from outside the shadow root,
//     the way event bars already are (part="event-bar").
//   * a `calendar-more-click` event carrying { date, count } — same
//     bubbles/composed shape as calendar-event-click.
//   * a readable default style: not the 2xs/secondary combination that
//     disappears against a dark surface.
//
// Fixed frame: June 2026, firstDayOfWeek=0 → the month grid starts on
// Sunday May 31 2026. MAX_EVENT_LANES is 3, so a day carrying 5 single-day
// events renders 3 bars and hides 2 behind the chip.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement, CalendarEvent } from '../../packages/components/src/calendar/snice-calendar.types';

const CSS_PATH = resolve(
  process.cwd(), 'packages/components/src/calendar/snice-calendar.css');

/** Five single-day events on `day` → 3 rendered lanes, 2 hidden → "+2 more". */
function overflowOn(day: Date, prefix: string): CalendarEvent[] {
  return [1, 2, 3, 4, 5].map(n => ({ id: `${prefix}-${n}`, title: `E${n}`, start: day }));
}

function cellFor(cal: any, dayOfMonth: number, month: number): HTMLElement {
  const cells = Array.from(
    cal.shadowRoot.querySelectorAll('.calendar__day')) as HTMLElement[];
  const cell = cells.find(c => (c as any).__date?.getDate() === dayOfMonth
    && (c as any).__date?.getMonth() === month);
  if (!cell) throw new Error(`no day cell for ${month + 1}/${dayOfMonth}`);
  return cell;
}

describe('FR7 — snice-calendar "+N more" chip contract', () => {
  let calendar: SniceCalendarElement | undefined;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
    calendar = undefined;
  });

  async function makeCalendar(events: CalendarEvent[]): Promise<any> {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    calendar.goToDate(new Date(2026, 5, 15)); // June 2026
    calendar.events = events;
    await wait(20);
    return calendar as any;
  }

  // FR7 — the report's own repro, bare DOM: create the element by hand,
  // assign events, read the chip back out of the shadow root.
  it('exposes the overflow chip as part="more-chip"', async () => {
    const el = document.createElement('snice-calendar') as any;
    document.body.appendChild(el);
    await el.ready;
    el.goToDate(new Date(2026, 5, 15));
    el.events = overflowOn(new Date(2026, 5, 3), 'bare');
    await wait(20);

    try {
      const chip = el.shadowRoot.querySelector('.calendar__more') as HTMLElement;
      // Preconditions: the chip is there and reports the hidden count.
      expect(chip).toBeTruthy();
      expect(chip.textContent).toBe('+2 more');

      // Wanted: styleable from outside, exactly like part="event-bar" bars.
      expect(chip.getAttribute('part')).toBe('more-chip');
    } finally {
      el.remove();
    }
  });

  // FR7
  it('dispatches calendar-more-click with { date, count } when the chip is clicked', async () => {
    const cal = await makeCalendar(overflowOn(new Date(2026, 5, 3), 'click'));
    const chip = cellFor(cal, 3, 5).querySelector('.calendar__more') as HTMLElement;
    expect(chip).toBeTruthy();

    const seen: CustomEvent[] = [];
    cal.addEventListener('calendar-more-click', (e: Event) => seen.push(e as CustomEvent));

    chip.click();

    expect(seen.length).toBe(1);
    const detail = seen[0].detail as { date: Date; count: number };
    expect(detail.count).toBe(2);
    expect(detail.date instanceof Date).toBe(true);
    expect(detail.date.getFullYear()).toBe(2026);
    expect(detail.date.getMonth()).toBe(5);
    expect(detail.date.getDate()).toBe(3);
    // Same escape shape as the calendar's other events, so hosts can listen
    // from outside the shadow root / from an ancestor.
    expect(seen[0].bubbles).toBe(true);
    expect(seen[0].composed).toBe(true);
  });

  // FR7 — day association: each chip reports its own day and its own count,
  // not the first overflowing day's.
  it('associates each chip with the day it sits in', async () => {
    const cal = await makeCalendar([
      ...overflowOn(new Date(2026, 5, 3), 'a'),
      // Jun 10: four events → 3 lanes rendered, 1 hidden → "+1 more".
      ...[1, 2, 3, 4].map(n => ({
        id: `b-${n}`, title: `F${n}`, start: new Date(2026, 5, 10),
      })),
    ]);

    const seen: Array<{ date: Date; count: number }> = [];
    cal.addEventListener('calendar-more-click',
      (e: Event) => seen.push((e as CustomEvent).detail));

    (cellFor(cal, 3, 5).querySelector('.calendar__more') as HTMLElement).click();
    (cellFor(cal, 10, 5).querySelector('.calendar__more') as HTMLElement).click();

    expect(seen.map(d => [d.date.getDate(), d.count]))
      .toEqual([[3, 2], [10, 1]]);
  });

  // FR7 — the chip is its own control: clicking it must not fall through to
  // the day cell and silently change the selected date.
  it('does not fall through to day selection when the chip is clicked', async () => {
    const cal = await makeCalendar(overflowOn(new Date(2026, 5, 3), 'fall'));
    const chip = cellFor(cal, 3, 5).querySelector('.calendar__more') as HTMLElement;

    const changes: Event[] = [];
    cal.addEventListener('calendar-change', (e: Event) => changes.push(e));

    chip.click();

    expect(changes.length).toBe(0);
  });

  // FR7 — readable default style. happy-dom cannot resolve cascaded custom
  // properties, so the shipped stylesheet is asserted directly (same approach
  // as tests/components/notification-center.test.ts).
  it('styles the chip readably by default', () => {
    const css = readFileSync(CSS_PATH, 'utf8');
    const rule = css.match(/\.calendar__more\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).not.toBe('');

    // Not 2xs (0.625rem) — the chip is the only affordance for hidden events.
    expect(rule).not.toMatch(/font-size:\s*var\(--snice-font-size-2xs/);
    expect(rule).not.toContain('0.625rem');

    // Not a hardcoded dark-grey fallback that vanishes on a dark surface.
    expect(rule).not.toContain('rgb(82 82 82)');
    expect(rule).toMatch(/color:\s*var\(--snice-color-text[,)]/);
  });
});
