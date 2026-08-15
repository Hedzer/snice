/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-availability — matrix oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is derived from `docs/ai/components/availability.md`
 * and `snice-availability.types.ts`, never from what the component emits:
 *
 *   · "Weekly availability grid. 7 columns (Mon-Sun), rows = time slots."
 *   · `granularity` — "slot size in minutes (15, 30, 60)"
 *   · `startHour` / `endHour` — the window the rows span
 *   · `format: '12h'|'24h'` — how a time reads
 *   · `readonly` — "Toggle cells by click or drag" no longer applies
 *   · `value: AvailabilityRange[]` with `day` 0=Mon … 6=Sun and "HH:MM" bounds
 *   · CSS parts `base`, `header`, `grid`
 *   · `availability-change` → `{ value: AvailabilityRange[] }`
 *   · `getAvailability()` / `setAvailability(ranges)` / `clear()`
 *
 * The oracle is the pair the table matrix uses: `expected*(combo)` describes the
 * documented grid, `read*(el)` reads the same description back, and every combo
 * reports EVERY divergence at once through `expectNoProblems`.
 */
import {
  mount, one, all, part, text, wait, expectNoProblems,
} from '../matrix-utils';
import type { AvailabilityRange } from '../../../packages/components/src/availability/snice-availability.types';
import '../../../packages/components/src/availability/snice-availability';

export { wait, expectNoProblems };

/** "7 columns (Mon-Sun)", and `day: 0=Mon, 1=Tue, ..., 6=Sun`. */
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** The documented slot sizes: "slot size in minutes (15, 30, 60)". */
export const GRANULARITIES = [15, 30, 60] as const;

/** `format: '12h'|'24h'`. */
export const FORMATS = ['12h', '24h'] as const;

export type Window = readonly [start: number, end: number];

/** Windows worth crossing: the documented default, and two clipped ones. */
export const WINDOWS: Window[] = [[0, 24], [8, 18], [9, 17]];

export interface AvailabilityCombo {
  granularity: number;
  window: Window;
  format: '12h' | '24h';
  readonly: boolean;
  ranges: AvailabilityRange[];
}

export function combo(over: Partial<AvailabilityCombo> = {}): AvailabilityCombo {
  return {
    granularity: 60,
    window: [0, 24],
    format: '12h',
    readonly: false,
    ranges: [],
    ...over,
  };
}

export function comboName(c: AvailabilityCombo): string {
  const flags = [c.readonly ? 'readonly' : 'editable'];
  return `g${c.granularity}/${c.window[0]}-${c.window[1]}/${c.format}/${flags.join(',')}`
    + (c.ranges.length ? `/ranges=${c.ranges.length}` : '');
}

// ── Mounting ────────────────────────────────────────────────────────────────

export async function makeAvailability(c: AvailabilityCombo): Promise<any> {
  const el = await mount<any>('snice-availability', {
    granularity: c.granularity,
    'start-hour': c.window[0],
    'end-hour': c.window[1],
    format: c.format,
    ...(c.readonly ? { readonly: true } : {}),
  });
  if (c.ranges.length) {
    el.value = c.ranges.map(r => ({ ...r }));
  }
  await wait(20);
  return el;
}

// ── Documented derivations ──────────────────────────────────────────────────

/** rows = time slots: one row per `granularity` minutes of the hour window. */
export function expectedSlotCount(c: AvailabilityCombo): number {
  return (c.window[1] - c.window[0]) * (60 / c.granularity);
}

/** Absolute minute-of-week-day at which slot `index` begins. */
export function slotMinute(c: AvailabilityCombo, index: number): number {
  return c.window[0] * 60 + index * c.granularity;
}

/** `"HH:MM"` -> minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * How a time reads under `format`. `'24h'` is the zero-padded `HH:MM` the
 * `AvailabilityRange` bounds are already written in; `'12h'` is the same
 * instant on a 12-hour clock with its period.
 */
export function formatTime(minutes: number, format: '12h' | '24h'): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (format === '24h') {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * The `day-slot` keys a value vector makes available.
 *
 * A slot is available when the whole slot lies inside one of the ranges for
 * that day — `value` is a list of availability intervals and a slot is the
 * indivisible unit the grid can express. Slots outside `[startHour, endHour)`
 * cannot be shown at all, so they are clipped.
 */
export function expectedActiveKeys(c: AvailabilityCombo): Set<string> {
  const keys = new Set<string>();
  const slots = expectedSlotCount(c);
  for (const range of c.ranges) {
    const from = toMinutes(range.start);
    const to = toMinutes(range.end);
    for (let index = 0; index < slots; index++) {
      const begin = slotMinute(c, index);
      const end = begin + c.granularity;
      if (begin >= from && end <= to) keys.add(`${range.day}-${index}`);
    }
  }
  return keys;
}

// ── Reading the rendered grid back ──────────────────────────────────────────

export interface GridReading {
  hasBase: boolean;
  hasHeader: boolean;
  hasGrid: boolean;
  dayHeaders: string[];
  slotRows: number;
  cellsPerRow: number[];
  hourLabels: string[];
  activeKeys: Set<string>;
  cellKeys: string[];
}

export function readGrid(el: HTMLElement): GridReading {
  const grid = part(el, 'grid');
  const rows = grid ? [...grid.querySelectorAll('[role="row"]')] : [];
  const [headerRow, ...slotRows] = rows;
  const cells = all(el, '[role="gridcell"]');
  const activeKeys = new Set<string>();
  const cellKeys: string[] = [];
  for (const cell of cells) {
    const key = (cell as HTMLElement).dataset.key ?? '';
    cellKeys.push(key);
    if (cell.getAttribute('aria-selected') === 'true') activeKeys.add(key);
  }
  return {
    hasBase: !!part(el, 'base'),
    hasHeader: !!part(el, 'header'),
    hasGrid: !!grid,
    dayHeaders: headerRow
      ? [...headerRow.querySelectorAll('[role="columnheader"]')]
          .map(node => text(node)).filter(Boolean)
      : [],
    slotRows: slotRows.length,
    cellsPerRow: slotRows.map(row => row.querySelectorAll('[role="gridcell"]').length),
    hourLabels: slotRows
      .map(row => text(row.querySelector('[role="rowheader"]')))
      .filter(Boolean),
    activeKeys,
    cellKeys,
  };
}

/**
 * The one oracle every structural combo goes through: the rendered grid must
 * match the documented one on parts, columns, rows and availability.
 */
export function checkGrid(el: HTMLElement, c: AvailabilityCombo): string[] {
  const problems: string[] = [];
  const got = readGrid(el);
  const slots = expectedSlotCount(c);

  if (!got.hasBase) problems.push('part="base" missing');
  if (!got.hasHeader) problems.push('part="header" missing');
  if (!got.hasGrid) problems.push('part="grid" missing');

  const days = got.dayHeaders.join(',');
  const wantDays = DAY_NAMES.join(',');
  if (days !== wantDays) problems.push(`day columns: "${days}" != "${wantDays}"`);

  if (got.slotRows !== slots) problems.push(`slot rows: ${got.slotRows} != ${slots}`);
  const wrongWidth = got.cellsPerRow.filter(count => count !== 7).length;
  if (wrongWidth) problems.push(`${wrongWidth} rows do not have 7 day cells`);

  // Every hour boundary inside the window reads in the requested format.
  const wantHourLabels: string[] = [];
  for (let index = 0; index < slots; index++) {
    const minutes = slotMinute(c, index);
    if (minutes % 60 === 0) wantHourLabels.push(formatTime(minutes, c.format));
  }
  if (got.hourLabels.join('|') !== wantHourLabels.join('|')) {
    problems.push(`hour labels: [${got.hourLabels.join(',')}] != [${wantHourLabels.join(',')}]`);
  }

  const want = expectedActiveKeys(c);
  const missing = [...want].filter(key => !got.activeKeys.has(key));
  const extra = [...got.activeKeys].filter(key => !want.has(key));
  if (missing.length) problems.push(`available slots missing: ${missing.slice(0, 6).join(',')}`);
  if (extra.length) problems.push(`slots available that should not be: ${extra.slice(0, 6).join(',')}`);

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export function cellAt(el: HTMLElement, day: number, slot: number): HTMLElement | null {
  return one<HTMLElement>(el, `[data-key="${day}-${slot}"]`);
}

export function isActive(el: HTMLElement, day: number, slot: number): boolean {
  return cellAt(el, day, slot)?.classList.contains('availability__cell--active') ?? false;
}

/** A press on a cell — the "click … to toggle cells" gesture's first half. */
export function pressCell(el: HTMLElement, day: number, slot: number): void {
  cellAt(el, day, slot)?.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }),
  );
}

/** Dragging over a cell, after a `pressCell`. */
export function dragOverCell(el: HTMLElement, day: number, slot: number): void {
  cellAt(el, day, slot)?.dispatchEvent(
    new MouseEvent('mouseenter', { bubbles: true, composed: true }),
  );
}

/** Releasing the pointer — what commits a click or drag to `value`. */
export function releasePointer(): void {
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true }));
}

export function collectChanges(el: HTMLElement): Array<{ value: AvailabilityRange[] }> {
  const seen: Array<{ value: AvailabilityRange[] }> = [];
  el.addEventListener('availability-change', (event: Event) => {
    seen.push((event as CustomEvent).detail);
  });
  return seen;
}
