/**
 * Filtering engine for snice-table.
 * Handles: per-column filters, quick filter, header filters.
 * Supports client-side and server-side modes.
 */

import { parseCellDate } from './table-date';

export type FilterOperator =
  // Text
  | 'contains' | 'notContains' | 'equals' | 'notEquals'
  | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty'
  // Number
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  // Date
  | 'is' | 'isNot' | 'before' | 'onOrBefore' | 'after' | 'onOrAfter'
  // Boolean
  | 'isTrue' | 'isFalse';

export type FilterLogic = 'and' | 'or';

export interface ColumnFilter {
  column: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterModel {
  filters: ColumnFilter[];
  logic: FilterLogic;
  quickFilter?: string;
  quickFilterLogic?: FilterLogic;
}

export interface FilterOperatorDef {
  value: FilterOperator;
  label: string;
  requiresValue: boolean;
}

const TEXT_OPERATORS: FilterOperatorDef[] = [
  { value: 'contains', label: 'contains', requiresValue: true },
  { value: 'notContains', label: 'does not contain', requiresValue: true },
  { value: 'equals', label: 'equals', requiresValue: true },
  { value: 'notEquals', label: 'does not equal', requiresValue: true },
  { value: 'startsWith', label: 'starts with', requiresValue: true },
  { value: 'endsWith', label: 'ends with', requiresValue: true },
  { value: 'isEmpty', label: 'is empty', requiresValue: false },
  { value: 'isNotEmpty', label: 'is not empty', requiresValue: false },
];

const NUMBER_OPERATORS: FilterOperatorDef[] = [
  { value: 'eq', label: '=', requiresValue: true },
  { value: 'neq', label: '≠', requiresValue: true },
  { value: 'gt', label: '>', requiresValue: true },
  { value: 'gte', label: '≥', requiresValue: true },
  { value: 'lt', label: '<', requiresValue: true },
  { value: 'lte', label: '≤', requiresValue: true },
  { value: 'isEmpty', label: 'is empty', requiresValue: false },
  { value: 'isNotEmpty', label: 'is not empty', requiresValue: false },
];

const DATE_OPERATORS: FilterOperatorDef[] = [
  { value: 'is', label: 'is', requiresValue: true },
  { value: 'isNot', label: 'is not', requiresValue: true },
  { value: 'before', label: 'before', requiresValue: true },
  { value: 'onOrBefore', label: 'on or before', requiresValue: true },
  { value: 'after', label: 'after', requiresValue: true },
  { value: 'onOrAfter', label: 'on or after', requiresValue: true },
  { value: 'isEmpty', label: 'is empty', requiresValue: false },
  { value: 'isNotEmpty', label: 'is not empty', requiresValue: false },
];

const BOOLEAN_OPERATORS: FilterOperatorDef[] = [
  { value: 'isTrue', label: 'is true', requiresValue: false },
  { value: 'isFalse', label: 'is false', requiresValue: false },
];

export class TableFilterEngine {
  private model: FilterModel = { filters: [], logic: 'and' };
  private headerFilters: Map<string, string> = new Map(); // column key → quick value

  /** Get operators available for a column type */
  getOperatorsForType(type: string): FilterOperatorDef[] {
    switch (type) {
      case 'number':
      case 'currency':
      case 'rating':
      case 'progress':
      case 'filesize':
      case 'duration':
      case 'percent':
      case 'percentage':
        return NUMBER_OPERATORS;
      case 'date':
        return DATE_OPERATORS;
      case 'boolean':
        return BOOLEAN_OPERATORS;
      default:
        return TEXT_OPERATORS;
    }
  }

  /** Set the full filter model */
  setFilterModel(model: FilterModel) {
    this.model = model;
  }

  /** Get the current filter model */
  getFilterModel(): FilterModel {
    return { ...this.model };
  }

  /** Add or update a column filter */
  setColumnFilter(column: string, operator: FilterOperator, value: any) {
    const existing = this.model.filters.findIndex(f => f.column === column);
    if (existing >= 0) {
      this.model.filters[existing] = { column, operator, value };
    } else {
      this.model.filters.push({ column, operator, value });
    }
  }

  /** Remove a column filter */
  removeColumnFilter(column: string) {
    this.model.filters = this.model.filters.filter(f => f.column !== column);
  }

  /** Clear all filters */
  clearAllFilters() {
    this.model.filters = [];
    this.model.quickFilter = undefined;
    this.model.logic = 'and';
    this.headerFilters.clear();
  }

  /** Set quick filter text (searches across all columns) */
  setQuickFilter(text: string) {
    this.model.quickFilter = text || undefined;
  }

  /** Set header filter for a column (inline quick text input) */
  setHeaderFilter(column: string, value: string) {
    if (value) {
      this.headerFilters.set(column, value);
    } else {
      this.headerFilters.delete(column);
    }
  }

  /** Get header filter value for a column */
  getHeaderFilter(column: string): string {
    return this.headerFilters.get(column) || '';
  }

  /** Set filter logic (and/or) */
  setFilterLogic(logic: FilterLogic) {
    this.model.logic = logic;
  }

  /** Check if any filters are active */
  hasActiveFilters(): boolean {
    return this.model.filters.length > 0 || !!this.model.quickFilter || this.headerFilters.size > 0;
  }

  /** Check if a specific column has an active filter */
  hasColumnFilter(column: string): boolean {
    return this.model.filters.some(f => f.column === column) || this.headerFilters.has(column);
  }

  /** Get active filter count */
  getActiveFilterCount(): number {
    return this.model.filters.length + this.headerFilters.size + (this.model.quickFilter ? 1 : 0);
  }

  /**
   * Apply filters to a dataset (client-side mode).
   * Returns filtered array (original is not modified).
   */
  applyFilters(data: any[], columns: { key: string; type?: string }[]): any[] {
    let result = data;

    // Apply column filters
    if (this.model.filters.length > 0) {
      result = result.filter(row => {
        const results = this.model.filters.map(f => this.evaluateFilter(f, row));
        return this.model.logic === 'and'
          ? results.every(Boolean)
          : results.some(Boolean);
      });
    }

    // Apply header filters (always AND)
    for (const [column, value] of this.headerFilters) {
      const lower = value.toLowerCase();
      result = result.filter(row => {
        const cellValue = row[column];
        return cellValue != null && String(cellValue).toLowerCase().includes(lower);
      });
    }

    // Apply quick filter
    if (this.model.quickFilter) {
      const terms = this.model.quickFilter.toLowerCase().split(/\s+/).filter(Boolean);
      const searchCols = columns.map(c => c.key);
      const logic = this.model.quickFilterLogic || 'and';

      result = result.filter(row => {
        const matchesTerm = (term: string) =>
          searchCols.some(key => {
            const val = row[key];
            return val != null && String(val).toLowerCase().includes(term);
          });

        return logic === 'and'
          ? terms.every(matchesTerm)
          : terms.some(matchesTerm);
      });
    }

    return result;
  }

  /** Evaluate a single filter against a row */
  private evaluateFilter(filter: ColumnFilter, row: any): boolean {
    const cellValue = row[filter.column];
    const filterValue = filter.value;

    switch (filter.operator) {
      // Text
      case 'contains':
        return cellValue != null && String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'notContains':
        return cellValue == null || !String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'equals':
        return String(cellValue ?? '').toLowerCase() === String(filterValue).toLowerCase();
      case 'notEquals':
        return String(cellValue ?? '').toLowerCase() !== String(filterValue).toLowerCase();
      case 'startsWith':
        return cellValue != null && String(cellValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
      case 'endsWith':
        return cellValue != null && String(cellValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
      case 'isEmpty':
        return cellValue == null || cellValue === '';
      case 'isNotEmpty':
        return cellValue != null && cellValue !== '';

      // Number
      case 'eq':
        return Number(cellValue) === Number(filterValue);
      case 'neq':
        return Number(cellValue) !== Number(filterValue);
      case 'gt':
        return Number(cellValue) > Number(filterValue);
      case 'gte':
        return Number(cellValue) >= Number(filterValue);
      case 'lt':
        return Number(cellValue) < Number(filterValue);
      case 'lte':
        return Number(cellValue) <= Number(filterValue);

      // Date. Both sides cross the cell layer's parser, so a `2026-03-15`
      // bound means that calendar day locally — the same day the cell paints
      // — instead of UTC midnight, which shifted every comparison by a day
      // for negative UTC offsets and split a date-only bound from a
      // timestamped cell value on the same day.
      case 'is':
      case 'isNot': {
        const cellDay = this.calendarDay(cellValue);
        const filterDay = this.calendarDay(filterValue);
        // An unparseable value is on no day: it never "is" the filtered day,
        // and it is therefore always "isNot" it.
        const sameDay = cellDay !== null && filterDay !== null && cellDay === filterDay;
        return filter.operator === 'is' ? sameDay : !sameDay;
      }
      case 'before':
      case 'onOrBefore':
      case 'after':
      case 'onOrAfter': {
        const cell = parseCellDate(cellValue);
        const bound = parseCellDate(filterValue);
        if (!cell || !bound) return false;
        const a = cell.getTime();
        // A date-only bound names a whole DAY, not the instant it starts at, so
        // the day's two edges bracket it. Comparing everything against its
        // opening instant made the four operators disagree with `is`: a cell at
        // 09:00 on the bound day "is" that day, yet counted as `after` it and
        // fell outside `onOrBefore` it. A bound that carries its own time is an
        // instant, and both edges collapse onto it.
        const dayStart = bound.getTime();
        const dayEnd = this.boundEnd(filterValue, bound);
        if (filter.operator === 'before') return a < dayStart;
        if (filter.operator === 'onOrBefore') return a <= dayEnd;
        if (filter.operator === 'after') return a > dayEnd;
        return a >= dayStart;
      }

      // Boolean
      case 'isTrue':
        return cellValue === true || cellValue === 'true' || cellValue === 1;
      case 'isFalse':
        return cellValue === false || cellValue === 'false' || cellValue === 0 || cellValue == null;

      default:
        return true;
    }
  }

  /**
   * The local calendar day a value falls on, as a `YYYY-M-D` stamp, or `null`
   * when the value names no day at all.
   */
  private calendarDay(value: any): string | null {
    const date = parseCellDate(value);
    if (!date) return null;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  /** True when the raw bound named a calendar day rather than an instant. */
  private isDateOnlyBound(raw: any): boolean {
    return typeof raw === 'string' && /^\d{4}(?:-\d{2}){0,2}$/.test(raw.trim());
  }

  /** Last instant covered by a bound — the day's end when it named a day. */
  private boundEnd(raw: any, parsed: Date): number {
    if (!this.isDateOnlyBound(raw)) return parsed.getTime();
    const end = new Date(parsed);
    end.setDate(end.getDate() + 1);
    return end.getTime() - 1;
  }

  /** Serialize filter model for server-side requests */
  toServerParams(): any {
    return {
      filters: this.model.filters,
      filterLogic: this.model.logic,
      quickFilter: this.model.quickFilter,
      headerFilters: Object.fromEntries(this.headerFilters),
    };
  }
}
