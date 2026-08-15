import type { FilterModel, FilterOperator } from './table-filter-engine';
import type { DetailPanelOptions } from './table-master-detail';
import type { ToolbarOptions } from './table-toolbar';
import type { TreeDataOptions } from './table-tree-data';
import type { ColumnGroup } from './table-column-manager';
import type { CSVExportOptions, PrintOptions, ClipboardOptions } from './table-export';

export type ColumnAlign = 'left' | 'center' | 'right';
export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percent' |
  'percentage' | 'rating' | 'progress' | 'sparkline' | 'accounting' | 'scientific' |
  'fraction' | 'duration' | 'filesize' | 'tag' | 'status' | 'actions' | 'link' |
  'email' | 'phone' | 'color' | 'image' | 'location' | 'json' | 'custom';
export type SortDirection = 'asc' | 'desc' | null;
export type AggregatorType = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type AggregatorFn = (values: any[], rows: any[]) => any;
export type Aggregator = AggregatorType | AggregatorFn;

/** Full-width custom row renderer for `list` mode. */
export type ListViewRenderer = (row: any, index: number) => string | HTMLElement;

export interface NumberFormat {
  decimals?: number;
  thousandsSeparator?: boolean;
  prefix?: string;
  suffix?: string;
  negativeStyle?: 'parentheses' | 'red' | 'minus';
}

export interface DateFormat {
  format?: 'short' | 'medium' | 'long' | 'full' | 'custom';
  customFormat?: string;
  locale?: string;
}

export interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  fontStyle?: 'normal' | 'italic';
  fontSize?: string;
  textDecoration?: 'none' | 'underline' | 'line-through';
}

export interface ConditionalFormat {
  condition: (value: any, row?: any) => boolean;
  style?: CellStyle;
  className?: string;
}

export interface BooleanFormat {
  trueValue?: string;
  falseValue?: string;
  useSymbols?: boolean;
  trueSymbol?: string;
  falseSymbol?: string;
}

export interface RatingFormat {
  max?: number;
  symbol?: string;
  emptySymbol?: string;
  color?: string;
}

export interface ProgressFormat {
  max?: number;
  showPercentage?: boolean;
  color?: string;
  colorize?: boolean;
  backgroundColor?: string;
  height?: string;
}

export interface SparklineFormat {
  type?: 'line' | 'bar' | 'area';
  color?: string;
  width?: number;
  height?: number;
  showDots?: boolean;
  showBaseline?: boolean;
  strokeWidth?: number;
  minValue?: number;
  maxValue?: number;
}

export interface PercentageFormat {
  decimals?: number;
  showTrend?: boolean;
  trendValue?: number | null;
  colorize?: boolean;
}

export interface PhoneFormat {
  phone?: string;
  displayText?: string;
  showIcon?: boolean;
  format?: boolean;
  country?: string;
}

export interface StatusFormat {
  status?: string;
  label?: string;
  showDot?: boolean;
  variant?: 'online' | 'offline' | 'busy' | 'away' | 'custom';
}

export interface TagFormat {
  variant?: string;
}

export interface ActionButton {
  action: string;
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  title?: string;
  disabled?: boolean;
}

export interface ActionsFormat {
  actions: ActionButton[];
}

export interface LinkFormat {
  href?: string;
  target?: string;
  external?: boolean;
  icon?: string;
  text?: string;
}

export interface ColorFormat {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  displayFormat?: 'hex' | 'rgb' | 'hsl' | 'name';
  showSwatch?: boolean;
  showHex?: boolean;
  showRgb?: boolean;
  swatchSize?: 'small' | 'medium' | 'large';
}

export interface CurrencyFormat {
  currency?: string;
  locale?: string;
  display?: 'symbol' | 'code' | 'name';
  currencyDisplay?: 'symbol' | 'code' | 'name';
  decimals?: number;
  thousandsSeparator?: boolean;
  negativeStyle?: 'parentheses' | 'red' | 'minus';
}

export interface EmailFormat {
  email?: string;
  showIcon?: boolean;
  displayText?: string;
}

export interface ImageFormat {
  src?: string;
  fallback?: string;
  shape?: 'rounded' | 'square' | 'circle';
  variant?: 'rounded' | 'square' | 'circle';
  size?: 'small' | 'medium' | 'large';
  alt?: string;
  lazy?: boolean;
}

export interface JsonFormat {
  maxDepth?: number;
  expanded?: boolean;
  collapsed?: boolean;
  showToggle?: boolean;
}

export interface LocationFormat {
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  showMapLink?: boolean;
  mapProvider?: 'google' | 'openstreetmap' | 'apple';
  showIcon?: boolean;
  lat?: number;
  lng?: number;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;
  align?: ColumnAlign;
  width?: string;
  flex?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
  hideable?: boolean;
  pinnable?: boolean;
  pinned?: 'left' | 'right' | false;
  editable?: boolean;
  /** Override the inline editor kind (default: derived from `type`). */
  editorType?: 'text' | 'number' | 'date' | 'boolean' | 'select';
  /** Options for a `select` editor. */
  selectOptions?: { value: string; label: string }[];
  exportable?: boolean;
  formatter?: (value: any, row?: any) => string;
  valueGetter?: (value: any, row: any) => any;
  valueFormatter?: (value: any, row: any) => string;
  valueParser?: (value: string, row: any) => any;
  valueSetter?: (value: any, row: any) => any;
  sortComparator?: (a: any, b: any, direction: 'asc' | 'desc') => number;
  colSpan?: number | ((value: any, row: any) => number);

  /** F: aggregate this column into per-group + table-level footer rows. A
   *  built-in ('sum' | 'avg' | 'min' | 'max' | 'count') or a custom reducer
   *  `(values, rows) => any`. Formatted through this column's normal
   *  type/formatter pipeline. */
  aggregate?: Aggregator;

  // Custom renderers (E2). When present these bypass the type-based cell/editor.
  /** Build the display cell. A string result is set via textContent (never
   *  innerHTML — no HTML parsing). Bypasses the type-based cell element. */
  renderCell?: (value: any, row: any, column: ColumnDefinition) => HTMLElement | string;
  /** Build the inline editor. `commit(v)` writes the value and commits;
   *  `cancel()` aborts. Bypasses the built-in editor for this cell. */
  renderEditor?: (
    value: any,
    row: any,
    column: ColumnDefinition,
    commit: (value: any) => void,
    cancel: () => void
  ) => HTMLElement;

  // Excel-like formatting
  numberFormat?: NumberFormat;
  dateFormat?: DateFormat;
  booleanFormat?: BooleanFormat;
  ratingFormat?: RatingFormat;
  progressFormat?: ProgressFormat;
  sparklineFormat?: SparklineFormat;
  percentageFormat?: PercentageFormat;
  phoneFormat?: PhoneFormat;
  statusFormat?: StatusFormat;
  tagFormat?: TagFormat;
  actionsFormat?: ActionsFormat;
  linkFormat?: LinkFormat;
  colorFormat?: ColorFormat;
  currencyFormat?: CurrencyFormat;
  emailFormat?: EmailFormat;
  imageFormat?: ImageFormat;
  jsonFormat?: JsonFormat;
  locationFormat?: LocationFormat;
  style?: CellStyle;
  conditionalFormats?: ConditionalFormat[];
  
  // Display options
  wrap?: boolean;
  ellipsis?: boolean;
  tooltip?: boolean | ((value: any, row?: any) => string);
}

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export type PaginationMode = 'client' | 'server';

/**
 * Row-selection behavior. `multiple` (the default) is the historical
 * additive-toggle behavior; `single` collapses to exactly one row per click;
 * `none` disables selection entirely. Mirrors the `PaginationMode` string-union
 * convention used across this file (attribute-reflectable, ergonomic to assign).
 */
export type SelectionMode = 'none' | 'single' | 'multiple';

/**
 * How the columns relate to the width of the frame they are painted in.
 *
 * `scroll` (the default, and the historical behavior): a column never goes
 * below its `minWidth`. A frame too narrow for the minimums overflows into the
 * frame's own horizontal scroller, so every column keeps a readable width and
 * the reader scrolls to the ones that did not fit.
 *
 * `squish`: the frame's width is the hard constraint and `minWidth` is relaxed
 * to a bare legibility floor. Every visible column shares the frame, cell
 * content ellipsises, and the table NEVER scrolls horizontally — the rightmost
 * column edge sits on the frame's inner edge at any width. Resizing is still
 * allowed; the columns beside the dragged one give up (or take back) the
 * difference so the total stays inside the frame.
 */
export type ColumnFit = 'scroll' | 'squish';

/**
 * The real public surface of `SniceTable` (components/table/snice-table.ts),
 * enumerated directly from the class — every `@property`, every plain public
 * field, every method without a `private` modifier. Excludes framework
 * plumbing decorated with `@query`/`@watch`/`@ready`/`@dispose`/`@render`/
 * `@styles` (implementation detail, not consumer API — same convention as
 * every other `Snice*Element` interface in this codebase) and the private
 * `dispatch*`/helper methods.
 *
 * `SniceTable implements SniceTableElement` — if this interface drifts from
 * the class (a member is renamed/removed, or a phantom one is added back),
 * `tsc --project components/tsconfig.json --noEmit` fails.
 */
export interface SniceTableElement extends HTMLElement {
  // ── Display / behavior toggles ──
  striped: boolean;
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  selectable: boolean;
  hoverable: boolean;
  clickable: boolean;
  list: boolean;
  loading: boolean;

  // ── Data mode ──
  /** 'local' (default): table owns the dataset. 'remote': every filter/sort/
   *  search/page change fires @request('table/data'). */
  mode: 'local' | 'remote';
  columns: ColumnDefinition[];
  data: any[];
  /** Not a @property (would steal input focus while typing) — read/write directly. */
  searchText: string;
  searchDebounce: number;

  // ── Sorting ──
  currentSort: Array<{ column: string; direction: 'asc' | 'desc' }>;

  // ── Selection ──
  selectedRows: number[];
  /** 'multiple' (default) = additive toggle; 'single' = one row; 'none' = off. */
  selectionMode: SelectionMode;
  selector: string;
  selectorOptions: Array<{ value: string; label: string }>;

  // ── Grouping / aggregation ──
  /** Column key(s) to group rows by. Assigning post-mount re-renders reactively.
   *  Empty = ungrouped (aggregation footers may still apply). */
  groupBy: string | string[];
  /** Initial group expansion. `{ expanded: false }` starts all groups collapsed. */
  groupDefaults: { expanded?: boolean };

  // ── Pagination ──
  pagination: boolean;
  paginationMode: PaginationMode;
  pageSize: number;
  currentPage: number;
  totalItems: number;
  pageSizes: number[];

  // ── Virtualization ──
  virtualize: boolean;
  rowHeight: number;
  virtualBuffer: number;

  // ── Editing ──
  editable: boolean;
  editMode: 'cell' | 'row';

  // ── Layout / density ──
  density: 'compact' | 'standard' | 'comfortable';
  columnFit: ColumnFit;

  // ── Column features ──
  columnResize: boolean;
  headerFilters: boolean;
  quickFilter: boolean;
  rowReorder: boolean;
  columnReorder: boolean;
  columnMenu: boolean;

  // ── Lazy loading ──
  lazyLoad: boolean;
  lazyLoadThreshold: number;

  // ── Request/respond (remote mode) ──
  getTableConfig(): Promise<any>;
  getTableData(): Promise<any>;

  // ── Data + column setters (`setColumns` reactive; `setData` non-eager bulk path) ──
  setData(data: any[]): void;
  setColumns(columns: ColumnDefinition[]): void;

  // ── Rendering (public; use renderBody after an unpaired setData bulk load) ──
  renderControls(): void;
  renderHeader(): void;
  renderSortableHeader(column: ColumnDefinition): string;
  renderBody(): void;
  renderPagination(): void;

  // ── Cell construction ──
  createCellElement(column: ColumnDefinition, value: any, row?: any): HTMLElement;
  getCellTagName(type: string): string;

  // ── Fullscreen ──
  toggleFullscreen: () => Promise<void>;

  // ── Selection ──
  updateRowSelectionState(): void;
  updateSelectAllState(): void;
  getSelectedData(): any[];
  setSelectabilityCheck(fn: (row: any, index: number) => boolean): void;

  // ── Sorting ──
  toggleSort(columnKey: string, multiSort?: boolean): void;
  setSortComparator(columnKey: string, comparator: (a: any, b: any, direction: 'asc' | 'desc') => number): void;

  // ── Pagination ──
  goToPage(page: number): void;
  setPageSize(size: number): void;

  // ── Virtualization / scrolling ──
  scrollToRow(index: number): void;
  scrollToColumn(columnKey: string): void;
  getScrollPosition(): { top: number; left: number };

  // ── Filtering ──
  setColumnFilter(column: string, operator: FilterOperator, value: any): void;
  removeColumnFilter(column: string): void;
  setQuickFilter(text: string): void;
  setFilterModel(model: FilterModel): void;
  getFilterModel(): FilterModel;
  clearAllFilters(): void;

  // ── Column visibility / pinning / sizing / order ──
  setColumnVisible(key: string, visible: boolean): void;
  showAllColumns(): void;
  hideAllColumns(): void;
  getColumnVisibility(): Record<string, boolean>;
  pinColumn(key: string, side: 'left' | 'right'): void;
  unpinColumn(key: string): void;
  autoSizeColumn(key: string): void;
  autoSizeAllColumns(): void;
  moveColumn(key: string, toIndex: number): void;
  setColumnGroups(groups: ColumnGroup[]): void;

  // ── Editing ──
  startEdit(rowIndex: number, columnKey: string): void;
  commitEdit(): Promise<string | null>;
  cancelEdit(): void;
  /** Register a per-cell editability predicate (wraps the editor's check). */
  setCellEditableCheck(fn: (row: any, column: string) => boolean): void;

  // ── Export ──
  exportCSV(options?: CSVExportOptions): void;
  printTable(options?: PrintOptions): void;
  copyToClipboard(options?: ClipboardOptions): Promise<boolean>;

  // ── Master-detail ──
  setDetailPanel(options: DetailPanelOptions): void;
  expandRow(index: number): void;
  collapseRow(index: number): void;
  toggleRowExpansion(index: number): void;
  expandAllRows(): void;
  collapseAllRows(): void;

  // ── Toolbar ──
  setToolbar(options: ToolbarOptions): void;

  // ── Tree data ──
  setTreeData(options: TreeDataOptions): void;
  expandTreeNode(key: string): void;
  collapseTreeNode(key: string): void;
  toggleTreeNode(key: string): void;
  expandAllTreeNodes(): void;
  collapseAllTreeNodes(): void;

  // ── Row pinning ──
  pinRowTop(row: any): void;
  pinRowBottom(row: any): void;
  unpinRow(row: any): void;
  clearPinnedRows(): void;

  // ── Row height ──
  setRowHeight(height: number): void;
  setRowHeightCallback(fn: (row: any, index: number) => number): void;

  // ── List view ──
  listRenderer: ListViewRenderer | null;
  setListViewRenderer(fn: ListViewRenderer): void;
}

/**
 * Every event `<snice-table>` dispatches, keyed by event name → `detail`
 * shape. Covers (a) `SniceTable`'s own `@dispatch`/`dispatchEvent` calls,
 * (b) feature modules that dispatch directly on the table element via
 * `tableElement.dispatchEvent(...)` (table-editor / table-master-detail /
 * table-row-dnd / table-column-manager, each `.attach(tableEl)`-ed by
 * SniceTable), and (c) elements the table itself constructs into its own
 * shadow DOM whose `bubbles:true, composed:true` events reach a listener on
 * `<snice-table>` (snice-cell-actions' cell-action, table-tree-data's
 * tree-toggle). Excludes `row-click`/`row-select`/`row-hover`
 * (snice-row.ts) and `header-sort`/`header-select-all`/`header-filter`
 * (snice-header.ts) — those are the standalone `<snice-row>`/`<snice-header>`
 * elements' own event surfaces, not generated by SniceTable's render path.
 *
 * Every shape below was read from its dispatch site, not guessed:
 */
export interface SniceTableEventMap {
  /** snice-table.ts dispatchRowClicked() — row click, requires `clickable`. */
  'row-clicked': { rowData: any; rowIndex: number };
  /** snice-table.ts dispatchRowSelectionChanged() — one row's checkbox/click toggle. */
  'table-row-selection-changed': { selectedRows: number[]; rowIndex: number; selected: boolean };
  /** snice-table.ts dispatchSelectAllChanged() — header select-all checkbox toggled. */
  'table-select-all-changed': { selectedRows: number[]; allSelected: boolean };
  /** snice-table.ts dispatchSelectionChanged() — unified event fired alongside
   *  the two legacy selection events on every user-driven selection change. */
  'selection-changed': { selectedRows: number[]; rows: any[] };
  /** snice-table.ts dispatchSortChange() — currentSort changed (toggleSort/toolbar/column menu). */
  'sort-change': { sort: Array<{ column: string; direction: 'asc' | 'desc' }> };
  /** snice-table.ts dispatchFilterChange() — filter model changed (applyClientFilters). */
  'filter-change': { filters: FilterModel };
  /** snice-table.ts dispatchPageChange() — goToPage()/setPageSize(). */
  'page-change': { page: number; pageSize: number; totalPages: number; totalItems: number };
  /** snice-table.ts dispatchColumnVisibilityChange() — setColumnVisible(). */
  'column-visibility-change': { key: string; visible: boolean; visibility: Record<string, boolean> };
  /** snice-table.ts dispatchColumnPinChange() — pinColumn()/unpinColumn(). */
  'column-pin-change': { key: string; pinned: 'left' | 'right' | false };
  /** snice-table.ts dispatchColumnOrderChange() — moveColumn(). */
  'column-order-change': { key: string; toIndex: number };
  /** snice-table.ts dispatchDensityChange() — density controlled-state assignment. */
  'density-change': { density: 'compact' | 'standard' | 'comfortable' };
  /** snice-table.ts dispatchLoadError() — remote-mode getTableData() request rejected. */
  'table-load-error': { error: unknown };
  /** snice-table.ts setupLazyLoading()'s scroll handler — near scroll-bottom threshold. */
  'lazy-load': { currentCount: number };
  /** table-editor.ts commitCellEdit(). */
  'cell-edit-commit': { rowIndex: number; columnKey: string; oldValue: any; newValue: any };
  /** table-editor.ts cancelCellEdit(). */
  'cell-edit-cancel': { rowIndex: number; columnKey: string };
  /** table-editor.ts commitRowEdit(). */
  'row-edit-commit': { rowIndex: number; oldRow: any; newRow: any };
  /** table-editor.ts cancelRowEdit(). */
  'row-edit-cancel': { rowIndex: number };
  /** table-master-detail.ts expand(). */
  'row-expand': { rowIndex: number };
  /** table-master-detail.ts collapse(). */
  'row-collapse': { rowIndex: number };
  /** table-master-detail.ts createToggleButton()'s click handler. */
  'detail-toggle': { rowIndex: number; expanded: boolean };
  /** table-row-dnd.ts TableRowDnD's drop handler. */
  'row-reorder': { fromIndex: number; toIndex: number };
  /** table-row-dnd.ts TableColumnDnD's drop handler. */
  'column-reorder': { fromKey: string; toKey: string };
  /** table-column-manager.ts startResize()'s mousemove handler. */
  'column-resize': { key: string; width: number };
  /** table-column-manager.ts startResize()'s mouseup handler. */
  'column-resize-end': { key: string; width: number };
  /** table-tree-data.ts createToggle()'s click handler — bubbles from the
   *  toggle button the table renders into a tree-mode group column cell. */
  'tree-toggle': { key: string; expanded: boolean };
  /** snice-cell-actions.ts dispatchAction() — bubbles from an `actions`-type
   *  cell the table renders via createCellElement. */
  'cell-action': { action: string; rowData: any; column: ColumnDefinition | null };
  /** snice-table.ts dispatchGroupToggle() — a group header expand/collapse.
   *  `key` is an opaque stable group identity; `value` is the displayed value. */
  'group-toggle': { key: string; value: any; expanded: boolean };
}

export interface SniceHeaderElement extends HTMLElement {
  sticky: boolean;
  columns: ColumnDefinition[];
  selectable: boolean;
  sortable: boolean;
  currentSort: TableSort;
}

export interface SniceColumnElement extends HTMLElement {
  key: string;
  label: string;
  type: ColumnType;
  align: ColumnAlign;
  width: string;
  sortable: boolean;
  filterable: boolean;
  /** Built-ins reflect through aggregate="..."; custom reducers are property-only. */
  aggregate?: Aggregator;
  getColumnDefinition(): ColumnDefinition;
}

export interface SniceRowElement extends HTMLElement {
  selected: boolean;
  hoverable: boolean;
  clickable: boolean;
  data: any;
  index: number;
  columns: ColumnDefinition[];
  selectable: boolean;
  selectionDisabled: boolean;
  updateCells(): void;
}

export interface SniceCellElement extends HTMLElement {
  align: ColumnAlign;
  type: ColumnType | string;
  value: any;
  column: ColumnDefinition | null;
}
