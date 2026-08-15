// Shared fixtures for the selection slice of the table feature matrix.
//
// Slice: `selectable` / `selection-mode` crossed with `striped` / `hoverable` /
// `clickable`, against the delivery dimensions (local vs remote, initial vs
// re-delivery vs mutated re-delivery) and the value pipeline
// (none / valueGetter / valueFormatter / valueGetter+valueFormatter / formatter).
import { expect } from 'vitest';
import { dataRows, type MatrixColumn } from './matrix-utils';

/** Row shape: `companyName` is deliberately NOT a column key, so the
 *  valueGetter pipelines have to bridge a key that is not a row field. */
export interface Row { id: string; name: string; companyName: string }

export const ROWS: Row[] = [
  { id: 'r0', name: 'Alice', companyName: 'Zeta' },
  { id: 'r1', name: 'Bob', companyName: 'Alpha' },
  { id: 'r2', name: 'Carol', companyName: 'Mid' },
];

/** Fresh copies — tests that sort/mutate must not share row identity. */
export const rows = (): Row[] => ROWS.map(r => ({ ...r }));

export const ID_COLUMN: MatrixColumn = { key: 'id', label: 'ID', type: 'text', sortable: true };

/** The five required pipeline shapes, plus the formatter+valueFormatter pair. */
export const PIPELINES: Record<string, MatrixColumn> = {
  // no pipeline: the column key IS a row field
  none: { key: 'name', label: 'Name', type: 'text', sortable: true },
  // valueGetter: the column key is NOT a row field
  valueGetter: {
    key: 'company', label: 'Company', type: 'text', sortable: true,
    valueGetter: (_v: any, row: any) => row.companyName,
  },
  valueFormatter: {
    key: 'name', label: 'Name', type: 'text', sortable: true,
    valueFormatter: (v: any) => `[${v}]`,
  },
  'valueGetter+valueFormatter': {
    key: 'company', label: 'Company', type: 'text', sortable: true,
    valueGetter: (_v: any, row: any) => row.companyName,
    valueFormatter: (v: any) => `[${v}]`,
  },
  formatter: {
    key: 'name', label: 'Name', type: 'text', sortable: true,
    formatter: (v: any) => `<${v}>`,
  },
  'formatter+valueFormatter': {
    key: 'name', label: 'Name', type: 'text', sortable: true,
    formatter: (v: any) => `<${v}>`,
    valueFormatter: (v: any) => `[${v}]`,
  },
};

export const PIPELINE_KEYS = Object.keys(PIPELINES);

/** Selection attribute combinations under test.
 *
 *  `flags` records what the variant DECLARES about the three presentational
 *  attributes, so `expectPresentationHooks` can be given an expectation derived
 *  from the variant spec rather than read back off the element under test. */
export interface PresentationFlags { striped: boolean; hoverable: boolean; clickable: boolean }

export interface SelectionVariant {
  name: string;
  attrs: Record<string, any>;
  /** documented structural consequence: a checkbox tool column is rendered */
  hasSelectionColumn: boolean;
  /** documented structural consequence: a select-all control is rendered */
  hasSelectAll: boolean;
  flags: PresentationFlags;
}

export const SELECTION_VARIANTS: SelectionVariant[] = [
  {
    name: 'selectable+striped',
    attrs: { selectable: true, striped: true },
    hasSelectionColumn: true, hasSelectAll: true,
    flags: { striped: true, hoverable: false, clickable: false },
  },
  {
    name: 'selectable+single+hoverable',
    attrs: { selectable: true, 'selection-mode': 'single', hoverable: true },
    hasSelectionColumn: true, hasSelectAll: false,
    flags: { striped: false, hoverable: true, clickable: false },
  },
  {
    name: 'selectable+none+clickable',
    attrs: { selectable: true, 'selection-mode': 'none', clickable: true },
    hasSelectionColumn: false, hasSelectAll: false,
    flags: { striped: false, hoverable: false, clickable: true },
  },
  {
    name: 'selectable+striped+hoverable+clickable',
    attrs: { selectable: true, striped: true, hoverable: true, clickable: true },
    hasSelectionColumn: true, hasSelectAll: true,
    flags: { striped: true, hoverable: true, clickable: true },
  },
  {
    // `selection-mode` stated explicitly (the other variants reach `multiple`
    // through the property default), and `hoverable` switched OFF — the only
    // way to exercise the attribute at all, since it defaults to true.
    name: 'selectable+multiple(explicit)+hoverable=false',
    attrs: { selectable: true, 'selection-mode': 'multiple', hoverable: false },
    hasSelectionColumn: true, hasSelectAll: true,
    flags: { striped: false, hoverable: false, clickable: false },
  },
  {
    // Structural baseline: the three presentational attributes on their own
    // must render NO selection column, in every pipeline and at every stage.
    name: 'not-selectable+striped+hoverable+clickable',
    attrs: { selectable: false, striped: true, hoverable: true, clickable: true },
    hasSelectionColumn: false, hasSelectAll: false,
    flags: { striped: true, hoverable: true, clickable: true },
  },
];

/** The eight subsets of the presentational attributes. */
const FLAG_SUBSETS: PresentationFlags[] = [0, 1, 2, 3, 4, 5, 6, 7].map(bits => ({
  striped: !!(bits & 1), hoverable: !!(bits & 2), clickable: !!(bits & 4),
}));

const flagName = (f: PresentationFlags) =>
  ([f.striped && 'striped', f.hoverable && 'hoverable', f.clickable && 'clickable']
    .filter(Boolean) as string[]).join('+') || 'no-flags';

export interface AttributeCombo {
  name: string;
  attrs: Record<string, any>;
  selectable: boolean;
  mode: 'multiple' | 'single' | 'none';
  flags: PresentationFlags;
  hasSelectionColumn: boolean;
  hasSelectAll: boolean;
}

/**
 * The COMPLETE attribute cross of the slice: `selectable` × the three
 * `selection-mode` values × all eight subsets of striped/hoverable/clickable
 * (24), plus the eight non-selectable subsets that prove the presentational
 * attributes alone never grow a tool column (32 in total).
 */
export const ATTRIBUTE_COMBOS: AttributeCombo[] = [
  ...(['multiple', 'single', 'none'] as const).flatMap(mode =>
    FLAG_SUBSETS.map(flags => ({
      name: `selectable+${mode}+${flagName(flags)}`,
      attrs: { selectable: true, 'selection-mode': mode, ...flags },
      selectable: true,
      mode,
      flags,
      hasSelectionColumn: mode !== 'none',
      hasSelectAll: mode === 'multiple',
    }))),
  ...FLAG_SUBSETS.map(flags => ({
    name: `not-selectable+${flagName(flags)}`,
    attrs: { selectable: false, ...flags },
    selectable: false,
    mode: 'multiple' as const,
    flags,
    hasSelectionColumn: false,
    hasSelectAll: false,
  })),
];

export function dataRowsCount(table: any): number {
  return dataRows(table).length;
}

export function selectAllCheckbox(table: any): any {
  return table.shadowRoot.querySelector('snice-checkbox.select-all');
}

export function rowCheckbox(table: any, dataIndex: number): any {
  return table.shadowRoot.querySelector(
    `tbody tr[data-index="${dataIndex}"] snice-checkbox.row-select`);
}

export function trFor(table: any, dataIndex: number): HTMLElement | null {
  return table.shadowRoot.querySelector(`tbody tr[data-index="${dataIndex}"]`);
}

/** Fire the same `change` a user's checkbox click produces. */
export function toggleCheckbox(cb: any, checked: boolean) {
  cb.checked = checked;
  cb.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

export function clickRow(table: any, dataIndex: number, mods: Partial<MouseEventInit> = {}) {
  trFor(table, dataIndex)!.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true, ...mods }));
}

/** The rendered display text of a cell — the typed cell's own content, which is
 *  what a user reads on screen (matrix-utils `cellText` reads the `value`
 *  attribute instead, which is the pre-format pipeline value). */
export function renderedCellText(table: any, dataIndex: number, key: string): string {
  const td = trFor(table, dataIndex)?.querySelector(`td[data-key="${key}"]`) as HTMLElement | null;
  if (!td) return '<missing td>';
  const cell = td.querySelector('[value]') as any;
  if (!cell) return td.textContent?.trim() ?? '';
  const content = cell.shadowRoot?.querySelector('[part~="content"]') as HTMLElement | null;
  return (content?.textContent ?? cell.getAttribute('value') ?? '').trim();
}

/** Documented display text: valueGetter derives the value, then formatter
 *  (row-aware) or, as fallback, valueFormatter produces the display string. */
export function expectedDisplayText(column: MatrixColumn, row: any): string {
  const raw = row[column.key];
  const value = column.valueGetter ? column.valueGetter(raw, row) : raw;
  if (column.formatter) return String(column.formatter(value, row));
  if (column.valueFormatter) return String(column.valueFormatter(value, row));
  return value == null ? '' : String(value);
}

/**
 * Structural + selection-state invariant for the whole rendered body:
 *  - the selection tool column exists exactly when `selectable` and
 *    `selection-mode !== 'none'`, in header and in every body row;
 *  - every body row has as many cells as the header has columns;
 *  - `data-selected` and the row checkbox agree with `table.selectedRows`;
 *  - each row checkbox carries its own data index;
 *  - no data cell is unexpectedly empty.
 */
export function expectSelectionDomConsistent(table: any, label = '') {
  const problems: string[] = [];
  const expectSelCol = !!table.selectable && table.selectionMode !== 'none';
  const selected: number[] = table.selectedRows ?? [];

  const headerCells = [...table.shadowRoot.querySelectorAll('thead th')];
  const headerSelCol = table.shadowRoot.querySelector('thead th.select-column');
  if (expectSelCol && !headerSelCol) problems.push('header: select-column th missing');
  if (!expectSelCol && headerSelCol) problems.push('header: select-column th present');

  const selectAll = selectAllCheckbox(table);
  const expectSelectAll = expectSelCol && table.selectionMode === 'multiple';
  if (expectSelectAll && !selectAll) problems.push('header: select-all checkbox missing');
  if (!expectSelectAll && selectAll) problems.push('header: select-all checkbox present');

  for (const tr of dataRows(table)) {
    const index = Number(tr.getAttribute('data-index'));
    const isSelected = selected.includes(index);
    const cells = [...tr.querySelectorAll('td')];

    if (cells.length !== headerCells.length) {
      problems.push(`row ${index}: ${cells.length} cells vs ${headerCells.length} header columns`);
    }
    if (tr.getAttribute('data-selected') !== String(isSelected)) {
      problems.push(`row ${index}: data-selected="${tr.getAttribute('data-selected')}" but selectedRows=${JSON.stringify(selected)}`);
    }

    const selCell = tr.querySelector('td.select-column');
    const cb = tr.querySelector('snice-checkbox.row-select') as any;
    if (expectSelCol) {
      if (!selCell) problems.push(`row ${index}: select-column td missing`);
      if (!cb) {
        problems.push(`row ${index}: row-select checkbox missing`);
      } else {
        if (!!cb.checked !== isSelected) {
          problems.push(`row ${index}: checkbox checked=${!!cb.checked}, selected=${isSelected}`);
        }
        if (cb.getAttribute('data-row-index') !== String(index)) {
          problems.push(`row ${index}: checkbox data-row-index="${cb.getAttribute('data-row-index')}"`);
        }
      }
    } else {
      if (selCell) problems.push(`row ${index}: unexpected select-column td`);
      if (cb) problems.push(`row ${index}: unexpected row-select checkbox`);
    }
  }

  expect(problems, label).toEqual([]);
}

// ── presentational attributes (striped / hoverable / clickable) ───────────
//
// These three are pure CSS hooks: the component ships one `:host([attr]) …`
// rule per attribute and nothing else observable changes. happy-dom does not
// cascade shadow styles, so `getComputedStyle` on a row returns nothing —
// instead each hook is observed as the three facts that make it paint:
//   1. the component still ships the rule (regression: renamed/dropped rule),
//   2. the rule still declares the property it exists to set,
//   3. the host matches the rule's `:host(...)` guard, i.e. the attribute
//      reached the host, and a rendered row matches the structural half.
// The EXPECTED state comes from the variant's declared flags, never from the
// element under test, so none of this collapses into `hasAttribute` tautology.

/** Split rule text out of the table's shadow stylesheet. */
export function shadowRule(table: any, selector: string): { declarations: string } | null {
  for (const style of table.shadowRoot.querySelectorAll('style')) {
    const css = style.textContent ?? '';
    const at = css.indexOf(`${selector} {`);
    if (at === -1) continue;
    const open = css.indexOf('{', at);
    const close = css.indexOf('}', open);
    if (close === -1) continue;
    return { declarations: css.slice(open + 1, close).trim() };
  }
  return null;
}

export interface StyleHook {
  /** the rule as written in the component's stylesheet */
  selector: string;
  /** the `:host(...)` guard the host element has to match */
  hostGuard: string;
  /** the structural half, minus any state pseudo-class happy-dom cannot hold */
  rowSelector: string;
  /** the declaration this rule exists to make */
  declares: string;
}

export const PRESENTATION_HOOKS: Record<keyof PresentationFlags, StyleHook> = {
  striped: {
    selector: ':host([striped]) tbody tr:nth-child(even)',
    hostGuard: '[striped]',
    rowSelector: 'tbody tr:nth-child(even)',
    declares: 'background-color',
  },
  hoverable: {
    selector: ':host([hoverable]) tbody tr:hover',
    hostGuard: '[hoverable]',
    rowSelector: 'tbody tr',
    declares: 'background-color',
  },
  clickable: {
    selector: ':host([clickable]) tbody tr',
    hostGuard: '[clickable]',
    rowSelector: 'tbody tr',
    declares: 'cursor',
  },
};

/**
 * Assert each presentational attribute's CSS hook is live exactly when the
 * variant declared it — rule shipped, declaration intact, host guard matching,
 * and at least one rendered row on the receiving end.
 */
export function expectPresentationHooks(table: any, flags: PresentationFlags, label = '') {
  const problems: string[] = [];
  for (const name of Object.keys(PRESENTATION_HOOKS) as Array<keyof PresentationFlags>) {
    const hook = PRESENTATION_HOOKS[name];
    const rule = shadowRule(table, hook.selector);
    if (!rule) { problems.push(`${name}: rule "${hook.selector}" is not in the shadow stylesheet`); continue; }
    if (!rule.declarations.includes(hook.declares)) {
      problems.push(`${name}: rule no longer declares ${hook.declares} (has "${rule.declarations}")`);
    }
    const guarded = table.matches(hook.hostGuard);
    if (guarded !== flags[name]) {
      problems.push(`${name}: host matches ${hook.hostGuard} = ${guarded}, declared ${flags[name]}`);
    }
    if (flags[name] && dataRows(table).length > 0) {
      const targets = [...table.shadowRoot.querySelectorAll(hook.rowSelector)]
        .filter(el => (el as HTMLElement).hasAttribute('data-index'));
      if (targets.length === 0) problems.push(`${name}: no rendered row matches "${hook.rowSelector}"`);
    }
  }
  expect(problems, label).toEqual([]);
}

/** Every visible data cell holds text (the blank-row symptom this matrix hunts). */
export function expectNoBlankCells(table: any, columns: MatrixColumn[], label = '') {
  const blanks: string[] = [];
  for (const tr of dataRows(table)) {
    for (const col of columns) {
      const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
      if (!td) { blanks.push(`row ${tr.getAttribute('data-index')}: no td[${col.key}]`); continue; }
      const text = renderedCellText(table, Number(tr.getAttribute('data-index')), col.key);
      if (text === '') blanks.push(`row ${tr.getAttribute('data-index')} col ${col.key} blank`);
    }
  }
  expect(blanks, label).toEqual([]);
}
