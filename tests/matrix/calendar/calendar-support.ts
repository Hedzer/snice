/**
 * snice-calendar matrix — the oracle.
 *
 * Source of every expectation: docs/ai/components/calendar.md and
 * packages/components/src/calendar/snice-calendar.types.ts. Nothing here is
 * read off the component's output; where the doc leaves a case genuinely
 * unspecified, the matrix does not cross it (see `civilWeekNumber` below).
 *
 * The documented surface this tier owns:
 *
 *   · `value: Date | string | null = null`  — "null = nothing selected (initial
 *     state); today is marked by highlightToday, not by a selection"
 *   · `view: 'month'|'week'|'day' = 'month'`
 *   · `events: CalendarEvent[] = []`        — property only
 *   · `minDate` / `maxDate` (attrs `min-date` / `max-date`)
 *   · `disabledDates: (Date|string)[] = []` — JS only, no attribute
 *   · `highlightToday = true`               — attr `highlight-today`
 *   · `showWeekNumbers = false`             — attr `show-week-numbers`, "adds a
 *     leading week-number column (ISO-8601 when firstDayOfWeek=1, otherwise the
 *     week containing Jan 1 is week 1)"
 *   · `firstDayOfWeek = 0`                  — attr `first-day-of-week` (0=Sun, 1=Mon)
 *   · `locale = 'en-US'`
 *   · `noDaySelect = false`                 — attr `no-day-select`, "display-only:
 *     day clicks don't select/highlight or fire calendar-change"
 *   · `cellSizing: 'square'|'stretch' = 'square'` — attr `cell-sizing`
 *   · methods `goToToday` / `goToDate` / `previous|next Month|Week|Day` /
 *     `getDisplayedMonth` / `getEventsForDate`
 *   · events `calendar-change`, `calendar-event-click`, `calendar-more-click`
 *   · CSS parts `base`, `header`, `grid`, `more-chip`, `week-number`,
 *     `week-number-header`, `event-bar`, …
 *
 * SIMULATION BOUNDARY. Two documented behaviours are LAYOUT, and happy-dom
 * performs no layout: the event-lane budget ("Visible lanes per week = how many
 * fit the day cell's height") and the avatar-fit rule ("a bar segment narrower
 * than 4.5rem renders the title alone"). The doc names the fallback the DOM
 * tier therefore sees — "No layout to measure (headless DOM, `display: none`,
 * detached) -> falls back to 3 lanes" — and that fallback is what this tier
 * asserts. Everything measured against a real cell height belongs to the visual
 * tier (tests/live/matrix/calendar/calendar-visual.spec.ts).
 */
import { Problems, SETTLE, all, captureEvents, click, mount, sr, text, wait } from '../matrix-kit';
import { exactPart, exactParts } from '../part-exact';
import '../../../packages/components/src/calendar/snice-calendar';

export { Problems, all, captureEvents, click, mount, sr, text, wait, SETTLE };

/**
 * The calendar's part names share prefixes all the way down — `week-number` /
 * `week-number-header`, `more-list` / `more-item`, `event-bar` /
 * `event-avatar`. `matrix-kit`'s `[part~="…"]` lookups cannot separate them in
 * happy-dom, which matches hyphen-prefixed neighbours too, so this suite reads
 * part tokens exactly. See tests/matrix/part-exact.ts.
 */
export const part = exactPart;
export const parts = exactParts;

/** The documented defaults, from the properties block of the doc. */
export const DEFAULTS = {
  view: 'month' as const,
  highlightToday: true,
  showWeekNumbers: false,
  firstDayOfWeek: 0,
  locale: 'en-US',
  noDaySelect: false,
  cellSizing: 'square' as const,
};

/**
 * The month the deterministic combos are pinned to.
 *
 * June 2026 starts on a Monday, so the leading run of previous-month days is
 * one cell for a Sunday-start week and zero for a Monday-start week — the two
 * `first-day-of-week` values produce visibly different grids, which is the
 * point of crossing them.
 */
export const PINNED = new Date(2026, 5, 15);

export interface Vector {
  view: 'month' | 'week' | 'day';
  firstDayOfWeek: number;
  showWeekNumbers: boolean;
  highlightToday: boolean;
  cellSizing: 'square' | 'stretch';
  locale: string;
}

// ── Independent date oracles ────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight, so every comparison here is calendar-day arithmetic. */
export const day = (year: number, month: number, date: number) => new Date(year, month, date);

export const isoDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  + `-${String(date.getDate()).padStart(2, '0')}`;

/**
 * The 42 days a month grid shows: six weeks starting at the `firstDayOfWeek`
 * boundary on or before the first of the displayed month.
 *
 * Six weeks is what the documented "Sizing In A Constrained Host" section fixes
 * — "a header, a weekday strip and six square-ish week rows", "the six week
 * rows share the room under the header", "all six weeks stay inside the box".
 */
export function monthWindow(displayDate: Date, firstDayOfWeek: number): Date[] {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const lead = (day(year, month, 1).getDay() - firstDayOfWeek + 7) % 7;
  return Array.from({ length: 42 }, (_, i) => day(year, month, 1 - lead + i));
}

/**
 * The weekday strip: seven short names in the calendar's locale, rotated so the
 * first is `firstDayOfWeek` (documented "0=Sun, 1=Mon").
 *
 * Anchored on a known Sunday (2024-01-07) so the rotation is arithmetic rather
 * than a second copy of the component's own anchor date.
 */
export function weekdayLabels(locale: string, firstDayOfWeek: number): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    day(2024, 0, 7 + ((firstDayOfWeek + i) % 7))
      .toLocaleDateString(locale, { weekday: 'short' }));
}

/**
 * ISO-8601 week number of the week beginning `weekStart` (a Monday).
 *
 * The doc names ISO-8601 by name for `firstDayOfWeek = 1`, and ISO-8601 fully
 * specifies the answer: the week is numbered by the year holding its Thursday,
 * and week 1 is the week holding January 4.
 */
export function isoWeekNumber(weekStart: Date): number {
  const thursday = day(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 3);
  const isoYear = thursday.getFullYear();
  const jan4 = day(isoYear, 0, 4);
  const week1Monday = day(isoYear, 0, 4 - ((jan4.getDay() + 6) % 7));
  return 1 + Math.round((thursday.getTime() - week1Monday.getTime()) / (7 * DAY_MS));
}

/**
 * Civil week number, for every `firstDayOfWeek` other than Monday: "the week
 * containing Jan 1 is week 1".
 *
 * The rule looks like it needs a tie-break for the week that SPANS the turn of
 * the year, and it does not: that week contains the NEW year's January 1, so
 * the documented rule already names it week 1 of the new year. Which is to say
 * a week belongs to the year it ENDS in, and this oracle derives the anchor
 * that way rather than assuming it:
 *
 *   Dec 27 2026 .. Jan 2 2027, Sunday-start — contains Jan 1 2027, so it is
 *   week 1 of 2027, and the following week is week 2. Numbering it 53 of 2026
 *   instead would leave 2027 with no week containing its own January 1.
 */
export function civilWeekNumber(weekStart: Date, firstDayOfWeek: number): number {
  const weekEnd = day(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const year = weekEnd.getFullYear();
  const jan1 = day(year, 0, 1);
  const week1Start = day(year, 0, 1 - ((jan1.getDay() - firstDayOfWeek + 7) % 7));
  return 1 + Math.round((weekStart.getTime() - week1Start.getTime()) / (7 * DAY_MS));
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo, pinned to a known month.
 *
 * Attributes carry every documented attribute-backed property, because that is
 * the form the doc's examples use and the form the `:host`/container class
 * rules can see. `events` and `disabledDates` are documented as property-only
 * and cross the property channel.
 *
 * The month is pinned with `goToDate`, which is the only documented way to move
 * the displayed month to a fixed point — and which also assigns `value` (a
 * standing finding, MATRIX-calendar-1). `value` is therefore reset explicitly
 * afterwards, so a combo's selection is the one the combo asked for rather than
 * the side effect of pinning it.
 */
export async function mountCalendar(
  vector: Partial<Vector> = {},
  options: {
    displayDate?: Date;
    value?: Date | string | null;
    events?: unknown[];
    disabledDates?: (Date | string)[];
    minDate?: Date | string;
    maxDate?: Date | string;
    eventTooltip?: unknown;
  } = {},
): Promise<HTMLElement> {
  const v = { ...DEFAULTS, ...vector };
  const attrs: Record<string, string | boolean> = {
    view: v.view,
    'first-day-of-week': String(v.firstDayOfWeek),
    'cell-sizing': v.cellSizing,
    locale: v.locale,
  };
  if (v.showWeekNumbers) attrs['show-week-numbers'] = true;
  if (v.noDaySelect) attrs['no-day-select'] = true;
  // `highlight-today` defaults to TRUE, so only the false case needs writing —
  // and it needs the property channel, since removing an absent attribute is a
  // no-op.
  const props: Record<string, unknown> = {};
  if (!v.highlightToday) props.highlightToday = false;
  if (options.events) props.events = options.events;
  if (options.disabledDates) props.disabledDates = options.disabledDates;
  if (options.minDate !== undefined) props.minDate = options.minDate;
  if (options.maxDate !== undefined) props.maxDate = options.maxDate;
  if (options.eventTooltip !== undefined) props.eventTooltip = options.eventTooltip;

  const el = await mount('snice-calendar', attrs as Record<string, string>, props);

  const displayDate = options.displayDate ?? PINNED;
  (el as any).goToDate(displayDate);
  (el as any).value = options.value ?? null;
  await wait(SETTLE);
  return el;
}

/** The bare documented form: `<snice-calendar></snice-calendar>`. */
export async function mountBare(): Promise<HTMLElement> {
  return mount('snice-calendar');
}

// ── Reading the rendered calendar ───────────────────────────────────────────

export const dayCells = (el: HTMLElement): HTMLElement[] =>
  all<HTMLElement>(el, '.calendar__day');

export const weekdayCells = (el: HTMLElement): HTMLElement[] =>
  all<HTMLElement>(el, '.calendar__weekday');

export const weekNumberCells = (el: HTMLElement): HTMLElement[] =>
  parts(el, 'week-number');

export const dayNumbers = (el: HTMLElement): string[] =>
  dayCells(el).map(cell => text(cell.querySelector('.calendar__day-number')));

export const selectedCells = (el: HTMLElement): HTMLElement[] =>
  dayCells(el).filter(cell => cell.classList.contains('calendar__day--selected'));

export const eventBars = (el: HTMLElement): HTMLElement[] => parts(el, 'event-bar');

// ── The oracle ──────────────────────────────────────────────────────────────

/** The documented container parts, and the view the container advertises. */
export function checkChrome(problems: Problems, el: HTMLElement, vector: Vector): void {
  const base = part(el, 'base');
  const header = part(el, 'header');
  const grid = part(el, 'grid');

  if (!problems.check(!!base, 'no [part~="base"] container')) return;
  problems.check(!!header, 'no [part~="header"]');
  if (!problems.check(!!grid, 'no [part~="grid"]')) return;

  problems.check(base!.contains(header!), 'the header is not inside the base container');
  problems.check(base!.contains(grid!), 'the grid is not inside the base container');

  // `view` is documented as one of three values and is the only thing that can
  // distinguish the three renderings, so it has to reach the DOM.
  problems.check(base!.classList.contains(`calendar--${vector.view}`),
    `the container does not carry the ${vector.view} view`
    + ` (classes: ${base!.className})`);

  // The grid is a grid to a screen reader too.
  problems.check(!!grid!.getAttribute('aria-label'), 'the grid has no aria-label');
}

/**
 * The weekday strip: seven short names in the documented locale, starting at
 * the documented `first-day-of-week`.
 */
export function checkWeekdayStrip(problems: Problems, el: HTMLElement, vector: Vector): void {
  const seen = weekdayCells(el).map(cell => text(cell));
  problems.equal(seen, weekdayLabels(vector.locale, vector.firstDayOfWeek), 'weekday strip');
}

/**
 * The day grid: six weeks of seven days, starting at the `first-day-of-week`
 * boundary on or before the first of the displayed month, with the days outside
 * that month marked as such.
 */
export function checkDayGrid(
  problems: Problems, el: HTMLElement, vector: Vector, displayDate: Date,
): void {
  const want = monthWindow(displayDate, vector.firstDayOfWeek);
  const cells = dayCells(el);

  if (!problems.equal(cells.length, 42, 'day cell count')) return;
  problems.equal(dayNumbers(el), want.map(d => String(d.getDate())), 'day numbers');

  const month = displayDate.getMonth();
  want.forEach((date, i) => {
    const cell = cells[i];
    const otherMonth = date.getMonth() !== month;
    problems.equal(cell.classList.contains('calendar__day--other-month'), otherMonth,
      `cell ${i} (${isoDay(date)}) other-month marking`);
    problems.equal(cell.getAttribute('role'), 'gridcell', `cell ${i} role`);
    problems.equal(cell.getAttribute('aria-label'),
      date.toLocaleDateString(vector.locale, { dateStyle: 'full' }),
      `cell ${i} aria-label`);
  });

  // Exactly one cell is the keyboard's way in — a grid with no tab stop cannot
  // be entered, and one with several is a tab trap.
  const stops = cells.filter(cell => cell.getAttribute('tabindex') === '0');
  problems.equal(stops.length, 1, 'day cells with tabindex="0"');
}

/**
 * The week-number column: documented as a LEADING column, present only under
 * `show-week-numbers`, one cell per week row plus a header cell.
 */
export function checkWeekNumbers(
  problems: Problems, el: HTMLElement, vector: Vector, displayDate: Date,
): void {
  const cells = weekNumberCells(el);
  const header = part(el, 'week-number-header');

  if (!vector.showWeekNumbers) {
    problems.equal(cells.length, 0, 'week-number cells without show-week-numbers');
    problems.check(!header?.isConnected,
      'the week-number header is present without show-week-numbers');
    return;
  }

  problems.check(!!header, 'no [part~="week-number-header"]');
  if (!problems.equal(cells.length, 6, 'week-number cells (six week rows)')) return;

  const want = monthWindow(displayDate, vector.firstDayOfWeek);
  const expected = Array.from({ length: 6 }, (_, week) => (
    vector.firstDayOfWeek === 1
      ? isoWeekNumber(want[week * 7])
      : civilWeekNumber(want[week * 7], vector.firstDayOfWeek)
  ));
  problems.equal(cells.map(cell => Number(text(cell))), expected, 'week numbers');
  cells.forEach((cell, week) => {
    problems.equal(cell.getAttribute('aria-label'), `Week ${expected[week]}`,
      `week ${week} aria-label`);
  });

  // "adds a LEADING week-number column" — so every day cell moves one column
  // right and the week-number cells occupy column 1.
  const dayColumns = dayCells(el).map(cell => cell.style.gridColumn);
  const wantColumns = Array.from({ length: 42 }, (_, i) => String((i % 7) + 2));
  problems.equal(dayColumns, wantColumns, 'day cell grid columns under show-week-numbers');
}

/** The days outside the documented `min-date`/`max-date`/`disabledDates` are inert. */
export function checkDisabled(
  problems: Problems,
  el: HTMLElement,
  vector: Vector,
  displayDate: Date,
  isDisabled: (date: Date) => boolean,
): void {
  const want = monthWindow(displayDate, vector.firstDayOfWeek);
  const cells = dayCells(el);
  want.forEach((date, i) => {
    const expected = isDisabled(date);
    problems.equal(cells[i]?.classList.contains('calendar__day--disabled'), expected,
      `cell ${i} (${isoDay(date)}) disabled class`);
    problems.equal(cells[i]?.getAttribute('aria-disabled'), String(expected),
      `cell ${i} (${isoDay(date)}) aria-disabled`);
  });
}

/**
 * The selection: documented as "null = nothing selected", one selected day
 * otherwise — and never any selection at all under `no-day-select`
 * ("display-only: day clicks don't select/highlight").
 */
export function checkSelection(
  problems: Problems, el: HTMLElement, vector: Vector, displayDate: Date,
  selected: Date | null,
): void {
  const want = monthWindow(displayDate, vector.firstDayOfWeek);
  const cells = dayCells(el);
  const target = vector.noDaySelect ? null : selected;

  want.forEach((date, i) => {
    const expected = !!target && isoDay(date) === isoDay(target);
    problems.equal(cells[i]?.classList.contains('calendar__day--selected'), expected,
      `cell ${i} (${isoDay(date)}) selected class`);
    problems.equal(cells[i]?.getAttribute('aria-selected'), String(expected),
      `cell ${i} (${isoDay(date)}) aria-selected`);
  });
}

/**
 * `highlight-today`: documented as the ONLY thing that marks today
 * ("today is marked by highlightToday, not by a selection").
 */
export function checkToday(
  problems: Problems, el: HTMLElement, vector: Vector, displayDate: Date,
): void {
  const want = monthWindow(displayDate, vector.firstDayOfWeek);
  const cells = dayCells(el);
  const today = isoDay(new Date());
  const month = displayDate.getMonth();

  want.forEach((date, i) => {
    const isToday = vector.highlightToday && isoDay(date) === today;
    problems.equal(cells[i]?.classList.contains('calendar__day--today'), isToday,
      `cell ${i} (${isoDay(date)}) today class`);
    // `aria-current="date"` names the day the reader is "on", which is today —
    // and only inside the month being displayed, where it is not a lead-in or
    // trail-out duplicate of a cell in the neighbouring month.
    problems.equal(cells[i]?.getAttribute('aria-current'),
      isToday && date.getMonth() === month ? 'date' : 'false',
      `cell ${i} (${isoDay(date)}) aria-current`);
  });
}

/** `cell-sizing`: documented as a per-cell mode, so every cell carries it. */
export function checkCellSizing(problems: Problems, el: HTMLElement, vector: Vector): void {
  const stretched = dayCells(el).filter(cell => cell.classList.contains('calendar__day--stretch'));
  problems.equal(stretched.length, vector.cellSizing === 'stretch' ? 42 : 0,
    `cells marked for cell-sizing="${vector.cellSizing}"`);
}

/** `no-day-select`: documented as display-only, marked on every cell. */
export function checkNoDaySelect(problems: Problems, el: HTMLElement, vector: Vector): void {
  const statics = dayCells(el).filter(cell => cell.classList.contains('calendar__day--static'));
  problems.equal(statics.length, vector.noDaySelect ? 42 : 0,
    `cells marked display-only for no-day-select=${vector.noDaySelect}`);
}

/** Click the cell showing `date`, or record that it was not on screen. */
export async function clickDay(
  problems: Problems, el: HTMLElement, vector: Vector, displayDate: Date, date: Date,
): Promise<void> {
  const want = monthWindow(displayDate, vector.firstDayOfWeek);
  const index = want.findIndex(d => isoDay(d) === isoDay(date));
  if (index < 0) { problems.say(`${isoDay(date)} is not in the displayed grid`); return; }
  click(dayCells(el)[index]);
  await wait(SETTLE);
}
