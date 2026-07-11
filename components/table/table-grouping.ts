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

export type AggregatorType = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type AggregatorFn = (values: any[], rows: any[]) => any;
export type Aggregator = AggregatorType | AggregatorFn;

export interface GroupingOptions {
  /** Column key(s) to group rows by. Empty = no grouping (aggregation may still apply). */
  groupBy: string[];
  /** Initial expansion of groups. Default true (all expanded). */
  defaultExpanded?: boolean;
}

/** Minimal column shape this module reads — avoids importing the full
 *  ColumnDefinition (which lives in snice-table.types and imports back). */
export interface AggregatableColumn {
  key: string;
  aggregate?: Aggregator;
}

export interface GroupRow {
  type: 'group';
  /** Stable synthetic key, e.g. `group:dept=Eng` or `group:dept=Eng¦level=Sr`. */
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
  /** Per-column aggregate over this group's rows. */
  aggregates: Record<string, any>;
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

  const nums = values.map(Number).filter((v) => !Number.isNaN(v));
  switch (agg) {
    case 'sum':
      return nums.reduce((a, b) => a + b, 0);
    case 'avg':
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    case 'min':
      return nums.length ? Math.min(...nums) : null;
    case 'max':
      return nums.length ? Math.max(...nums) : null;
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

  configure(options: GroupingOptions) {
    this.groupByKeys = (options.groupBy ?? []).filter(Boolean);
    this.defaultExpanded = options.defaultExpanded !== false;
  }

  /** Record which columns aggregate (read from the current column set). */
  setColumns(columns: AggregatableColumn[]) {
    this.aggregators = columns.filter((c) => c.aggregate != null);
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
      const values = rows.map((r) => r[col.key]);
      out[col.key] = computeAggregate(col.aggregate!, values, rows);
    }
    return out;
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
    const values = Array.from(buckets.keys()).sort((a, b) =>
      String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true })
    );

    const isLeafLevel = depth === this.groupByKeys.length - 1;

    for (const value of values) {
      const groupRows = buckets.get(value)!;
      const path = parentPath ? `${parentPath}¦${groupKey}=${value}` : `${groupKey}=${value}`;
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
        aggregates: this.computeAggregates(groupRows),
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
   * (indent by depth, rotating chevron). Clicking toggles and dispatches
   * `group-toggle` (composed, crosses the shadow boundary).
   */
  createToggle(group: GroupRow): HTMLElement {
    const container = document.createElement('span');
    container.className = 'tree-indent';
    container.style.paddingLeft = `${group.depth * 1.5}rem`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tree-toggle${group.expanded ? ' tree-toggle--expanded' : ''}`;
    btn.innerHTML = `<svg class="tree-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
    btn.setAttribute('aria-expanded', String(group.expanded));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(group.key);
      btn.dispatchEvent(new CustomEvent('group-toggle', {
        detail: { key: group.key, value: group.value, expanded: this.isExpanded(group.key) },
        bubbles: true,
        composed: true,
      }));
    });
    container.appendChild(btn);

    return container;
  }
}
