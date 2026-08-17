/**
 * snice-calendar matrix — selection, `no-day-select`, and the documented
 * disabling rules.
 *
 * The cross: `value` form (4) x `no-day-select` (2) x disabling rule (4) = 32
 * combos, each mounting a pinned month, asserting the selection the docs say it
 * shows, clicking a day, and asserting what the docs say a click does.
 *
 * Documented, and asserted here verbatim:
 *   · "null = nothing selected (initial state); today is marked by
 *     highlightToday, not by a selection";
 *   · `value: Date | string | null` — all three forms are documented, so all
 *     three have to select the same day;
 *   · `no-day-select` — "display-only: day clicks don't select/highlight or
 *     fire calendar-change";
 *   · `minDate` / `maxDate` / `disabledDates` — the days a calendar refuses.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, PINNED, Problems, captureEvents, checkDisabled, checkSelection, clickDay, dayCells,
  day, isoDay, mountCalendar, type Vector,
} from './calendar-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/** The day every combo clicks: a mid-month Wednesday of the pinned month. */
const CLICK_TARGET = day(2026, 5, 17);
/** A day the disabling rules single out. */
const BLOCKED = day(2026, 5, 17);

interface ValueForm { name: string; value: Date | string | null; selected: Date | null }

const VALUE_FORMS: ValueForm[] = [
  { name: 'null', value: null, selected: null },
  { name: 'Date', value: day(2026, 5, 9), selected: day(2026, 5, 9) },
  { name: 'string', value: '2026-06-09T12:00:00', selected: day(2026, 5, 9) },
  // Documented as `Date | string | null`; a string that is not a date is none
  // of the three, and the doc's initial state for "no selection" is null — so
  // the calendar shows no selection rather than throwing out of the render.
  { name: 'unparseable', value: 'not-a-date', selected: null },
];

interface Rule {
  name: string;
  options: { minDate?: Date; maxDate?: Date; disabledDates?: Date[] };
  isDisabled: (date: Date) => boolean;
}

const RULES: Rule[] = [
  { name: 'none', options: {}, isDisabled: () => false },
  {
    name: 'min-date',
    options: { minDate: day(2026, 5, 20) },
    isDisabled: date => date < day(2026, 5, 20),
  },
  {
    name: 'max-date',
    options: { maxDate: day(2026, 5, 10) },
    isDisabled: date => date > day(2026, 5, 10),
  },
  {
    name: 'disabledDates',
    options: { disabledDates: [BLOCKED, day(2026, 5, 18)] },
    isDisabled: date => isoDay(date) === isoDay(BLOCKED) || isoDay(date) === isoDay(day(2026, 5, 18)),
  },
];

const combos = cross({
  value: VALUE_FORMS,
  noDaySelect: [false, true],
  rule: RULES,
});

describe('calendar matrix: selection and the days a calendar refuses', () => {
  for (const combo of combos) {
    const form = combo.value as ValueForm;
    const rule = combo.rule as Rule;
    const vector = { ...DEFAULTS, noDaySelect: combo.noDaySelect } as Vector;
    const id = `value=${form.name}/no-day-select=${combo.noDaySelect}/${rule.name}`;

    it(id, async () => {
      el = await mountCalendar(vector, { value: form.value, ...rule.options });
      const events = captureEvents<{ value: Date; calendar: HTMLElement }>(el, 'calendar-change');
      const problems = new Problems();

      // What the calendar shows before anyone touches it.
      checkSelection(problems, el, vector, PINNED, form.selected);
      checkDisabled(problems, el, vector, PINNED, rule.isDisabled);

      // ── The click ─────────────────────────────────────────────────────────
      // A day click selects that day and fires `calendar-change` — unless the
      // calendar is display-only, or the day is one the calendar refuses.
      const blocked = combo.noDaySelect || rule.isDisabled(CLICK_TARGET);
      await clickDay(problems, el, vector, PINNED, CLICK_TARGET);

      if (blocked) {
        checkSelection(problems, el, vector, PINNED, form.selected);
        problems.equal(events.length, 0,
          combo.noDaySelect
            ? 'a display-only calendar fired calendar-change'
            : 'a disabled day fired calendar-change');
      } else {
        checkSelection(problems, el, vector, PINNED, CLICK_TARGET);
        if (problems.equal(events.length, 1, 'calendar-change events')) {
          problems.equal(isoDay(events[0].value as Date), isoDay(CLICK_TARGET),
            'calendar-change detail.value');
          problems.check(events[0].calendar === el, 'calendar-change detail.calendar');
        }
      }

      expectClean(problems, id);
    });
  }
});

describe('calendar matrix: a selection survives navigation', () => {
  // Documented: `value` is the selection and `previousMonth()`/`nextMonth()`
  // are navigation. Moving away from the selected month and back must find the
  // same day still selected — a calendar that forgets it selected nothing.
  for (const noDaySelect of [false, true]) {
    const vector = { ...DEFAULTS, noDaySelect } as Vector;
    it(`no-day-select=${noDaySelect}`, async () => {
      el = await mountCalendar(vector, { value: day(2026, 5, 9) });
      const problems = new Problems();
      const calendar = el as any;

      calendar.nextMonth();
      await new Promise(resolve => setTimeout(resolve, 30));
      problems.equal(calendar.getDisplayedMonth(), { month: 6, year: 2026 },
        'getDisplayedMonth() after nextMonth()');
      // July's grid holds no June 9, so nothing is selected on screen.
      problems.equal(
        dayCells(el!).filter(cell => cell.classList.contains('calendar__day--selected')).length,
        0, 'selected cells in a month the selection is not in');

      calendar.previousMonth();
      await new Promise(resolve => setTimeout(resolve, 30));
      checkSelection(problems, el!, vector, PINNED, noDaySelect ? null : day(2026, 5, 9));
      problems.equal(isoDay(new Date(calendar.value)), isoDay(day(2026, 5, 9)),
        'value survived navigation');

      expectClean(problems, `survives/${noDaySelect}`);
    });
  }
});
