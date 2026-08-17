/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-time-range-picker feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `docs/ai/components/time-range-picker.md` plus
 * `snice-time-range-picker.types.ts` describe a component whose entire rendered
 * surface is DERIVED from four properties, which is what makes a matrix worth
 * running here: every combo has one right answer and it can be computed.
 *
 *   doc: `granularity: 5|15|30|60 = 15`
 *   doc: `startTime = '00:00'` (attr `start-time`), `endTime = '23:59'`
 *   doc: `format: '12h'|'24h' = '24h'`
 *   doc: `value = ''` — "JSON array of TimeRange[]"
 *   doc: `disabledRanges = ''` (attr `disabled-ranges`) — same JSON shape
 *   doc: `multiple`, `readonly`, `disabled` — booleans, default false
 *   doc: parts `base` / `header` / `slots`
 *   doc: methods `getSelectedRanges` / `setSelectedRanges` / `clearSelection` /
 *        `isSlotDisabled`
 *   doc: events `time-range-change` / `time-range-select` / `time-range-complete`
 *
 * So the oracle is arithmetic: `expectedSlots()` derives the slot column from the
 * window and the granularity, `expectedLabel()` derives each slot's caption
 * from the format, and `expectedSelection()` derives which slots a `value` (or
 * a gesture) selects. Every assertion routes through `check*` helpers so a
 * combo reports EVERY violation at once rather than dying on the first.
 *
 * `.ai/fuzzing.md`: expectations come from the doc, never from observed output;
 * a divergence is pinned with `it.fails` and a `MATRIX-time-range-picker-N` id
 * and the assertion stays correct.
 *
 * ── One environment compensation ───────────────────────────────────────────
 *
 * A drag's intermediate moves are resolved with `shadowRoot.elementFromPoint`,
 * and happy-dom performs no layout, so that call can never find a slot. `drag()`
 * substitutes the hit test with the slot the gesture is aiming at — the same
 * answer a browser's layout would give — and nothing else. The visual tier
 * measures the real hit testing.
 */
import { Problems, expectClean, part, text, wait } from '../matrix-kit';
import { mount, removeComponent } from '../matrix-utils';
import '../../../packages/components/src/time-range-picker/snice-time-range-picker';
import type {
  SniceTimeRangePickerElement, TimeRange, TimeRangeGranularity,
} from '../../../packages/components/src/time-range-picker/snice-time-range-picker.types';

export { Problems, expectClean, part, removeComponent, text, wait };
export type Picker = SniceTimeRangePickerElement & { shadowRoot: ShadowRoot };
export type { TimeRange };

/** Settle window: the component renders on a microtask plus a queued task. */
export const SETTLE = 25;

// ── Documented dimensions ───────────────────────────────────────────────────

/** doc: `granularity: 5|15|30|60 = 15` */
export const GRANULARITIES: TimeRangeGranularity[] = [5, 15, 30, 60];
/** doc: `format: '12h'|'24h' = '24h'` */
export const FORMATS = ['24h', '12h'] as const;

/**
 * Two windows. `day` is the documented default pair (`00:00` … `23:59`), which
 * is the only one that exercises midnight and the 12h period flip; `morning`
 * is the doc's own `start-time="08:00" end-time="18:00"` example, narrowed so
 * the finer granularities stay cheap.
 */
export const WINDOWS = {
  day: { startTime: '00:00', endTime: '23:59' },
  morning: { startTime: '08:00', endTime: '12:00' },
} as const;
export type WindowName = keyof typeof WINDOWS;
export const WINDOW_NAMES = Object.keys(WINDOWS) as WindowName[];

export interface PickerVector {
  granularity: TimeRangeGranularity;
  window: WindowName;
  format: typeof FORMATS[number];
  multiple: boolean;
  readonly: boolean;
  disabled: boolean;
  value: string;
  disabledRanges: string;
}

export const DEFAULTS: PickerVector = {
  granularity: 15,
  window: 'morning',
  format: '24h',
  multiple: false,
  readonly: false,
  disabled: false,
  value: '',
  disabledRanges: '',
};

export function vectorId(vector: PickerVector): string {
  const flags = [
    vector.multiple ? 'multiple' : '',
    vector.readonly ? 'readonly' : '',
    vector.disabled ? 'disabled' : '',
    vector.value ? 'valued' : '',
    vector.disabledRanges ? 'blocked' : '',
  ].filter(Boolean);
  return `${vector.window}/gran=${vector.granularity}/${vector.format}/[${flags.join(',') || 'plain'}]`;
}

// ── The documented derivations ──────────────────────────────────────────────

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * doc: "Vertically stacked time slot picker", `granularity`, `startTime`,
 * `endTime`. The slots are every `granularity` minutes from `startTime` up to
 * and including `endTime` — a picker whose window ends at `23:59` with a
 * 15-minute granularity therefore stops at `23:45`, the last slot that starts
 * inside the window.
 */
export function expectedSlots(vector: PickerVector): string[] {
  const { startTime, endTime } = WINDOWS[vector.window];
  const out: string[] = [];
  for (let m = toMinutes(startTime); m <= toMinutes(endTime); m += vector.granularity) {
    out.push(toTime(m));
  }
  return out;
}

/** doc: `format: '12h'|'24h'`. 24h is the slot's own `HH:MM`. */
export function expectedLabel(time: string, format: typeof FORMATS[number]): string {
  if (format === '24h') return time;
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * The slot indices a JSON `TimeRange[]` covers.
 *
 * doc: `value = ''  // JSON array of TimeRange[]`. A range names the FIRST and
 * LAST slot it covers (that is the shape `getSelectedRanges()` returns, so it
 * is the shape `value` round-trips through), and a range whose ends are not
 * slot boundaries covers every slot that starts inside it.
 */
export function indicesFor(json: string, slots: string[]): number[] {
  if (!json) return [];
  let ranges: TimeRange[];
  try { ranges = JSON.parse(json); } catch { return []; }
  const hit = new Set<number>();
  for (const range of ranges) {
    const from = toMinutes(range.start);
    const to = toMinutes(range.end);
    slots.forEach((slot, index) => {
      const start = toMinutes(slot);
      if (start >= from && start <= to) hit.add(index);
    });
  }
  return [...hit].sort((a, b) => a - b);
}

/**
 * doc: `getSelectedRanges(): TimeRange[]`. Contiguous runs of selected slots
 * become one range each, named by the first and last slot of the run.
 */
export function rangesFor(indices: number[], slots: string[]): TimeRange[] {
  const sorted = [...indices].sort((a, b) => a - b);
  const out: TimeRange[] = [];
  let start = -1;
  let prev = -1;
  for (const index of sorted) {
    if (start < 0) { start = index; prev = index; continue; }
    if (index !== prev + 1) { out.push({ start: slots[start], end: slots[prev] }); start = index; }
    prev = index;
  }
  if (start >= 0) out.push({ start: slots[start], end: slots[prev] });
  return out;
}

/**
 * doc: "header — The header with label and selected value display".
 *
 * A selected run reads from the start of its first slot to the END of its last
 * one — the last slot's start plus one granularity — because that is the span
 * the reader picked. An empty selection reads "No selection".
 */
export function expectedDisplay(ranges: TimeRange[], vector: PickerVector): string {
  if (!ranges.length) return 'No selection';
  return ranges.map((range) => {
    const from = expectedLabel(range.start, vector.format);
    const to = expectedLabel(toTime(toMinutes(range.end) + vector.granularity), vector.format);
    return `${from} - ${to}`;
  }).join(', ');
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo through the documented ATTRIBUTE channel, which is the form
 * every example in the doc uses (`start-time`, `end-time`, `granularity`,
 * `format`, `multiple`, `value`, `disabled-ranges`).
 */
export async function makePicker(vector: Partial<PickerVector> = {}): Promise<Picker> {
  const full = { ...DEFAULTS, ...vector };
  const attrs: Record<string, any> = {
    'start-time': WINDOWS[full.window].startTime,
    'end-time': WINDOWS[full.window].endTime,
    granularity: full.granularity,
    format: full.format,
  };
  if (full.value) attrs.value = full.value;
  if (full.disabledRanges) attrs['disabled-ranges'] = full.disabledRanges;
  if (full.multiple) attrs.multiple = true;
  if (full.readonly) attrs.readonly = true;
  if (full.disabled) attrs.disabled = true;

  const el = await mount<Picker>('snice-time-range-picker', attrs);
  await wait(SETTLE);
  return el;
}

/** The full vector a partial one stands for — the id and the oracle need it. */
export function fill(vector: Partial<PickerVector>): PickerVector {
  return { ...DEFAULTS, ...vector };
}

// ── Reading the rendered tree ───────────────────────────────────────────────

export function slotNodes(el: Picker): HTMLElement[] {
  return [...el.shadowRoot.querySelectorAll('.slot')] as HTMLElement[];
}

export function slotTimes(el: Picker): string[] {
  return slotNodes(el).map(node => node.getAttribute('data-time') ?? '');
}

export function selectedIndices(el: Picker): number[] {
  return slotNodes(el)
    .map((node, index) => (node.getAttribute('aria-selected') === 'true' ? index : -1))
    .filter(index => index >= 0);
}

export function headerValue(el: Picker): string {
  return text(part(el, 'header')?.querySelector('.header-value'));
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/** doc: "CSS Parts — `base`, `header`, `slots`". All three, in every combo. */
export function checkShell(problems: Problems, el: Picker, vector: PickerVector): void {
  const base = part(el, 'base');
  const header = part(el, 'header');
  const slots = part(el, 'slots');
  problems.check(!!base, 'no element exposes part="base"');
  problems.check(!!header, 'no element exposes part="header"');
  problems.check(!!slots, 'no element exposes part="slots"');
  if (base && header) problems.check(base.contains(header), 'part="header" is not inside part="base"');
  if (base && slots) problems.check(base.contains(slots), 'part="slots" is not inside part="base"');
  if (header) problems.equal(text(header.querySelector('.header-label')), 'Time', 'the header label');

  // The documented switches must survive the attribute channel the doc uses.
  problems.equal(el.granularity, vector.granularity, 'granularity');
  problems.equal(el.format, vector.format, 'format');
  problems.equal(el.multiple, vector.multiple, 'multiple');
  problems.equal(el.readonly, vector.readonly, 'readonly');
  problems.equal(el.disabled, vector.disabled, 'disabled');
  problems.equal(el.startTime, WINDOWS[vector.window].startTime, 'startTime');
  problems.equal(el.endTime, WINDOWS[vector.window].endTime, 'endTime');
}

/**
 * The slot column: one option per documented slot, captioned in the documented
 * format, and marked with the state the combo puts it in.
 */
export function checkSlots(problems: Problems, el: Picker, vector: PickerVector): void {
  const expected = expectedSlots(vector);
  const nodes = slotNodes(el);
  if (!problems.equal(nodes.length, expected.length, 'slot count')) return;

  const blocked = new Set(indicesFor(vector.disabledRanges, expected));
  const chosen = new Set(indicesFor(vector.value, expected).filter(i => !blocked.has(i)));

  nodes.forEach((node, index) => {
    const time = expected[index];
    problems.equal(node.getAttribute('data-time'), time, `slot ${index} data-time`);
    problems.equal(node.getAttribute('data-index'), String(index), `slot ${index} data-index`);
    problems.equal(node.getAttribute('role'), 'option', `slot ${index} role`);
    problems.equal(text(node.querySelector('.slot-time')), expectedLabel(time, vector.format),
      `slot ${index} caption`);
    problems.equal(node.getAttribute('aria-disabled'), blocked.has(index) ? 'true' : 'false',
      `slot ${index} aria-disabled`);
    problems.equal(node.getAttribute('aria-selected'), chosen.has(index) ? 'true' : 'false',
      `slot ${index} aria-selected`);
    problems.equal(node.getAttribute('tabindex'), blocked.has(index) ? '-1' : '0',
      `slot ${index} tabindex`);
  });
}

/**
 * The selection, read three ways the doc promises must agree: the rendered
 * `aria-selected` flags, `getSelectedRanges()`, and the header's value display.
 */
export function checkSelection(
  problems: Problems,
  el: Picker,
  vector: PickerVector,
  expectedRanges: TimeRange[],
): void {
  const slots = expectedSlots(vector);
  const expectedIndices = expectedRanges.flatMap((range) => {
    const from = slots.indexOf(range.start);
    const to = slots.indexOf(range.end);
    return from < 0 || to < 0 ? [] : Array.from({ length: to - from + 1 }, (_, k) => from + k);
  });

  problems.equal(selectedIndices(el).join(','), expectedIndices.join(','),
    'the slots marked aria-selected');
  problems.equal(JSON.stringify(el.getSelectedRanges()), JSON.stringify(expectedRanges),
    'getSelectedRanges()');
  problems.equal(headerValue(el), expectedDisplay(expectedRanges, vector), 'the header value display');
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record the three documented events in dispatch order. */
export function capturePicker(el: Picker): Seen[] {
  const seen: Seen[] = [];
  for (const type of ['time-range-select', 'time-range-complete', 'time-range-change']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

/**
 * The documented "click-and-drag range selection", from slot `from` to slot
 * `to`.
 *
 * The intermediate move is resolved by the component with
 * `shadowRoot.elementFromPoint`, which happy-dom cannot answer without layout;
 * the hit test is substituted with the slot the gesture is aiming at, which is
 * the answer a browser's layout would give. Nothing else is stubbed: the
 * mousedown, the document-level listeners and the mouseup are the component's
 * own.
 */
export async function drag(el: Picker, from: number, to: number): Promise<void> {
  const nodes = slotNodes(el);
  nodes[from]?.dispatchEvent(new MouseEvent('mousedown', {
    bubbles: true, composed: true, cancelable: true,
  }));
  await wait(SETTLE);

  if (to !== from) {
    const step = to > from ? 1 : -1;
    for (let index = from + step; ; index += step) {
      const target = slotNodes(el)[index];
      (el.shadowRoot as any).elementFromPoint = () => target;
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1, clientY: 1 }));
      await wait(5);
      if (index === to) break;
    }
  }

  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await wait(SETTLE);
}

/** A single-slot click: the degenerate drag the doc's basic usage implies. */
export async function clickSlot(el: Picker, index: number): Promise<void> {
  await drag(el, index, index);
}

/** A keydown on a slot, with the composed flag a real key event carries. */
export async function pressSlot(el: Picker, index: number, key: string): Promise<void> {
  slotNodes(el)[index]?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  await wait(SETTLE);
}

/** JSON for a `TimeRange[]`, the form both documented JSON properties take. */
export function json(...ranges: TimeRange[]): string {
  return JSON.stringify(ranges);
}
