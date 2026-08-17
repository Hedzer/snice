/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-booking matrix — the documented oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/booking.md` and
 * `snice-booking.types.ts`. The booking widget is a three-step form, and the
 * doc states each gate:
 *
 *   availableDates  "non-empty list disables all other days"
 *   minDate/maxDate the documented bounds
 *   availableSlots  the times offered for the SELECTED date
 *   fields          the confirmation form, `required?` per field
 *   getBooking()    "Returns BookingData | null"
 *   reset()         "Reset to step 1, clear selections"
 *
 * The calendar oracle below rebuilds the month grid the same way the docs
 * describe a month: six weeks of seven days, starting on the Sunday on or
 * before the first of the displayed month. Both the component and this module
 * read the same clock, so "today" means the same thing to both.
 *
 * ── Findings pinned by this suite ───────────────────────────────────────────
 *
 *   MATRIX-booking-1  The docs describe the inline variant as "all steps
 *                     visible". It renders the calendar and the slots, but the
 *                     confirmation form only appears once a slot has been
 *                     picked — so the third step is not visible, and an inline
 *                     booking widget cannot show a visitor what it is going to
 *                     ask them for.
 */
import { Problems, all, text } from '../matrix-kit';
import type { BookingField, BookingSlot } from
  '../../../packages/components/src/booking/snice-booking.types';

/** `YYYY-MM-DD` in local time, the format the docs use throughout. */
export function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    + `-${String(date.getDate()).padStart(2, '0')}`;
}

export function midnight(date: Date = new Date()): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** The 42 cells of the month grid the component displays on mount. */
export function monthGrid(month: Date = new Date()): Date[] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const startOffset = new Date(year, index, 1).getDay();
  const start = new Date(year, index, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + i);
    cell.setHours(0, 0, 0, 0);
    return cell;
  });
}

/** Days of the CURRENT month that are still in the future — safe to book. */
export function futureDaysThisMonth(count: number): string[] {
  const today = midnight();
  const picked = monthGrid()
    .filter(cell => cell.getMonth() === today.getMonth() && cell > today)
    .slice(0, count);
  return picked.map(ymd);
}

// ── The documented gates ────────────────────────────────────────────────────

export interface CalendarRules {
  availableDates: string[];
  minDate?: string;
  maxDate?: string;
}

/** "non-empty list disables all other days". */
export function isAvailable(date: Date, rules: CalendarRules): boolean {
  if (rules.availableDates.length === 0) return true;
  return rules.availableDates.includes(ymd(date));
}

/**
 * A cell can be chosen when it is in the displayed month, not in the past, and
 * inside every documented bound.
 */
export function isSelectable(date: Date, rules: CalendarRules, month = new Date()): boolean {
  if (date.getMonth() !== month.getMonth()) return false;
  if (date < midnight()) return false;
  if (rules.minDate && date < new Date(rules.minDate)) return false;
  if (rules.maxDate && date > new Date(rules.maxDate)) return false;
  return isAvailable(date, rules);
}

/** The slots offered for a date: the ones whose own `date` matches. */
export function slotsFor(slots: BookingSlot[], date: string): BookingSlot[] {
  return date ? slots.filter(slot => slot.date === date) : [];
}

/** "9:00" -> "9:00 AM", the 12-hour clock the component renders. */
export function slotLabel(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Confirm is available once every `required` field has a value. */
export function isFormValid(fields: BookingField[], values: Record<string, string>): boolean {
  return fields.filter(field => field.required)
    .every(field => (values[field.name] ?? '').trim().length > 0);
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function dayCells(el: HTMLElement): HTMLButtonElement[] {
  return all<HTMLButtonElement>(el, '.booking__day');
}

export function slotButtons(el: HTMLElement): HTMLButtonElement[] {
  return all<HTMLButtonElement>(el, '.booking__slot');
}

export function actionButtons(el: HTMLElement): HTMLButtonElement[] {
  return all<HTMLButtonElement>(el, '.booking__btn');
}

export function stepChips(el: HTMLElement): HTMLElement[] {
  return all<HTMLElement>(el, '.booking__step');
}

export function formInputs(el: HTMLElement): Array<HTMLInputElement | HTMLTextAreaElement> {
  return all<HTMLInputElement | HTMLTextAreaElement>(el, '.booking__input');
}

/** The part names the docs publish, and whether each one is in the tree. */
export function regions(el: HTMLElement): Record<string, boolean> {
  const shadow = el.shadowRoot!;
  const has = (name: string) => !!shadow.querySelector(`[part="${name}"]`);
  return {
    base: has('base'),
    stepper: has('stepper'),
    calendar: has('calendar'),
    slots: has('slots'),
    form: has('form'),
    confirmation: has('confirmation'),
  };
}

// ── The oracle ──────────────────────────────────────────────────────────────

/** Every documented claim about the rendered calendar, at once. */
export function checkCalendar(el: HTMLElement, rules: CalendarRules, problems: Problems): void {
  const cells = dayCells(el);
  const grid = monthGrid();
  problems.equal(cells.length, 42, 'day cells in the month grid');

  const wrongDay: string[] = [];
  const wrongState: string[] = [];
  cells.forEach((cell, i) => {
    const date = grid[i];
    if (!date) return;
    if (text(cell) !== String(date.getDate())) {
      wrongDay.push(`cell ${i}: "${text(cell)}" for ${ymd(date)}`);
    }
    const selectable = isSelectable(date, rules);
    if (cell.disabled === selectable) {
      wrongState.push(`${ymd(date)}: ${cell.disabled ? 'disabled' : 'enabled'},`
        + ` expected ${selectable ? 'enabled' : 'disabled'}`);
    }
    const classes = cell.getAttribute('class') ?? '';
    if (classes.includes('booking__day--other') !== (date.getMonth() !== new Date().getMonth())) {
      wrongState.push(`${ymd(date)}: out-of-month class disagrees with the grid`);
    }
  });
  problems.equal(wrongDay, [], 'day numbers');
  problems.equal(wrongState, [], 'day states');
}
