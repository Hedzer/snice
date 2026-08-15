// Grouping-slice helpers layered on top of matrix-utils. The text a user
// actually reads inside a typed cell element is its rendered shadow content
// (that is where the documented display pipeline lands, per
// docs/components/table.md: `formatter` is "the row-aware display override for
// every built-in cell", `valueFormatter` the fallback). `displayText` reads that
// content, so grouped structural rows (group headers, aggregate footers) and
// data rows can be asserted with ONE oracle: the documented column pipeline.
import { expect } from 'vitest';
import { cellText, expectedCellText, type MatrixColumn } from './matrix-utils';

/**
 * What the user reads in a cell.
 *
 * A typed cell element renders its text into shadow `[part~="content"]`. If that
 * content is missing the user sees NOTHING, so this reports the empty string
 * rather than falling back to the element's `value` attribute — an attribute
 * fallback would report a visually blank cell as correct and mask exactly the
 * blank-cell defect class this matrix exists to find. Plain `<td>`s (aggregate
 * label cells, group headers) carry no cell element and are read as text.
 */
export function displayText(td: HTMLElement): string {
  const cell = td.querySelector('[value]') as any;
  if (cell) {
    const content = cell.shadowRoot?.querySelector('[part~="content"]');
    return content ? (content.textContent ?? '').trim() : '';
  }
  return cellText(td);
}

/**
 * Documented display text of an aggregate cell: the reduced value pushed
 * through the column's display pipeline (`formatter` first, `valueFormatter` as
 * the fallback). valueGetter already ran per row BEFORE the reduction, so it
 * must not run again here.
 */
export function expectedAggregateText(column: MatrixColumn, value: any): string {
  if (column.formatter) return String(column.formatter(value, undefined as any));
  if (column.valueFormatter) return String(column.valueFormatter(value, null));
  return value == null ? '' : String(value);
}

export type Expected =
  | { kind: 'group'; label: string; count: number; expanded: boolean; depth: number }
  | { kind: 'row'; row: any }
  | { kind: 'agg'; scope: 'group' | 'table'; values: Record<string, any> };

export function group(
  label: string,
  count: number,
  opts: { expanded?: boolean; depth?: number } = {},
): Expected {
  return { kind: 'group', label, count, expanded: opts.expanded ?? true, depth: opts.depth ?? 0 };
}

export function row(r: any): Expected {
  return { kind: 'row', row: r };
}

export function agg(scope: 'group' | 'table', values: Record<string, any>): Expected {
  return { kind: 'agg', scope, values };
}

/**
 * The grouping oracle: the tbody's row sequence must equal `expected` exactly —
 * group headers (label, leaf count, aria-expanded, depth), data rows (every
 * visible cell equals the documented pipeline output for the row it claims to
 * show), and aggregate footers (raw reduced value + its display text). Reports
 * every mismatch at once.
 */
export function expectGroupedView(table: any, expected: Expected[], columns?: MatrixColumn[]) {
  const cols = (columns ?? table.columns) as MatrixColumn[];
  const trs = [...table.shadowRoot.querySelectorAll('tbody tr')] as HTMLElement[];
  const problems: string[] = [];

  if (trs.length !== expected.length) {
    problems.push(`tbody row count ${trs.length}, expected ${expected.length} `
      + `(actual: ${trs.map(describeRow).join(' / ')})`);
  }

  expected.forEach((exp, i) => {
    const tr = trs[i];
    if (!tr) { problems.push(`item ${i}: missing <tr> (expected ${exp.kind})`); return; }

    if (exp.kind === 'group') {
      if (!tr.classList.contains('group-header-row')) {
        problems.push(`item ${i}: expected group header, got ${describeRow(tr)}`);
        return;
      }
      const label = tr.querySelector('.group-header-label')?.textContent ?? '';
      const count = tr.querySelector('.group-header-count')?.textContent ?? '';
      const expandedAttr = tr.querySelector('button')?.getAttribute('aria-expanded');
      const depth = tr.getAttribute('data-depth');
      if (label !== exp.label) problems.push(`item ${i}: group label "${label}" != "${exp.label}"`);
      if (count !== String(exp.count)) problems.push(`item ${i}: group count "${count}" != "${exp.count}"`);
      if (expandedAttr !== String(exp.expanded)) {
        problems.push(`item ${i}: group ${exp.label} aria-expanded "${expandedAttr}" != "${exp.expanded}"`);
      }
      if (depth !== String(exp.depth)) {
        problems.push(`item ${i}: group ${exp.label} depth "${depth}" != "${exp.depth}"`);
      }
      return;
    }

    if (exp.kind === 'row') {
      if (!tr.hasAttribute('data-index') || tr.classList.contains('group-aggregate-row')) {
        problems.push(`item ${i}: expected data row, got ${describeRow(tr)}`);
        return;
      }
      for (const col of cols) {
        const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
        if (!td) { problems.push(`item ${i}: missing td[${col.key}]`); continue; }
        const actual = displayText(td);
        const wanted = expectedCellText(col, exp.row);
        if (actual !== wanted) problems.push(`item ${i} col ${col.key}: "${actual}" != "${wanted}"`);
      }
      return;
    }

    if (!tr.classList.contains('group-aggregate-row')) {
      problems.push(`item ${i}: expected ${exp.scope} aggregate row, got ${describeRow(tr)}`);
      return;
    }
    if (tr.getAttribute('data-agg-scope') !== exp.scope) {
      problems.push(`item ${i}: aggregate scope "${tr.getAttribute('data-agg-scope')}" != "${exp.scope}"`);
    }
    for (const col of cols) {
      const td = tr.querySelector(`td[data-key="${col.key}"]`) as HTMLElement | null;
      if (!td) { problems.push(`item ${i}: missing aggregate td[${col.key}]`); continue; }
      if (!(col.key in exp.values)) {
        if (td.hasAttribute('data-agg-value')) {
          problems.push(`item ${i} col ${col.key}: unexpected aggregate `
            + `"${td.getAttribute('data-agg-value')}" on a non-aggregating column`);
        }
        continue;
      }
      const wantedRaw = exp.values[col.key];
      const actualRaw = td.getAttribute('data-agg-value');
      if (actualRaw !== String(wantedRaw)) {
        problems.push(`item ${i} agg ${col.key}: raw "${actualRaw}" != "${String(wantedRaw)}"`);
      }
      const actualText = displayText(td);
      const wantedText = expectedAggregateText(col, wantedRaw);
      if (actualText !== wantedText) {
        problems.push(`item ${i} agg ${col.key}: text "${actualText}" != "${wantedText}"`);
      }
    }
  });

  expect(problems).toEqual([]);
}

function describeRow(tr: HTMLElement): string {
  if (tr.classList.contains('group-header-row')) {
    return `group(${tr.querySelector('.group-header-label')?.textContent})`;
  }
  if (tr.classList.contains('group-aggregate-row')) {
    return `agg(${tr.getAttribute('data-agg-scope')})`;
  }
  if (tr.hasAttribute('data-index')) {
    return `row#${tr.getAttribute('data-index')}[${[...tr.querySelectorAll('td')]
      .map((td) => displayText(td as HTMLElement)).join(',')}]`;
  }
  return `other(${tr.className})`;
}

/** Click a group header row by its rendered label (re-queried, never cached). */
export function clickGroupHeader(table: any, label: string, viaChevron = false) {
  const headers = [...table.shadowRoot.querySelectorAll('tr.group-header-row')] as HTMLElement[];
  const header = headers.find(
    (tr) => (tr.querySelector('.group-header-label')?.textContent ?? '') === label,
  );
  if (!header) throw new Error(`no group header labelled "${label}"`);
  const target = viaChevron ? (header.querySelector('button') as HTMLElement) : header;
  target.click();
}
