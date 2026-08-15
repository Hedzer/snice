/**
 * Date parsing for the table's cell layer.
 *
 * A column of type `date` usually carries calendar dates: `'2026-03-15'` names
 * a day, not an instant. `new Date('2026-03-15')` nevertheless resolves the
 * ISO date-only forms as UTC midnight (ECMA-262 21.4.3.2), so every consumer
 * in a negative-offset zone formatted the day BEFORE the authored one, while
 * an `<input type="date">` editor holding the same string showed the authored
 * day. Display, export, and filtering must all agree with the string the
 * application wrote.
 *
 * The rule: a value that carries NO time is a calendar day and is read at
 * local midnight; anything that carries a time (or an offset, or is already a
 * `Date`/epoch number) is an instant and is left to the platform.
 */

/** ISO calendar dates with no time part: `YYYY`, `YYYY-MM`, `YYYY-MM-DD`. */
const DATE_ONLY = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/;

/**
 * Parse a cell value into a `Date`, or `null` when there is nothing to show.
 *
 * `null` covers the empty cases (`null`, `undefined`, `''`) and unparseable
 * input alike, so callers fall back to the raw value rather than rendering
 * "Invalid Date" or the epoch.
 */
export function parseCellDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const fromEpoch = new Date(value);
    return Number.isNaN(fromEpoch.getTime()) ? null : fromEpoch;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;

    const calendarDay = DATE_ONLY.exec(trimmed);
    if (calendarDay) {
      const year = Number(calendarDay[1]);
      const month = calendarDay[2] === undefined ? 1 : Number(calendarDay[2]);
      const day = calendarDay[3] === undefined ? 1 : Number(calendarDay[3]);
      // Local midnight: the same calendar day in every timezone.
      const local = new Date(year, month - 1, day);
      // Years 0-99 mean themselves, not 1900+n.
      if (year >= 0 && year <= 99) local.setFullYear(year, month - 1, day);
      if (Number.isNaN(local.getTime())) return null;
      // `new Date(2026, 12, 1)` rolls over to 2027 instead of rejecting, so a
      // typo like '2026-13-01' or '2026-02-30' would render as a confident but
      // WRONG day. The platform calls those strings invalid; so do we, and the
      // caller falls back to showing the raw value.
      if (
        local.getFullYear() !== year ||
        local.getMonth() !== month - 1 ||
        local.getDate() !== day
      ) {
        return null;
      }
      return local;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const coerced = new Date(value as any);
  return Number.isNaN(coerced.getTime()) ? null : coerced;
}

/**
 * Midnight on the calendar day a value falls on, in local time. Used by
 * day-granularity comparisons (today/past/future classification) so an
 * instant is never bumped across a day boundary by the UTC offset.
 */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
