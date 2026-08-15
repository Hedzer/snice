// Shared fixtures for the `columns` slice of the table feature matrix:
// pinned (left/right), hidden, reordered and resized columns, plus column-set
// changes made while data is already on screen — each crossed with
// local/remote delivery and the documented value pipelines.
//
// NOT a test file (no `.test.ts` suffix), so vitest does not collect it.
import { expect } from 'vitest';
import {
  MatrixColumn, makeTable, deliver, dataRows, cellText, wait,
} from './matrix-utils';

// ── Value pipelines ────────────────────────────────────────────────────────
// The documented display pipeline is: valueGetter derives the working value,
// then formatter (row-aware) or valueFormatter produce the display text.
export type Pipeline =
  | 'none'
  | 'getter'
  | 'valueFormatter'
  | 'getterValueFormatter'
  | 'formatter';

export const PIPELINES: Pipeline[] = [
  'none', 'getter', 'valueFormatter', 'getterValueFormatter', 'formatter',
];

/** Pipelines whose derived value is readable from the row's own field. */
export const usesGetter = (p: Pipeline) =>
  p === 'getter' || p === 'getterValueFormatter';

/** Source field for a getter column — deliberately NOT the column key. */
export const sourceField = (key: string) => `${key}_src`;

/** Build one column definition for the given pipeline. */
export function columnFor(
  key: string,
  pipeline: Pipeline,
  extra: Partial<MatrixColumn> = {},
): MatrixColumn {
  const column: MatrixColumn = {
    key,
    label: key.toUpperCase(),
    type: 'text',
    ...extra,
  };
  if (usesGetter(pipeline)) {
    column.valueGetter = (_v: any, row: any) => row?.[sourceField(key)];
  }
  if (pipeline === 'valueFormatter' || pipeline === 'getterValueFormatter') {
    column.valueFormatter = (v: any) => `vf<${v}>`;
  }
  if (pipeline === 'formatter') {
    column.formatter = (v: any) => `fm<${v}>`;
  }
  return column;
}

export function columnsFor(
  keys: string[],
  pipeline: Pipeline,
  extraByKey: Record<string, Partial<MatrixColumn>> = {},
): MatrixColumn[] {
  return keys.map(key => columnFor(key, pipeline, extraByKey[key] ?? {}));
}

/**
 * Build a row for the given pipeline. `values` is keyed by COLUMN key; getter
 * pipelines store them under `<key>_src` so the column key is genuinely absent
 * from the row (the remote-mode shape from the field report).
 */
export function rowFor(pipeline: Pipeline, id: string, values: Record<string, string>): any {
  const row: any = { id };
  for (const [key, value] of Object.entries(values)) {
    row[usesGetter(pipeline) ? sourceField(key) : key] = value;
  }
  return row;
}

export function rowsFor(
  pipeline: Pipeline,
  specs: { id: string; values: Record<string, string> }[],
): any[] {
  return specs.map(spec => rowFor(pipeline, spec.id, spec.values));
}

/** Same row identity, one field changed — for mutated re-delivery. */
export function mutateRow(pipeline: Pipeline, row: any, key: string, value: string): any {
  const field = usesGetter(pipeline) ? sourceField(key) : key;
  return { ...row, [field]: value };
}

// ── Painted-column-order assertions (pipeline independent) ─────────────────

export function headerKeys(table: any): string[] {
  const ths = [...table.shadowRoot.querySelectorAll('thead tr.column-header-row th[data-key]')];
  return ths.map((th: any) => th.getAttribute('data-key'));
}

export function bodyKeys(tr: HTMLElement): string[] {
  return [...tr.querySelectorAll('td[data-key]')].map(td => td.getAttribute('data-key') as string);
}

/**
 * The painted column order must be identical in the header and in EVERY data
 * row — a header/body disagreement is exactly how a customer sees values land
 * under the wrong heading.
 */
export function expectColumnOrder(table: any, expected: string[]) {
  const problems: string[] = [];
  const header = headerKeys(table);
  if (header.join(',') !== expected.join(',')) {
    problems.push(`header order [${header}] != [${expected}]`);
  }
  dataRows(table).forEach((tr, i) => {
    const keys = bodyKeys(tr);
    if (keys.join(',') !== expected.join(',')) {
      problems.push(`row ${i} order [${keys}] != [${expected}]`);
    }
  });
  expect(problems).toEqual([]);
}

/**
 * No rendered data cell may be blank. The row scan is only a guard if rows are
 * actually on screen, so an empty body is itself reported rather than passing
 * vacuously; pass `expectedRowCount` to pin the exact number.
 */
export function expectNoBlankCells(table: any, expectedRowCount?: number) {
  const rows = dataRows(table);
  const blanks: string[] = [];
  if (rows.length === 0) blanks.push('no data rows rendered — nothing was checked');
  if (expectedRowCount !== undefined && rows.length !== expectedRowCount) {
    blanks.push(`row count ${rows.length}, expected ${expectedRowCount}`);
  }
  rows.forEach((tr, i) => {
    for (const td of [...tr.querySelectorAll('td[data-key]')] as HTMLElement[]) {
      if (cellText(td) === '') blanks.push(`row ${i} col ${td.getAttribute('data-key')}`);
    }
  });
  expect(blanks).toEqual([]);
}

/** Sticky side actually applied to the painted header + body cells. */
export function pinnedSides(table: any, key: string) {
  const th = table.shadowRoot.querySelector(`thead th[data-key="${key}"]`) as HTMLElement | null;
  const td = dataRows(table)[0]?.querySelector(`td[data-key="${key}"]`) as HTMLElement | null;
  return {
    header: th ? { position: th.style.position, left: th.style.left, right: th.style.right } : null,
    cell: td ? { position: td.style.position, left: td.style.left, right: td.style.right } : null,
  };
}

// ── Delivery ───────────────────────────────────────────────────────────────

/** Local delivery: assigning `data` rerenders (documented). */
export async function deliverLocal(table: any, rows: any[]) {
  table.data = rows;
  await wait(40);
}

/** Initial delivery for either mode. */
export async function makeDelivered(opts: {
  columns: MatrixColumn[];
  rows: any[];
  remote: boolean;
  attrs?: Record<string, any>;
}) {
  const table = await makeTable({
    columns: opts.columns,
    data: opts.remote ? undefined : opts.rows,
    remote: opts.remote,
    attrs: opts.attrs,
  });
  if (opts.remote) await deliver(table, opts.rows);
  else await wait(20);
  return table;
}

/** Re-delivery for either mode (same call shape, so combos stay symmetric). */
export async function redeliver(table: any, remote: boolean, rows: any[]) {
  if (remote) await deliver(table, rows);
  else await deliverLocal(table, rows);
}

/**
 * Collect remote data requests without answering them, so a column operation
 * can be applied while a request is still in flight.
 */
export function collectPending(table: any) {
  const pending: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];
  table.addEventListener('@request/table/data', (e: any) => {
    e.detail.discovery.resolve();
    pending.push(e.detail.data);
  });
  return pending;
}

export const MODES: { remote: boolean; label: string }[] = [
  { remote: false, label: 'local' },
  { remote: true, label: 'remote' },
];

// ── Column operations ──────────────────────────────────────────────────────

/** Drive a real resize gesture through the header handle. */
export async function resizeColumn(table: any, key: string, deltaPx: number) {
  const th = table.shadowRoot.querySelector(`thead th[data-key="${key}"]`) as HTMLElement;
  expect(th, `th[data-key=${key}] must exist to resize`).toBeTruthy();
  const handle = th.querySelector('.resize-handle') as HTMLElement;
  expect(handle, `column-resize handle for ${key}`).toBeTruthy();
  handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 400 }));
  document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 400 + deltaPx }));
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await wait(20);
}

export function columnWidth(table: any, key: string): string {
  const th = table.shadowRoot.querySelector(`thead th[data-key="${key}"]`) as HTMLElement | null;
  return th?.style.width ?? '';
}

export function cellWidths(table: any, key: string): string[] {
  return dataRows(table).map(tr => {
    const td = tr.querySelector(`td[data-key="${key}"]`) as HTMLElement | null;
    return td?.style.width ?? '';
  });
}

/** Collect the details of every `type` event the table emits from now on. */
export function collectEvents(table: any, type: string): any[] {
  const seen: any[] = [];
  table.addEventListener(type, (e: any) => seen.push(e.detail));
  return seen;
}

/** Is the header cell offered to the user as a drag source? */
export function headerDraggable(table: any, key: string): boolean {
  const th = table.shadowRoot.querySelector(`thead th[data-key="${key}"]`) as HTMLElement | null;
  return th?.draggable === true;
}

/**
 * Drive the documented DnD reorder gesture: drag the `fromKey` header cell onto
 * the `toKey` one. jsdom has no DragEvent, so the handler's `dataTransfer` is
 * supplied here — the events themselves are the real ones the component binds.
 */
export async function dragColumnOnto(table: any, fromKey: string, toKey: string) {
  const th = (key: string) => {
    const el = table.shadowRoot.querySelector(`thead th[data-key="${key}"]`) as HTMLElement | null;
    expect(el, `th[data-key=${key}] must exist to drag`).toBeTruthy();
    return el as HTMLElement;
  };
  const store: Record<string, string> = {};
  const dataTransfer = {
    effectAllowed: '', dropEffect: '',
    setData: (t: string, v: string) => { store[t] = v; },
    getData: (t: string) => store[t] ?? '',
  };
  const dragEvent = (type: string) => {
    const event: any = new Event(type, { bubbles: true, cancelable: true });
    event.dataTransfer = dataTransfer;
    return event;
  };
  th(fromKey).dispatchEvent(dragEvent('dragstart'));
  th(toKey).dispatchEvent(dragEvent('dragover'));
  th(toKey).dispatchEvent(dragEvent('drop'));
  await wait(40);
}
