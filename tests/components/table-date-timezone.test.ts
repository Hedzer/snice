/**
 * Regression coverage for the table date layer's TIMEZONE contract.
 *
 * A calendar date carries no time and no zone. `new Date('2026-03-15')` is
 * nevertheless parsed by the platform as UTC midnight (ECMA-262 21.4.3.2), so
 * every consumer west of Greenwich formatted it as the PREVIOUS day: the
 * showcase's `2026-03-15` date cell painted "3/14/26" while the row's own
 * `<input type="date">` editor (which never leaves the string) showed the
 * correct 03/15/2026.
 *
 * Contract asserted here (docs/components/table.md, "Date cells"):
 *  - a date-only value (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`) names a calendar day
 *    and renders as that same day in EVERY timezone — display cell, custom
 *    format, today/past/future classification, clipboard export, and column
 *    filtering all agree;
 *  - a value that DOES carry a time (`…T10:00`, `…Z`, epoch number, `Date`)
 *    keeps its instant semantics and is still projected into local time.
 *
 * The in-process suite runs in the machine's own zone, which is where the
 * defect was reported. The zone sweep cannot run in-process — Node caches its
 * timezone for the life of a vitest worker — so it re-imports the real module
 * in a child process per zone, on both sides of the date line (UTC-10 through
 * UTC+14).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';
import '../../packages/components/src/table/snice-cell-date';
import { parseCellDate } from '../../packages/components/src/table/table-date';
import { TableExport } from '../../packages/components/src/table/table-export';
import { TableFilterEngine } from '../../packages/components/src/table/table-filter-engine';

/** Zones straddling the date line; each would break a UTC-parsed calendar date. */
const ZONES = [
  'Pacific/Honolulu',   // UTC-10
  'America/Los_Angeles',// UTC-7/-8
  'America/New_York',   // UTC-4/-5 (the reporting machine)
  'UTC',
  'Europe/Berlin',      // UTC+1/+2
  'Asia/Tokyo',         // UTC+9
  'Pacific/Kiritimati', // UTC+14
];

const text = (el: Element | null | undefined) => (el?.textContent ?? '').trim();

const cellText = (cell: any): string => text(cell.shadowRoot?.querySelector('.cell-content'));

/** The authored day as this machine's locale renders it — zone-independent by construction. */
const shortLocalDay = (y: number, m: number, d: number) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(new Date(y, m - 1, d));

describe('table dates are timezone-stable', () => {
  let hosts: HTMLElement[] = [];

  async function makeCell(props: Record<string, any> = {}): Promise<any> {
    const cell = await createComponent<any>('snice-cell-date');
    hosts.push(cell);
    Object.assign(cell, props);
    await wait(10);
    return cell;
  }

  afterEach(() => {
    hosts.forEach(h => removeComponent(h));
    hosts = [];
  });

  // ── the parse primitive ───────────────────────────────────────────────────

  describe('parseCellDate', () => {
    it('reads a date-only string as local midnight on that calendar day', () => {
      const d = parseCellDate('2026-03-15')!;
      expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 15]);
      expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0]);
    });

    it('reads shortened date-only forms as local, too', () => {
      const month = parseCellDate('2026-03')!;
      expect([month.getFullYear(), month.getMonth(), month.getDate()]).toEqual([2026, 2, 1]);
      expect(month.getHours()).toBe(0);
      const year = parseCellDate('2026')!;
      expect([year.getFullYear(), year.getMonth(), year.getDate()]).toEqual([2026, 0, 1]);
    });

    it('keeps instant semantics for values that carry a time', () => {
      // An explicit UTC instant stays that instant, wherever it is read.
      expect(parseCellDate('2026-03-15T23:30:00Z')!.getTime())
        .toBe(Date.UTC(2026, 2, 15, 23, 30, 0));
      // A zoneless date-time is local by spec.
      const local = parseCellDate('2026-03-15T10:00:00')!;
      expect([local.getDate(), local.getHours()]).toEqual([15, 10]);
    });

    it('passes Date instances and epoch numbers through unchanged', () => {
      const instance = new Date(2024, 2, 5);
      expect(parseCellDate(instance)!.getTime()).toBe(instance.getTime());
      expect(parseCellDate(instance.getTime())!.getTime()).toBe(instance.getTime());
    });

    /**
     * `new Date(2026, 12, 1)` ROLLS OVER to 2027-01-01 rather than rejecting.
     * Left unchecked, the local-midnight path would turn a typo the platform
     * calls invalid into a confident, wrong day — worse than the raw string,
     * because nothing on screen says it was never a date.
     */
    it('rejects out-of-range calendar days instead of rolling them over', () => {
      expect(parseCellDate('2026-13-01'), 'month 13').toBeNull();
      expect(parseCellDate('2026-00-00'), 'month/day 0').toBeNull();
      expect(parseCellDate('2026-02-30'), 'Feb 30').toBeNull();
      expect(parseCellDate('2026-04-31'), 'Apr 31').toBeNull();
      expect(parseCellDate('2026-15'), 'month 15').toBeNull();
      // A real leap day still parses; only impossible days are rejected.
      expect(parseCellDate('2024-02-29')!.getDate()).toBe(29);
      expect(parseCellDate('2026-02-29'), 'non-leap Feb 29').toBeNull();
    });

    it('shows the raw value for a day it refuses to parse', async () => {
      const cell = await makeCell({ value: '2026-13-01' });
      expect(cellText(cell)).toBe('2026-13-01');
    });

    it('returns null for empty and unparseable values', () => {
      expect(parseCellDate(null)).toBeNull();
      expect(parseCellDate(undefined)).toBeNull();
      expect(parseCellDate('')).toBeNull();
      expect(parseCellDate('   ')).toBeNull();
      expect(parseCellDate('not a date')).toBeNull();
      expect(parseCellDate(new Date('nope'))).toBeNull();
    });
  });

  // ── the zone sweep (child process per zone) ───────────────────────────────

  it('parses and formats the authored day in every timezone', () => {
    const probe = `
      const { parseCellDate } = await import('./packages/components/src/table/table-date.ts');
      const day = parseCellDate('2026-03-15');
      const short = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(day);
      const instant = parseCellDate('2026-03-15T23:30:00Z');
      console.log(JSON.stringify({
        fields: [day.getFullYear(), day.getMonth() + 1, day.getDate(), day.getHours()],
        short,
        instantMs: instant.getTime(),
      }));
    `;
    for (const zone of ZONES) {
      const out = execFileSync(
        process.execPath,
        ['--experimental-strip-types', '--input-type=module', '--eval', probe],
        { cwd: process.cwd(), env: { ...process.env, TZ: zone }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      const result = JSON.parse(out.trim().split('\n').pop()!);
      expect(result.fields, zone).toEqual([2026, 3, 15, 0]);
      expect(result.short, zone).toBe('3/15/26');
      expect(result.instantMs, zone).toBe(Date.UTC(2026, 2, 15, 23, 30, 0));
    }
  });

  // ── the date cell ─────────────────────────────────────────────────────────

  it('renders the authored calendar day', async () => {
    const cell = await makeCell({ value: '2026-03-15' });
    expect(cellText(cell)).toBe(shortLocalDay(2026, 3, 15));
    expect(cellText(cell)).toBe('3/15/26');
  });

  it('renders the authored day through a custom format', async () => {
    const cell = await makeCell({ value: '2026-03-15', customFormat: 'YYYY-MM-DD' });
    expect(cellText(cell)).toBe('2026-03-15');
  });

  it('renders the authored day for every showcase start date', async () => {
    const expected: Record<string, string> = {
      '2022-03-14': '3/14/22',
      '2023-08-21': '8/21/23',
      '2021-11-02': '11/2/21',
    };
    for (const [value, display] of Object.entries(expected)) {
      const cell = await makeCell({ value });
      expect(cellText(cell), value).toBe(display);
    }
  });

  it('still formats Date instances and instants correctly', async () => {
    const instance = await makeCell({ value: new Date(2024, 2, 5) });
    expect(cellText(instance)).toBe('3/5/24');

    const instant = new Date(Date.UTC(2026, 2, 15, 23, 30));
    const fromString = await makeCell({ value: '2026-03-15T23:30:00Z' });
    expect(cellText(fromString)).toBe(
      new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(instant),
    );
  });

  it('classifies today by calendar day, not by UTC midnight', async () => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const cell = await makeCell({ value: iso });
    expect(cell.classList.contains('date--today')).toBe(true);
    expect(cell.classList.contains('date--past')).toBe(false);
  });

  it('classifies a past and a future calendar day', async () => {
    const day = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const past = await makeCell({ value: day(-3) });
    expect(past.classList.contains('date--past')).toBe(true);
    const future = await makeCell({ value: day(3) });
    expect(future.classList.contains('date--future')).toBe(true);
  });

  // ── the formatter repaints when ANY of its inputs changes ─────────────────

  /**
   * `formatDateValue()` reads `dateFormat`, `customFormat`, `locale`,
   * `relativeTime` and `showTime` as well as `value`/`column`, but the cell
   * only watched the latter two — so a format changed after mount left the
   * cell showing the format it happened to be born with. Each property below
   * must repaint the day it describes.
   */
  it('repaints when a format property changes after mount', async () => {
    const cell = await makeCell({ value: '2026-03-15' });
    expect(cellText(cell)).toBe('3/15/26');

    cell.dateFormat = 'long';
    await wait(10);
    expect(cellText(cell), 'date-format').toBe(
      new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(2026, 2, 15)),
    );

    cell.customFormat = 'YYYY-MM-DD';
    await wait(10);
    expect(cellText(cell), 'custom-format').toBe('2026-03-15');

    cell.customFormat = undefined;
    cell.dateFormat = 'short';
    cell.locale = 'de-DE';
    await wait(10);
    expect(cellText(cell), 'locale').toBe(
      new Intl.DateTimeFormat('de-DE', { dateStyle: 'short' }).format(new Date(2026, 2, 15)),
    );
  });

  it('repaints when show-time and relative-time change after mount', async () => {
    const cell = await makeCell({ value: '2026-03-15T14:30:00' });
    const dayOnly = cellText(cell);

    cell.showTime = true;
    await wait(10);
    const withTime = cellText(cell);
    expect(withTime, 'show-time must add a time').not.toBe(dayOnly);
    expect(withTime).toBe(
      new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' })
        .format(new Date(2026, 2, 15, 14, 30)),
    );

    cell.relativeTime = true;
    await wait(10);
    expect(cellText(cell), 'relative-time must take over').not.toBe(withTime);
  });

  // ── the table body ────────────────────────────────────────────────────────

  it('paints the authored day in a typed date column', async () => {
    const table = await createComponent<any>('snice-table');
    hosts.push(table);
    const columns = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
    ];
    table.columns = columns;
    table.data = [
      { name: 'Alice Johnson', startDate: '2022-03-14' },
      { name: 'Diana Prince', startDate: '2023-08-21' },
      { name: 'Bob Smith', startDate: '2021-11-02' },
    ];
    table.unsortedData = [...table.data];
    table.columnManager.initialize(columns, table);
    await wait(20);
    table.renderHeader();
    table.renderBody();
    await wait(40);

    const rows = Array.from(table.shadowRoot.querySelectorAll('tbody tr')) as HTMLElement[];
    const shown = rows.map(r => {
      const td = r.querySelectorAll('td')[1];
      const host = td.querySelector('snice-cell-date') as any;
      return host ? cellText(host) : text(td);
    });
    expect(shown).toEqual(['3/14/22', '8/21/23', '11/2/21']);
  });

  it('shows the display cell and the date editor the same day', async () => {
    const table = await createComponent<any>('snice-table');
    hosts.push(table);
    const columns = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'startDate', label: 'Start Date', type: 'date', editable: true, editor: 'date' },
    ];
    table.columns = columns;
    table.data = [{ name: 'Diana Prince', startDate: '2023-08-21' }];
    table.unsortedData = [...table.data];
    table.columnManager.initialize(columns, table);
    await wait(20);
    table.renderHeader();
    table.renderBody();
    await wait(40);

    const displayed = cellText(table.shadowRoot.querySelector('snice-cell-date'));
    const editor = table.editor.createEditor('date', '2023-08-21') as HTMLInputElement;
    // The editor holds the raw ISO day; the cell must name that same day.
    expect(editor.value).toBe('2023-08-21');
    expect(displayed).toBe(shortLocalDay(2023, 8, 21));
  });

  // ── export and filtering agree with the display ───────────────────────────

  it('copies the same calendar day the cell displays', async () => {
    let copied = '';
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (t: string) => { copied = t; } },
      configurable: true,
    });

    const exporter = new TableExport();
    await exporter.copyToClipboard(
      [{ startDate: '2023-08-21' }],
      [{ key: 'startDate', label: 'Start Date', type: 'date' }] as any,
    );
    expect(copied).toBe('8/21/23');
  });

  it('filters a date-only column against a date-only bound', () => {
    const columns = [{ key: 'day', type: 'date' }];
    const days = (operator: any, rows: any[]) => {
      const engine = new TableFilterEngine();
      engine.setColumnFilter('day', operator, '2026-03-15');
      return engine.applyFilters(rows, columns).map(r => r.day);
    };
    const calendarDays = [{ day: '2026-03-14' }, { day: '2026-03-15' }, { day: '2026-03-16' }];

    expect(days('is', calendarDays)).toEqual(['2026-03-15']);
    expect(days('isNot', calendarDays)).toEqual(['2026-03-14', '2026-03-16']);
    expect(days('before', calendarDays)).toEqual(['2026-03-14']);
    expect(days('onOrBefore', calendarDays)).toEqual(['2026-03-14', '2026-03-15']);
    expect(days('onOrAfter', calendarDays)).toEqual(['2026-03-15', '2026-03-16']);

    // A timestamp on the filtered day belongs to that day, and is not pushed
    // before it by a UTC-parsed bound.
    const sameDay = [{ day: '2026-03-15T09:00:00' }];
    expect(days('is', sameDay)).toEqual(['2026-03-15T09:00:00']);
    expect(days('onOrAfter', sameDay)).toEqual(['2026-03-15T09:00:00']);
    expect(days('before', sameDay)).toEqual([]);
  });

  /**
   * A date-only bound names a whole DAY. Every ordering operator must therefore
   * agree with `is` about what falls on that day: comparing against the day's
   * opening instant alone made a 09:00 cell simultaneously "is the 15th" AND
   * "after the 15th", while `onOrBefore the 15th` excluded it.
   */
  it('brackets a date-only bound by the whole day it names', () => {
    const columns = [{ key: 'day', type: 'date' }];
    const rows = [
      { day: '2026-03-14T23:59:00' },
      { day: '2026-03-15' },
      { day: '2026-03-15T09:00:00' },
      { day: '2026-03-15T23:50:00' },
      { day: '2026-03-16' },
    ];
    const run = (operator: any) => {
      const engine = new TableFilterEngine();
      engine.setColumnFilter('day', operator, '2026-03-15');
      return engine.applyFilters(rows, columns).map(r => r.day);
    };

    const onTheDay = ['2026-03-15', '2026-03-15T09:00:00', '2026-03-15T23:50:00'];
    expect(run('is')).toEqual(onTheDay);
    expect(run('before')).toEqual(['2026-03-14T23:59:00']);
    expect(run('after')).toEqual(['2026-03-16']);
    expect(run('onOrBefore')).toEqual(['2026-03-14T23:59:00', ...onTheDay]);
    expect(run('onOrAfter')).toEqual([...onTheDay, '2026-03-16']);

    // before/after must be the exact complements of onOrAfter/onOrBefore.
    const all = rows.map(r => r.day);
    expect([...run('before'), ...run('onOrAfter')].sort()).toEqual([...all].sort());
    expect([...run('onOrBefore'), ...run('after')].sort()).toEqual([...all].sort());
  });

  it('keeps a bound that carries its own time an instant, not a day', () => {
    const columns = [{ key: 'day', type: 'date' }];
    const rows = [{ day: '2026-03-15T09:00:00' }, { day: '2026-03-15T18:00:00' }];
    const run = (operator: any) => {
      const engine = new TableFilterEngine();
      engine.setColumnFilter('day', operator, '2026-03-15T12:00:00');
      return engine.applyFilters(rows, columns).map(r => r.day);
    };
    expect(run('before')).toEqual(['2026-03-15T09:00:00']);
    expect(run('after')).toEqual(['2026-03-15T18:00:00']);
  });
});
