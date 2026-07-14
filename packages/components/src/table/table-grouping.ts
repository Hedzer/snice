/**
 * Row-grouping + aggregation engine for snice-table.
 *
 * Mirrors table-tree-data.ts: a pure model that flattens a dataset into an
 * ordered display list the render path consumes. Where TableTreeData produces
 * one flat item per (visible) node, TableGrouping produces a heterogeneous list
 * of three shapes:
 *
 *   { type: 'group'     } — a group-header row (chevron + value + leaf count)
 *   { type: 'row'       } — an original data row (a leaf under its group)
 *   { type: 'aggregate' } — a footer: per-group when grouped, plus a table-level
 *                            grand total whenever any column declares `aggregate`
 *
 * Grouping and aggregation are independent switches:
 *   - `groupBy` non-empty  → grouped view (nested for multiple keys).
 *   - any column w/ `aggregate` → footers (table-level even with no grouping).
 * `isEnabled()` is true when EITHER is active, so the table routes the body
 * through this model in both cases.
 */

import type { Aggregator } from './snice-table.types';

export type { Aggregator, AggregatorFn, AggregatorType } from './snice-table.types';

export interface GroupingOptions {
  /** Column key(s) to group rows by. Empty = no grouping (aggregation may still apply). */
  groupBy: string[];
  /** Initial expansion of groups. Default true (all expanded). */
  defaultExpanded?: boolean;
}

/** Minimal column shape this pure model reads from the public table types. */
export interface AggregatableColumn {
  key: string;
  aggregate?: Aggregator;
  valueGetter?: (value: any, row: any) => any;
}

export interface GroupRow {
  type: 'group';
  /** Stable, typed synthetic identity. Treat as opaque outside the table. */
  key: string;
  /** Nesting depth (0 = top-level group). */
  depth: number;
  /** The column key grouped on at this level. */
  groupKey: string;
  /** The group's value. */
  value: any;
  /** Number of leaf rows beneath this group (recursive). */
  count: number;
  /** Whether this group is currently expanded. */
  expanded: boolean;
  /** Always true — a group has children. Parallels TreeRow.hasChildren. */
  hasChildren: boolean;
  /** The leaf rows under this group (used for selection + aggregation). */
  rows: any[];
}

export interface DataRow {
  type: 'row';
  /** The original row object — its own recycler key. */
  key: any;
  /** Depth of the containing group + 1 (0 when ungrouped). */
  depth: number;
  data: any;
}

export interface AggregateRow {
  type: 'aggregate';
  /** Stable synthetic key, e.g. `agg:group:dept=Eng` or `agg:table`. */
  key: string;
  depth: number;
  scope: 'group' | 'table';
  aggregates: Record<string, any>;
  rows: any[];
  /** Present for group subtotals so renderers can identify the group. */
  groupKey?: string;
  groupValue?: any;
  groupColumn?: string;
}

export type DisplayItem = GroupRow | DataRow | AggregateRow;

/**
 * Reduce a column's values to a single aggregate. Numeric aggregators coerce
 * with `Number` and skip non-numeric entries; `count` counts rows (matching
 * the "row count" semantics of MUI's built-in count). Empty input: sum/avg → 0,
 * min/max → null.
 */
export function computeAggregate(agg: Aggregator, values: any[], rows: any[]): any {
  if (typeof agg === 'function') return agg(values, rows);

  if (agg === 'count') return rows.length;

  // Treat absent/blank values as missing rather than numeric zero. Numeric
  // strings remain useful for data loaded from HTML/JSON APIs; everything else
  // must coerce to a finite number. A loop avoids the large-array argument
  // limit of Math.min(...values) / Math.max(...values).
  const nums: number[] = [];
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'boolean') continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    try {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) nums.push(numeric);
    } catch {
      // Symbols and user-defined coercions may throw; they are non-numeric for
      // the built-in reducers and must not abort the whole table render.
    }
  }

  switch (agg) {
    case 'sum':
      return nums.reduce((a, b) => a + b, 0);
    case 'avg':
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    case 'min':
      return nums.length ? nums.reduce((min, value) => value < min ? value : min, nums[0]) : null;
    case 'max':
      return nums.length ? nums.reduce((max, value) => value > max ? value : max, nums[0]) : null;
    default:
      return null;
  }
}

export class TableGrouping {
  private groupByKeys: string[] = [];
  private defaultExpanded = true;
  /** Columns that declare an aggregator, in column order. */
  private aggregators: AggregatableColumn[] = [];

  // Expansion is stored as explicit overrides against the default so new groups
  // (appearing after a filter/sort) follow `defaultExpanded` automatically.
  private collapsedOverrides = new Set<string>();
  private expandedOverrides = new Set<string>();

  private flatItems: DisplayItem[] = [];

  // Map grouping values according to the same identity semantics used by the
  // bucket Map. Primitive encodings include their type; object/function and
  // symbol values receive stable per-instance ids. This prevents expansion and
  // recycler collisions for values such as 1 vs "1", two object references,
  // or strings containing path separators.
  private objectValueIds = new WeakMap<object, number>();
  private symbolValueIds = new Map<symbol, number>();
  private nextValueId = 1;

  configure(options: GroupingOptions) {
    this.groupByKeys = (options.groupBy ?? []).filter(Boolean);
    this.defaultExpanded = options.defaultExpanded !== false;
  }

  /**
   * Record which columns aggregate (read from the current column set).
   * Snapshot the fields we consume rather than retaining column objects: app
   * code may mutate `columns[i].aggregate`/`valueGetter` in place and call the
   * public renderBody(), and a retained reference cannot detect that change.
   * Returns whether the aggregation configuration changed so the table can
   * invalidate its flattened cache without recomputing it on every render.
   */
  setColumns(columns: AggregatableColumn[]): boolean {
    const next = columns
      .filter((column) => column.aggregate != null)
      .map((column) => ({
        key: column.key,
        aggregate: column.aggregate,
        valueGetter: column.valueGetter,
      }));
    const changed = next.length !== this.aggregators.length || next.some((column, index) => {
      const previous = this.aggregators[index];
      return previous?.key !== column.key
        || previous.aggregate !== column.aggregate
        || previous.valueGetter !== column.valueGetter;
    });
    this.aggregators = next;
    return changed;
  }

  hasGrouping(): boolean {
    return this.groupByKeys.length > 0;
  }

  hasAggregation(): boolean {
    return this.aggregators.length > 0;
  }

  isEnabled(): boolean {
    return this.hasGrouping() || this.hasAggregation();
  }

  getGroupByKeys(): string[] {
    return this.groupByKeys;
  }

  /** Per-column aggregates over `rows`, keyed by column key. */
  computeAggregates(rows: any[]): Record<string, any> {
    const out: Record<string, any> = {};
    for (const col of this.aggregators) {
      const values = rows.map((row) => {
        const value = row?.[col.key];
        return col.valueGetter ? col.valueGetter(value, row) : value;
      });
      out[col.key] = computeAggregate(col.aggregate!, values, rows);
    }
    return out;
  }

  /** Stable, collision-free representation of a Map grouping value. */
  private valueKey(value: any): string {
    if (value === null) return 'null';

    switch (typeof value) {
      case 'undefined':
        return 'undefined';
      case 'string':
        return `string:${encodeURIComponent(value)}`;
      case 'number':
        if (Number.isNaN(value)) return 'number:NaN';
        return `number:${Object.is(value, -0) ? '0' : String(value)}`;
      case 'boolean':
        return `boolean:${value ? '1' : '0'}`;
      case 'bigint':
        return `bigint:${String(value)}`;
      case 'symbol': {
        let id = this.symbolValueIds.get(value);
        if (id === undefined) {
          id = this.nextValueId++;
          this.symbolValueIds.set(value, id);
        }
        return `symbol:${id}`;
      }
      case 'object':
      case 'function': {
        const objectValue = value as object;
        let id = this.objectValueIds.get(objectValue);
        if (id === undefined) {
          id = this.nextValueId++;
          this.objectValueIds.set(objectValue, id);
        }
        return `object:${id}`;
      }
      default:
        return `${typeof value}:${encodeURIComponent(String(value))}`;
    }
  }

  /**
   * Flatten `data` into the ordered display list. Rows are grouped in-place
   * (their incoming order is preserved within a group, so a pre-sort survives),
   * groups are ordered by group value, and a per-group aggregate footer plus a
   * table-level grand-total footer are appended when any column aggregates.
   */
  processData(data: any[]): DisplayItem[] {
    if (!this.isEnabled() || data.length === 0) {
      this.flatItems = [];
      return this.flatItems;
    }

    const items: DisplayItem[] = [];

    if (this.hasGrouping()) {
      this.buildGroups(data, 0, '', items);
    } else {
      for (const row of data) items.push({ type: 'row', key: row, depth: 0, data: row });
    }

    // Table-level grand total whenever any column aggregates.
    if (this.hasAggregation()) {
      items.push({
        type: 'aggregate',
        key: 'agg:table',
        depth: 0,
        scope: 'table',
        aggregates: this.computeAggregates(data),
        rows: data,
      });
    }

    this.flatItems = items;
    return items;
  }

  /** Recursively bucket `rows` by the grouping key at `depth`, emitting into `out`. */
  private buildGroups(rows: any[], depth: number, parentPath: string, out: DisplayItem[]) {
    const groupKey = this.groupByKeys[depth];

    // Bucket preserving row order; a Map keeps first-seen order for stability.
    const buckets = new Map<any, any[]>();
    for (const row of rows) {
      const v = row[groupKey];
      const bucket = buckets.get(v);
      if (bucket) bucket.push(row);
      else buckets.set(v, [row]);
    }

    // Groups ordered by group value (numeric-aware, like the local sorter).
    const values = Array.from(buckets.keys()).sort((a, b) => {
      const displayOrder = String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
      return displayOrder || this.valueKey(a).localeCompare(this.valueKey(b));
    });

    const isLeafLevel = depth === this.groupByKeys.length - 1;

    for (const value of values) {
      const groupRows = buckets.get(value)!;
      const segment = `${encodeURIComponent(groupKey)}=${this.valueKey(value)}`;
      const path = parentPath ? `${parentPath}|${segment}` : segment;
      const key = `group:${path}`;
      const expanded = this.isExpanded(key);

      out.push({
        type: 'group',
        key,
        depth,
        groupKey,
        value,
        count: groupRows.length,
        expanded,
        hasChildren: true,
        rows: groupRows,
      });

      if (!expanded) continue;

      if (isLeafLevel) {
        for (const row of groupRows) {
          out.push({ type: 'row', key: row, depth: depth + 1, data: row });
        }
      } else {
        this.buildGroups(groupRows, depth + 1, path, out);
      }

      // Per-group aggregate footer (only when a column aggregates).
      if (this.hasAggregation()) {
        out.push({
          type: 'aggregate',
          key: `agg:${key}`,
          depth: depth + 1,
          scope: 'group',
          aggregates: this.computeAggregates(groupRows),
          rows: groupRows,
          groupKey: key,
          groupValue: value,
          groupColumn: groupKey,
        });
      }
    }
  }

  getFlatItems(): DisplayItem[] {
    return this.flatItems;
  }

  // ── Expansion state ──────────────────────────────────────────────────────
  isExpanded(key: string): boolean {
    return this.defaultExpanded
      ? !this.collapsedOverrides.has(key)
      : this.expandedOverrides.has(key);
  }

  toggle(key: string) {
    if (this.isExpanded(key)) this.collapse(key);
    else this.expand(key);
  }

  expand(key: string) {
    this.collapsedOverrides.delete(key);
    if (!this.defaultExpanded) this.expandedOverrides.add(key);
  }

  collapse(key: string) {
    this.expandedOverrides.delete(key);
    if (this.defaultExpanded) this.collapsedOverrides.add(key);
  }

  /** Expand every group (clears collapse overrides / marks all seen keys). */
  expandAll() {
    this.collapsedOverrides.clear();
    if (!this.defaultExpanded) {
      for (const item of this.flatItems) {
        if (item.type === 'group') this.expandedOverrides.add(item.key);
      }
    }
  }

  /** Collapse every group. */
  collapseAll() {
    this.expandedOverrides.clear();
    if (this.defaultExpanded) {
      for (const item of this.flatItems) {
        if (item.type === 'group') this.collapsedOverrides.add(item.key);
      }
    }
  }

  /**
   * Build the expand/collapse chevron for a group header — reuses the
   * tree-toggle DOM/classes so the affordance matches tree data + master-detail
   * (indent by depth, rotating chevron). Interaction stays with SniceTable's
   * template-bound delegated click handler so every toggle is dispatched from
   * the component host through @dispatch (and works with browser retargeting).
   */
  createToggle(group: GroupRow): HTMLElement {
    const container = document.createElement('span');
    container.className = 'tree-indent';
    container.style.paddingLeft = `${group.depth * 1.5}rem`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tree-toggle${group.expanded ? ' tree-toggle--expanded' : ''}`;
    btn.setAttribute('data-group-key', group.key);
    btn.innerHTML = `<svg class="tree-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
    btn.setAttribute('aria-expanded', String(group.expanded));
    const valueLabel = group.value == null || group.value === '' ? 'blank' : String(group.value);
    btn.setAttribute('aria-label', `${group.expanded ? 'Collapse' : 'Expand'} ${valueLabel} group, ${group.count} rows`);
    container.appendChild(btn);

    return container;
  }
}
