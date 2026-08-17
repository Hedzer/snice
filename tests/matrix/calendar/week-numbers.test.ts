/**
 * snice-calendar matrix — the week-number column.
 *
 * The cross: every month of two years (24) x `first-day-of-week` (2) = 48
 * combos. Week numbering is the one part of this component whose expected
 * answer is arithmetic rather than markup, and the interesting months are the
 * ones nobody writes a hand-picked test for: the turn of the year, a 53-week
 * year, and a leap February.
 *
 * Documented: `show-week-numbers` "adds a leading week-number column (ISO-8601
 * when firstDayOfWeek=1, otherwise the week containing Jan 1 is week 1)".
 * Both rules are implemented independently in calendar-support.ts —
 * `isoWeekNumber` from the ISO-8601 definition, `civilWeekNumber` from the
 * sentence above — and neither is copied from the component.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, checkWeekNumbers, civilWeekNumber, day, isoWeekNumber, monthWindow,
  mountCalendar, type Vector,
} from './calendar-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/**
 * 2026 ends mid-week and 2027 is a 53-week ISO year, so between them the cross
 * covers the turn of the year in both directions, a long ISO year, and (via
 * 2028's February in the grid tests) a leap month.
 */
const YEARS = [2026, 2027];

describe('calendar matrix: week numbers', () => {
  for (const firstDayOfWeek of [0, 1]) {
    for (const year of YEARS) {
      for (let month = 0; month < 12; month++) {
        const vector = { ...DEFAULTS, firstDayOfWeek, showWeekNumbers: true } as Vector;
        const displayDate = day(year, month, 15);
        const id = `first=${firstDayOfWeek}/${year}-${String(month + 1).padStart(2, '0')}`;

        it(id, async () => {
          el = await mountCalendar(vector, { displayDate });
          const problems = new Problems();
          checkWeekNumbers(problems, el, vector, displayDate);
          expectClean(problems, id);
        });
      }
    }
  }
});

describe('calendar matrix: the two documented numbering rules disagree, and each is used', () => {
  // A guard on the oracle itself. If ISO-8601 and the civil rule ever produced
  // the same answer for every week the cross visits, the cross above would pass
  // with either rule wired to either `first-day-of-week` — and the documented
  // distinction would be untested. This names a week where they differ.
  it('the turn of 2026/2027 numbers differently under each rule', async () => {
    const problems = new Problems();
    // Sunday-start: the week of Dec 27 2026 contains Jan 1 2027, so the civil
    // rule makes it week 1. Monday-start: the week of Dec 28 2026 holds its
    // Thursday (Dec 31) in 2026, so ISO-8601 makes it week 53 of 2026.
    const sundayWeek = monthWindow(day(2026, 11, 15), 0)[28];
    const mondayWeek = monthWindow(day(2026, 11, 15), 1)[28];

    problems.equal(civilWeekNumber(sundayWeek, 0), 1,
      'the Sunday-start week containing Jan 1 2027');
    problems.equal(isoWeekNumber(mondayWeek), 53, 'the ISO week holding Dec 31 2026');

    expectClean(problems, 'rules-differ');
  });
});
