import { element, property, query, request, dispatch, watch, render, styles, html, css, ready, dispose, on } from 'snice';
import '../input/snice-input';
import '../select/snice-select';
import '../button/snice-button';
import '../checkbox/snice-checkbox';
import '../modal/snice-modal';
import '../empty-state/snice-empty-state';
import './snice-cell.ts';
import './snice-cell-text.ts';
import './snice-cell-number.ts';
import './snice-cell-date.ts';
import './snice-cell-boolean.ts';
import './snice-cell-rating.ts';
import './snice-cell-progress.ts';
import './snice-cell-duration.ts';
import './snice-cell-filesize.ts';
import './snice-cell-sparkline.ts';
import './snice-cell-percentage.ts';
import './snice-cell-tag.ts';
import './snice-cell-status.ts';
import './snice-cell-actions.ts';
import './snice-cell-link.ts';
import './snice-cell-email.ts';
import './snice-cell-phone.ts';
import './snice-cell-color.ts';
import './snice-cell-location.ts';
import './snice-cell-json.ts';
import './snice-cell-currency.ts';
import './snice-cell-image.ts';
import './snice-column.ts';
import './snice-row.ts';
import { TableVirtualizer } from './table-virtualizer';
import { TableColumnManager } from './table-column-manager';
import { TableFilterEngine } from './table-filter-engine';
import { TableEditor } from './table-editor';
import type { EditorType } from './table-editor';
import { TableKeyboard } from './table-keyboard';
import { TableExport } from './table-export';
import { TableMasterDetail } from './table-master-detail';
import { TableToolbar } from './table-toolbar';
import { TableTreeData } from './table-tree-data';
import { TableGrouping } from './table-grouping';
import type { DisplayItem, GroupRow, AggregateRow } from './table-grouping';
import { TableColumnMenu } from './table-column-menu';
import { TableRowDnD, TableColumnDnD } from './table-row-dnd';
import type { FilterModel } from './table-filter-engine';
import type { DetailPanelOptions } from './table-master-detail';
import type { ToolbarOptions } from './table-toolbar';
import type { TreeDataOptions, TreeRow } from './table-tree-data';
import type { ColumnGroup } from './table-column-manager';
import type { ColumnDefinition, SniceTableElement, SelectionMode } from './snice-table.types';

/**
 * A single desired body row for the render-path reconciler (Task B). `key`
 * identifies the row across renders (the row-object itself for data rows, a
 * synthetic string for pinned / detail rows). `sig` captures everything about
 * the row's DOM that a data-object move can't fix by re-stamping — when it is
 * unchanged the existing element is reused. `alwaysRebuild` forces a fresh
 * element (edit-state and detail rows). `restampIndex`, when present, updates
 * the reused row's index-derived attributes after a reorder.
 */
interface RowEntry {
  key: unknown;
  sig: string;
  create: () => HTMLElement;
  alwaysRebuild?: boolean;
  restampIndex?: number;
}

@element('snice-table')
export class SniceTable extends HTMLElement implements SniceTableElement {

  @property({ type: Boolean,  attribute: 'striped' })
  striped = false;

  @property({ type: Boolean,  attribute: 'searchable' })
  searchable = false;

  @property({ type: Boolean,  attribute: 'filterable' })
  filterable = false;

  @property({ type: Boolean,  attribute: 'sortable' })
  sortable = false;

  @property({ type: Boolean,  attribute: 'selectable' })
  selectable = false;

  @property({ type: Boolean,  attribute: 'hoverable' })
  hoverable = true;

  @property({ type: Boolean,  attribute: 'clickable' })
  clickable = false;

  @property({ type: Boolean,  attribute: 'list' })
  list = false;

  @property({ type: Boolean, attribute: 'pagination' })
  pagination = false;

  @property({ attribute: 'pagination-mode' })
  paginationMode: 'client' | 'server' = 'client';

  @property({ type: Number, attribute: 'page-size' })
  pageSize = 10;

  @property({ type: Number, attribute: 'current-page' })
  currentPage = 1;

  @property({ type: Number, attribute: 'total-items' })
  totalItems = 0;

  @property({ type: Array, attribute: false })
  pageSizes: number[] = [10, 25, 50, 100];

  @property({ type: Number,  attribute: 'search-debounce' })
  searchDebounce = 500;

  // C1: reactive, no attribute reflection. A post-mount assignment (or the
  // setData/setColumns aliases) re-renders through the microtask-coalesced
  // queue — see handleColumnsAssignment / handleDataAssignment.
  @property({ attribute: false })
  columns: any[] = [];

  @property({ attribute: false })
  data: any[] = [];

  /**
   * Data mode: 'local' = client-side, table owns the dataset (set via setData
   *                       or the `data` property; filter/sort run locally);
   *            'remote' = server-side, every filter/sort/search/page change
   *                       fires @request('table/data'); a @respond handler in
   *                       the parent controller returns the new page.
   *
   * Default is 'local'. Set `mode="remote"` on the element OR assign the
   * property to opt into remote mode.
   */
  @property() mode: 'local' | 'remote' = 'local';

  // C1: setColumns is a thin alias over the reactive assignment — its @watch
  // resyncs the column model and coalesces the header+body render.
  setColumns(columns: any[]) {
    this.columns = columns;
  }

  // C1: setData is the IMPERATIVE bulk-load path. It resyncs the data model
  // (snapshot + row-index map) exactly like the reactive `table.data =` setter,
  // but does NOT eagerly re-render — the established API fills the body via an
  // explicit render (or the coalesced render from a paired setColumns). Keeping
  // the eager render off this path avoids re-warming the filtered snapshot the
  // caller may want left cold. The reactive PROPERTY (`table.data = rows`) is
  // the auto-rendering entry point.
  setData(data: any[]) {
    this.settingDataImperative = true;
    this.data = data;
    this.settingDataImperative = false;
  }

  @property({ type: Array, attribute: false })
  currentSort: Array<{ column: string, direction: 'asc' | 'desc' }> = [];

  // Don't use @property decorator to avoid auto-rendering on searchText change
  // This would cause the input to lose focus while typing
  searchText: string = '';

  @property({ type: String, attribute: 'selector' })
  selector: string = '';

  @property({ type: Array, attribute: false })
  selectorOptions: Array<{value: string, label: string}> = [];

  @property({ type: Boolean,  attribute: 'loading' })
  loading: boolean = false;

  // Set when a remote-mode load fails; cleared on the next successful load.
  // Not a @property — renderBody() reads it directly, no attribute needed.
  private loadError: string | null = null;

  @property({ type: Boolean, attribute: 'virtualize' })
  virtualize = false;

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 48;

  @property({ type: Number, attribute: 'virtual-buffer' })
  virtualBuffer = 200;

  @property({ type: Boolean, attribute: 'column-resize' })
  columnResize = false;

  @property({ type: Boolean, attribute: 'editable' })
  editable = false;

  @property({ attribute: 'edit-mode' })
  editMode: 'cell' | 'row' = 'cell';

  @property({ attribute: 'density' })
  density: 'compact' | 'standard' | 'comfortable' = 'standard';

  @property({ type: Boolean, attribute: 'header-filters' })
  headerFilters = false;

  @property({ type: Boolean, attribute: 'quick-filter' })
  quickFilter = false;

  @property({ type: Boolean, attribute: 'row-reorder' })
  rowReorder = false;

  @property({ type: Boolean, attribute: 'column-reorder' })
  columnReorder = false;

  @property({ type: Boolean, attribute: 'column-menu' })
  columnMenu = false;

  @property({ type: Boolean, attribute: 'lazy-load' })
  lazyLoad = false;

  @property({ type: Number, attribute: 'lazy-load-threshold' })
  lazyLoadThreshold = 200; // px from bottom to trigger

  @property({ type: Array, attribute: false })
  selectedRows: number[] = [];

  // E1: selection behavior. 'multiple' (default) preserves the historical
  // additive-toggle path; 'single' collapses to one row; 'none' disables it.
  @property({ attribute: 'selection-mode' })
  selectionMode: SelectionMode = 'multiple';

  // E1: shift-range anchor. Holds the row OBJECT (not an index) so it tracks the
  // row across a sort that moves it — the range is computed against the current
  // filtered snapshot / rowIndexMap at click time.
  private selectionAnchor: any = null;

  // F: row grouping. `groupBy` is column key(s) to group by; assigning it
  // post-mount re-renders through the coalescing queue (handleGroupByChange).
  // Aggregation is per-column (ColumnDefinition.aggregate) and needs no flag —
  // the grouping model reports isEnabled() when either grouping or aggregation
  // is active, and the body routes through the flattened display list in both
  // cases. attribute:false — a string[] can't reflect to an attribute, and the
  // reactive contract is property assignment (mirrors columns/data).
  @property({ attribute: false })
  groupBy: string | string[] = '';

  @property({ attribute: false })
  groupDefaults: { expanded?: boolean } = {};

  // F: flattened group+row+aggregate display list cache. Rebuilt lazily from the
  // filtered snapshot; invalidated on the same model mutations as filteredCache
  // PLUS group expand/collapse and groupBy/column changes (invalidateGroupingCache).
  private groupingCache: DisplayItem[] | null = null;

  // Module instances
  private virtualizer = new TableVirtualizer();
  private columnManager = new TableColumnManager();
  private filterEngine = new TableFilterEngine();
  private editor = new TableEditor();
  private keyboard = new TableKeyboard();
  private exporter = new TableExport();
  private masterDetail = new TableMasterDetail();
  private toolbar = new TableToolbar();
  private treeData = new TableTreeData();
  private grouping = new TableGrouping();
  private columnMenuManager = new TableColumnMenu();
  private rowDnD = new TableRowDnD();
  private columnDnD = new TableColumnDnD();
  private pinnedTopRows: any[] = [];
  private pinnedBottomRows: any[] = [];
  private toolbarOptions: ToolbarOptions | null = null;
  private lazyLoadHandler: (() => void) | null = null;
  private lazyLoadContainer: HTMLElement | null = null;
  private rowHeightCallback: ((row: any, index: number) => number) | null = null;
  private virtualRowsSnapshot: Array<{ data: any; index: number; treeRow?: TreeRow; groupItem?: DisplayItem }> = [];

  @query('table')
  table!: HTMLTableElement;

  @query('thead')
  thead!: HTMLTableSectionElement;

  @query('tbody')
  tbody!: HTMLTableSectionElement;


  @request('table/config')
  async *getTableConfig(): any {
    const config = await (yield {});
    this.columns = config.columns || [];
    this.selectorOptions = config.selectorOptions || [];
    // Wait for next frame to ensure DOM is updated
    await new Promise(resolve => requestAnimationFrame(resolve));
    this.renderHeader();
    this.renderControls();
    return config;
  }

  @request('table/data')
  async *getTableData(): any {
    // A5: capture this request's sequence number. A later request bumps the
    // counter, so a slow earlier response finds seq !== this.dataRequestSeq and
    // bails without touching the model — no out-of-order clobber.
    const seq = ++this.dataRequestSeq;
    this.loading = true;
    this.selectedRows = []; // Clear selections when loading new data

    try {
      const params: any = {
        search: this.searchText,
        sort: this.currentSort,
        filter: this.filterEngine.getFilterModel(),
        selector: this.selector
      };

      if (this.pagination) {
        params.page = this.currentPage;
        params.pageSize = this.pageSize;
      }
      const response = await (yield params);
      if (seq !== this.dataRequestSeq) return; // superseded by a newer request
      this.data = response.data || [];
      this.rebuildRowIndex();
      if (response.totalItems !== undefined) {
        this.totalItems = response.totalItems;
      }
      this.loadError = null;
      this.classList.remove('table--error');
      this.loading = false;
      // Wait for next frame to ensure DOM is updated
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (seq !== this.dataRequestSeq) return; // superseded while awaiting frame
      this.renderBody();
      return response;
    } catch (error) {
      if (seq !== this.dataRequestSeq) return; // stale failure — ignore silently
      console.error('Error loading table data:', error);
      this.loadError = error instanceof Error ? error.message : String(error);
      this.classList.add('table--error');
      this.dispatchLoadError(error);
      this.loading = false;
      // Wait for next frame to ensure DOM is updated
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.renderBody();
    }
  }

  private unsortedData: any[] = [];
  private dataRequestTimeout: any = null;

  // A1: row-object → its index in `this.data`. Replaces the O(n) `data.indexOf`
  // that ran per row on every selection toggle (was O(n²) for select-all).
  // `rowIndexDataRef` is the array the map was built from — a plain
  // `table.data = [...]` assignment swaps the array without going through
  // setData/rebuildRowIndex, so `ensureRowIndex()` lazily rebuilds when it
  // detects the reference changed.
  private rowIndexMap = new Map<any, number>();
  private rowIndexDataRef: any[] | null = null;

  // A4: the filtered snapshot getFilteredData() hands out. Recomputing it per
  // rAF scroll frame re-ran the whole filter engine every frame. Invalidated on
  // every mutation of data / filters / sort (see invalidateFilteredCache).
  private filteredCache: any[] | null = null;

  // A5: monotonic request id. Captured at request start; a response only
  // applies if it is still the latest, so a slow earlier response can't clobber
  // a fast later one.
  private dataRequestSeq = 0;

  // Task B: render-path recycling. Keyed by row-object identity (data rows) or a
  // synthetic string key (pinned / detail rows). Maps a key to the <tr> element
  // currently rendered for it plus the signature it was rendered with. On the
  // next render, a key whose object and signature are unchanged reuses its <tr>
  // (moved when order changes) instead of reconstructing it and every cell.
  // Rebuilt fresh on every render pass, so switching render modes is safe.
  private renderedRows = new Map<unknown, { el: HTMLElement; sig: string }>();

  // C1: brackets the internal `this.data` reassignment inside sortLocalData so
  // the data @watch treats a re-sorted view of the same rows as NOT a new
  // dataset — it must not refresh the unsortedData snapshot or double-render.
  private settingSortedData = false;

  // C1: set while the imperative setData() runs so the data @watch resyncs the
  // model but skips the auto-render (the caller drives the body fill).
  private settingDataImperative = false;

  // C1/C2: microtask-coalesced render queue. Reactive assignments schedule a
  // render here instead of calling renderHeader/renderBody synchronously —
  // MANDATORY, because happy-dom crashes constructing cell elements inside a
  // property-setter stack. A burst of assignments in one tick flushes once.
  private renderQueued = false;
  private pendingHeaderRender = false;
  private pendingBodyRender = false;

  private scheduleRender(what: 'header' | 'body' | 'both') {
    if (what === 'header' || what === 'both') this.pendingHeaderRender = true;
    if (what === 'body' || what === 'both') this.pendingBodyRender = true;
    if (this.renderQueued) return;

    this.renderQueued = true;
    queueMicrotask(() => {
      // @property invokes watchers before it asks Snice to update the template.
      // A second microtask lets that differential render commit first when a
      // property changes the table's structural mode (notably slotted rows →
      // grouped native table), while still coalescing a burst into one flush.
      queueMicrotask(() => {
        this.renderQueued = false;
        const doHeader = this.pendingHeaderRender;
        const doBody = this.pendingBodyRender;
        this.pendingHeaderRender = false;
        this.pendingBodyRender = false;
        if (doHeader) this.renderHeader();
        if (doBody) this.renderBody();
      });
    });
  }


  private debouncedDataRequest() {
    // Set loading immediately for instant feedback
    if (!this.loading) {
      this.loading = true;
    }
    
    if (this.dataRequestTimeout) {
      clearTimeout(this.dataRequestTimeout);
    }
    
    this.dataRequestTimeout = setTimeout(() => {
      this.getTableData();
      this.dataRequestTimeout = null;
    }, 150);
  }

  @styles()
  styles() {
    return css/*css*/`
      :host([hidden]) {
  display: none;
}

:host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 200px;
      }

      /* Native Fullscreen API: paint the host's background as the backdrop
         so the area outside our box (during transition) matches dark/light. */
      :host(:fullscreen) {
        background: var(--snice-color-surface, rgb(255 255 255));
      }
      :host(:fullscreen)::backdrop {
        background: var(--snice-color-surface, rgb(255 255 255));
      }

      /* CSS fallback fullscreen — used when requestFullscreen is blocked. */
      :host(.table-fullscreen) {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: var(--snice-color-surface, rgb(255 255 255));
        padding: var(--snice-spacing-md, 1rem);
        overflow: auto;
        display: flex;
        flex-direction: column;
      }

      :host(.table-fullscreen) .snice-table {
        flex: 1;
        height: auto;
      }

      :host(.table-fullscreen) .table-frame {
        flex: 1;
        max-height: none;
      }



      .snice-table {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      /* Frame wraps super-header + table; provides the rounded border.
         flex:1 + min-height:0 lets it absorb the remaining host height
         instead of letting content size dictate height. */
      .table-frame {
        position: relative;
        flex: 1;
        min-height: 0;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-lg, 0.5rem);
        overflow: auto;
      }

      table {
        width: 100%;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
        /* no border or radius — handled by .table-frame */
      }

      /* Super-header (slotted area above column headers) */
      .table-superheader {
        background: var(--snice-color-surface, rgb(255 255 255));
      }

      .table-superheader:empty {
        display: none;
      }

      .table-superheader ::slotted(*) {
        display: block;
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-md, 1rem);
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
      }

      th, td {
        padding: var(--snice-spacing-xs, 0.5rem) var(--snice-spacing-sm, 0.75rem);
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-right: 1px solid var(--snice-color-border, rgb(226 226 226));
        text-align: left;
        vertical-align: middle;
        color: var(--snice-color-text, rgb(23 23 23));
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Remove right border on last cell in row */
      th:last-child,
      td:last-child {
        border-right: none;
      }

      /* Remove bottom border on last body row */
      tbody tr:last-child td {
        border-bottom: none;
      }

      th {
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-sm, 0.75rem);
      }

      /* Narrow utility columns: checkbox, expand toggle, drag handle.
       * vertical-align: middle is REQUIRED — td defaults to baseline and the
       * checkbox sits at the bottom when any other cell is taller (fat rows). */
      th.select-column,
      td.select-column,
      th.detail-toggle-cell,
      td.detail-toggle-cell,
      th.drag-handle-cell,
      td.drag-handle-cell {
        width: 1.75rem;
        max-width: 1.75rem;
        min-width: 1.75rem;
        text-align: center;
        vertical-align: middle;
        padding: 0 0.125rem;
        overflow: visible;
        box-sizing: content-box;
      }

      /* Force snice-checkbox compact + centered inside table */
      .select-column snice-checkbox {
        min-height: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
      }

      th {
        background-color: var(--snice-color-surface-container-low, rgb(245 245 245));
        color: var(--snice-color-text, rgb(23 23 23));
        font-weight: var(--snice-font-weight-semibold, 600);
        border-bottom: 1px solid var(--snice-color-border-subtle, var(--snice-color-border, rgb(226 226 226)));
      }

      th.sortable {
        cursor: pointer;
        user-select: none;
      }

      /* Hover and selected states share the same tokens as menu/list/command-palette
       * for cross-component visual consistency. */
      th.sortable:hover {
        background-color: var(--snice-color-surface-hover, rgb(243 244 246));
      }

      /* Sticky header (Task 4d) — thead cells stick to .table-frame's
         scroll-top edge. z-index sits above tbody cells (plain cells are
         unpositioned; pinned body td gets inline zIndex '1' in createRow) and
         at the pinned-header corner's own inline zIndex '2' (renderHeader),
         so a cell that is both pinned AND in the header still wins on
         horizontal scroll. Background matches the existing th background so
         rows never bleed through while scrolling underneath. */
      thead th {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: var(--snice-color-surface-container-low, rgb(245 245 245));
      }

      /* Row styling */
      :host([striped]) tbody tr:nth-child(even) {
        background-color: var(--snice-color-surface-container-low, rgb(245 245 245));
      }

      :host([hoverable]) tbody tr:hover {
        background-color: var(--snice-color-surface-hover, rgb(243 244 246));
      }

      :host([clickable]) tbody tr {
        cursor: pointer;
      }

      :host([selectable]:not([selection-mode="none"])) tbody tr {
        cursor: pointer;
      }

      tbody tr[data-selected="true"] {
        background-color: var(--snice-color-primary-subtle, rgb(239 246 255));
        box-shadow: inset 2px 0 0 0 var(--snice-color-primary, rgb(37 99 235));
      }

      tbody tr[data-selected="true"]:hover {
        background-color: var(--snice-color-primary-subtle-hover, var(--snice-color-primary-subtle, rgb(219 234 254)));
      }

      /* List mode - hide vertical borders */
      :host([list]) th,
      :host([list]) td {
        border-right: none;
      }

      :host([list]) .table-frame {
        border-left: none;
        border-right: none;
        border-radius: 0;
      }

      [part="header"] {
        background-color: var(--snice-color-surface, rgb(255 255 255));
      }

      [part="body"] {
        background-color: var(--snice-table-body-bg, var(--snice-color-surface, rgb(255 255 255)));
        display: block;
      }

      /* Toolbar */
      .table-toolbar {
        display: flex;
        align-items: center;
        gap: var(--snice-spacing-xs, 0.5rem);
        padding: var(--snice-spacing-xs, 0.5rem) var(--snice-spacing-sm, 0.75rem);
        padding-left: 0;
        background: var(--snice-color-surface, rgb(255 255 255));
      }

      .toolbar-search {
        width: 16rem;
        max-width: 16rem;
        flex: 0 0 auto;
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-left: auto;
      }

      .toolbar-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        background: var(--snice-color-surface, rgb(255 255 255));
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        cursor: pointer;
        transition: all var(--snice-transition-fast, 150ms) ease;
        padding: 0;
        line-height: 1;
        font-family: inherit;
      }

      .toolbar-btn:hover {
        background: var(--snice-color-surface-container-low, rgb(245 245 245));
        color: var(--snice-color-text, rgb(23 23 23));
      }

      .toolbar-btn svg {
        width: 16px;
        height: 16px;
      }

      /* Toolbar dropdown menus */
      .toolbar-menu {
        position: absolute;
        z-index: 10001;
        min-width: 12rem;
        background: var(--snice-color-surface, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
        padding: var(--snice-spacing-2xs, 0.25rem);
      }

      .toolbar-menu-title {
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        font-size: var(--snice-font-size-xs, 0.75rem);
        font-weight: var(--snice-font-weight-semibold, 600);
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .toolbar-menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        border: none;
        border-radius: 3px;
        background: transparent;
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        font-family: inherit;
        cursor: pointer;
        text-align: left;
      }

      .toolbar-menu-item:hover {
        background: var(--snice-color-surface-container-low, rgb(245 245 245));
      }

      .toolbar-menu-item--active {
        color: var(--snice-color-primary, rgb(37 99 235));
        font-weight: var(--snice-font-weight-medium, 500);
      }

      .toolbar-menu-item-indicator {
        font-size: 0.75rem;
        opacity: 0.7;
      }

      .toolbar-clear-btn {
        margin-top: var(--snice-spacing-2xs, 0.25rem);
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 0;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        font-size: var(--snice-font-size-xs, 0.75rem);
      }

      /* Filter menu */
      .toolbar-filter-menu {
        min-width: 16rem;
        padding: var(--snice-spacing-xs, 0.5rem);
      }

      .toolbar-filter-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: var(--snice-spacing-2xs, 0.25rem);
      }

      .toolbar-filter-label {
        font-size: var(--snice-font-size-xs, 0.75rem);
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        font-weight: var(--snice-font-weight-medium, 500);
      }

      .toolbar-filter-input {
        width: 100%;
        box-sizing: border-box;
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        font-size: var(--snice-font-size-sm, 0.875rem);
        font-family: inherit;
        color: var(--snice-color-text, rgb(23 23 23));
        background: var(--snice-color-surface, rgb(255 255 255));
        outline: none;
      }

      .toolbar-filter-input:focus {
        border-color: var(--snice-color-primary, rgb(37 99 235));
      }

      .toolbar-filter-input::placeholder {
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }

      .table-controls {
        display: flex;
        gap: var(--snice-spacing-xs, 0.5rem);
        align-items: center;
        flex-wrap: wrap;
        padding: var(--snice-spacing-xs, 0.5rem) var(--snice-spacing-sm, 0.75rem);
        padding-left: 0;
        justify-content: flex-start;
      }

      :host(:not([searchable])) .search-input {
        display: none;
      }

      :host(.selector-options-empty) .selector-input {
        display: none;
      }

      /* snice-input/snice-select handle own styling — layout only */
      .search-input {
        width: 16rem;
        max-width: 16rem;
        flex: 0 0 auto;
      }

      .selector-input {
        min-width: 9.375rem;
        --snice-select-min-height: 2rem;
      }

      /* Sort indicators */
      .sort-header {
        display: flex;
        align-items: center;
        gap: var(--snice-spacing-xs, 0.5rem);
        justify-content: space-between;
      }


      .sort-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        line-height: 1;
        opacity: 0.3;
        transition: opacity var(--snice-transition-fast, 150ms);
      }

      .sort-indicator.active {
        opacity: 1;
        color: var(--snice-color-primary, rgb(37 99 235));
      }

      .sort-order {
        font-size: 0.625rem;
        font-weight: 700;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: rgb(255 255 255);
        border-radius: 999px;
        padding: 0.0625rem 0.3125rem;
        min-width: 1rem;
        height: 1rem;
        line-height: 1rem;
        text-align: center;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* Loading fade */
      tbody {
        transition: opacity var(--snice-transition-normal, 250ms);
      }

      :host([loading]) tbody {
        opacity: 0.5;
      }

      .no-data {
        text-align: center;
        padding: var(--snice-spacing-lg, 1.5rem);
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }

      /* Remote-mode load error (Task 4c) — informed by the dead
         components/table/snice-table.css .table--error design. */
      :host(.table--error) .table-frame {
        border-color: var(--snice-color-danger, rgb(220 38 38));
      }

      .table-error-message {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--snice-spacing-2xs, 0.25rem);
        color: var(--snice-color-danger, rgb(220 38 38));
      }

      /* Pagination */
      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--snice-spacing-md, 1rem);
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-md, 1rem);
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        background: var(--snice-color-surface, rgb(255 255 255));
        font-size: var(--snice-font-size-sm, 0.875rem);
        flex-wrap: wrap;
      }

      .pagination__info {
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        white-space: nowrap;
      }

      .pagination__controls {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .pagination__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        padding: 0 var(--snice-spacing-2xs, 0.25rem);
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        background: var(--snice-color-surface, rgb(255 255 255));
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        cursor: pointer;
        transition: all var(--snice-transition-fast, 150ms) ease;
        font-family: inherit;
        line-height: 1;
      }

      .pagination__btn:hover:not(:disabled) {
        background: var(--snice-color-surface-container-low, rgb(245 245 245));
      }

      .pagination__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .pagination__btn--active {
        background: var(--snice-color-primary, rgb(37 99 235));
        color: var(--snice-color-text-inverse, rgb(250 250 250));
        border-color: var(--snice-color-primary, rgb(37 99 235));
      }

      .pagination__btn--active:hover:not(:disabled) {
        background: var(--snice-color-primary-hover, rgb(29 78 216));
      }

      .pagination__btn:focus-visible {
        outline: 2px solid var(--snice-color-primary, rgb(37 99 235));
        outline-offset: 2px;
        z-index: 1;
      }

      .pagination__ellipsis {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }

      .pagination__size {
        display: flex;
        align-items: center;
        gap: var(--snice-spacing-xs, 0.5rem);
        white-space: nowrap;
      }

      .pagination__size label {
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }

      .pagination__size-select {
        min-width: 4.5rem;
        --snice-select-min-height: 1.75rem;
      }

      /* Column resize handle */
      .resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        background: transparent;
        z-index: 1;
      }

      .resize-handle:hover,
      .resize-handle:active {
        background: var(--snice-color-primary, rgb(37 99 235));
      }

      /* Filter indicator */
      th.filtered::after {
        content: '';
        position: absolute;
        top: 4px;
        right: 8px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--snice-color-primary, rgb(37 99 235));
      }

      /* Pinned column separator */
      .pinned-cell {
        background: var(--snice-color-surface, rgb(255 255 255));
        box-shadow: 2px 0 4px -1px rgb(0 0 0 / 0.1);
      }

      /* Density: compact */
      :host([density="compact"]) th {
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        font-size: var(--snice-font-size-xs, 0.75rem);
      }

      :host([density="compact"]) td {
        padding: var(--snice-spacing-3xs, 0.125rem) var(--snice-spacing-xs, 0.5rem);
        font-size: var(--snice-font-size-xs, 0.75rem);
      }

      /* Density: comfortable */
      :host([density="comfortable"]) th {
        padding: var(--snice-spacing-md, 1rem);
      }

      :host([density="comfortable"]) td {
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-md, 1rem);
      }

      /* Editing */
      .table-editor-input {
        width: 100%;
        box-sizing: border-box;
        padding: var(--snice-spacing-2xs, 0.25rem);
        border: 2px solid var(--snice-color-primary, rgb(37 99 235));
        border-radius: var(--snice-border-radius-sm, 0.125rem);
        font-family: inherit;
        font-size: inherit;
        color: var(--snice-color-text, rgb(23 23 23));
        background: var(--snice-color-surface, rgb(255 255 255));
        outline: none;
      }

      .table-editor-select {
        width: 100%;
        padding: var(--snice-spacing-2xs, 0.25rem);
        border: 2px solid var(--snice-color-primary, rgb(37 99 235));
        border-radius: var(--snice-border-radius-sm, 0.125rem);
        font-family: inherit;
        font-size: inherit;
      }

      .table-editor-checkbox {
        width: 1rem;
        height: 1rem;
      }

      td.editing {
        padding: 2px !important;
      }

      .cell-error {
        color: var(--snice-color-danger, rgb(220 38 38));
        font-size: var(--snice-font-size-xs, 0.75rem);
        margin-top: 2px;
      }

      /* Header filter row */
      .header-filter-row td {
        padding: 0;
        background: var(--snice-color-surface-container-low, rgb(245 245 245));
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
      }

      .header-filter-input {
        width: 100%;
        box-sizing: border-box;
        padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-xs, 0.5rem);
        border: none;
        font-size: var(--snice-font-size-xs, 0.75rem);
        font-family: inherit;
        color: var(--snice-color-text, rgb(23 23 23));
        background: transparent;
        outline: none;
      }

      .header-filter-input::placeholder {
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }

      .header-filter-input:focus {
        background: var(--snice-color-surface-container-lowest, rgb(248 247 245));
      }

      /* Tree data indentation */
      .tree-indent {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
      }

      .tree-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        line-height: 1;
        width: 1.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--snice-transition-fast, 150ms) ease;
      }

      .tree-toggle:hover {
        color: var(--snice-color-text, rgb(23 23 23));
      }

      .tree-toggle:focus-visible {
        outline: var(--snice-focus-ring-width, 2px) solid var(--snice-focus-ring-color, hsl(217 91% 60% / 0.5));
        outline-offset: var(--snice-focus-ring-offset, 2px);
      }

      .tree-toggle-icon {
        width: 1rem;
        height: 1rem;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: rotate(-90deg);
      }

      .tree-toggle--expanded .tree-toggle-icon {
        transform: rotate(0deg);
      }

      .tree-spacer {
        display: inline-block;
        width: 1.25rem;
      }

      /* Row grouping — group header row */
      .group-header-row {
        background: var(--snice-table-group-header-bg, var(--snice-color-surface-container-low, hsl(0 0% 98%)));
      }

      .group-header-cell {
        cursor: pointer;
        font-weight: var(--snice-font-weight-semibold, 600);
        color: var(--snice-table-group-header-color, var(--snice-color-text, hsl(0 0% 9%)));
        user-select: none;
        padding: var(--snice-spacing-xs, 0.5rem) var(--snice-spacing-sm, 0.75rem);
      }

      .group-header-cell .tree-indent {
        vertical-align: middle;
      }

      .group-select-wrap {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        margin-right: var(--snice-spacing-2xs, 0.25rem);
      }

      .group-header-label {
        vertical-align: middle;
      }

      .group-header-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.25rem;
        height: 1.25rem;
        margin-left: var(--snice-spacing-xs, 0.5rem);
        padding: 0 var(--snice-spacing-2xs, 0.25rem);
        border-radius: 999px;
        background: var(--snice-table-group-count-bg, var(--snice-color-surface-container-high, hsl(40 9% 97%)));
        color: var(--snice-table-group-count-color, var(--snice-color-text-secondary, hsl(0 0% 32%)));
        font-size: var(--snice-font-size-xs, 0.75rem);
        font-weight: var(--snice-font-weight-medium, 500);
        vertical-align: middle;
      }

      /* Row grouping — aggregate footer row */
      .group-aggregate-row {
        background: var(--snice-table-aggregate-bg, var(--snice-color-surface-container, hsl(0 0% 95%)));
        font-weight: var(--snice-font-weight-medium, 500);
      }

      .group-aggregate-row[data-agg-scope="table"] {
        border-top: 2px solid var(--snice-table-aggregate-border-color, var(--snice-color-border, hsl(0 0% 82%)));
        font-weight: var(--snice-font-weight-semibold, 600);
      }

      .group-aggregate-row .aggregate-cell {
        color: var(--snice-table-aggregate-color, var(--snice-color-text, hsl(0 0% 9%)));
      }

      .aggregate-label {
        color: var(--snice-table-aggregate-label-color, var(--snice-color-text-secondary, hsl(0 0% 32%)));
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: var(--snice-font-size-xs, 0.75rem);
      }

      .aggregate-label--inline {
        display: block;
        margin-bottom: var(--snice-spacing-2xs, 0.25rem);
      }

      /* Row pinning */
      .pinned-row {
        font-weight: var(--snice-font-weight-medium, 500);
        border-bottom: 2px solid var(--snice-color-border, rgb(226 226 226));
        background: var(--snice-color-surface-container-low, rgb(245 245 245));
      }

      .pinned-row--top {
        border-bottom: 2px solid var(--snice-color-primary, rgb(37 99 235));
      }

      .pinned-row--bottom {
        border-top: 2px solid var(--snice-color-primary, rgb(37 99 235));
      }

      /* Column group headers */
      .column-group-row th {
        text-align: center;
        font-size: var(--snice-font-size-xs, 0.75rem);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        background: var(--snice-color-surface-container, rgb(235 235 235));
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
      }

      /* DnD */
      .drag-handle-cell {
        font-size: 0.875rem;
      }

      .drop-indicator {
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--snice-color-primary, rgb(37 99 235));
        z-index: 10;
        pointer-events: none;
      }

      tr[draggable="true"]:active {
        cursor: grabbing;
      }

      /* Master-detail — animated like accordion */
      .detail-row {
        background: var(--snice-color-surface-container-high, rgb(252 251 249));
      }

      .detail-cell {
        max-width: none;
      }

      .detail-content {
        overflow: hidden;
        max-height: 0;
        transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: max-height;
      }

      .detail-content--open {
        max-height: var(--detail-max-height, 31.25rem);
      }

      .detail-content-inner {
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-md, 1rem);
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
      }

      .detail-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .detail-toggle:hover {
        color: var(--snice-color-text, rgb(23 23 23));
      }

      .detail-toggle-icon {
        width: 1rem;
        height: 1rem;
        transition: transform 0.2s ease;
        transform: rotate(-90deg);
      }

      .detail-toggle--expanded .detail-toggle-icon {
        transform: rotate(0deg);
      }

      /* Drag handle */
      .drag-handle-cell {
        cursor: grab;
        user-select: none;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
        font-size: 0.875rem;
      }

      /* Focus indicator for keyboard nav */
      [data-grid-focus] {
        outline: 2px solid var(--snice-color-primary, rgb(37 99 235));
        outline-offset: -2px;
      }

      /* Column menu */
      .table-column-menu {
        position: fixed;
        z-index: 10001;
        min-width: 10rem;
        background: var(--snice-color-surface-container-high, rgb(252 251 249));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-md, 0.25rem);
        box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
        padding: 4px;
      }

      .column-menu-separator {
        height: 1px;
        background: var(--snice-color-border, rgb(226 226 226));
        margin: 4px 0;
      }

      .column-menu-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.375rem 0.625rem;
        border: none;
        border-radius: 3px;
        background: transparent;
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        font-family: inherit;
        cursor: pointer;
        text-align: left;
        white-space: nowrap;
      }

      .column-menu-item:hover {
        background: var(--snice-color-surface-container-low, rgb(245 245 245));
      }

      .column-menu-item:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .column-menu-item--active {
        color: var(--snice-color-primary, rgb(37 99 235));
        font-weight: var(--snice-font-weight-medium, 500);
      }

      .column-menu-icon {
        width: 1rem;
        height: 1rem;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }
      .column-menu-icon svg {
        width: 1rem;
        height: 1rem;
      }

      /* Slotted table layout */
      .snice-table--slotted {
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-lg, 0.5rem);
        overflow: hidden;
      }

      .snice-table--slotted .table-header {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        background-color: var(--snice-color-surface-container-low, rgb(245 245 245));
        border-bottom: 2px solid var(--snice-color-border, rgb(226 226 226));
        padding: var(--snice-spacing-sm, 0.75rem);
        font-weight: var(--snice-font-weight-semibold, 600);
        color: var(--snice-color-text, rgb(23 23 23));
      }

      .snice-table--slotted .header-cell {
        color: var(--snice-color-text, rgb(23 23 23));
      }

      .snice-table--slotted .table-header::slotted(snice-column) {
        padding: var(--snice-spacing-sm, 0.75rem);
      }

      .snice-table--slotted .table-body {
        display: flex;
        flex-direction: column;
      }

      .snice-table--slotted .table-body::slotted(snice-row) {
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
      }

      .snice-table--slotted .table-body::slotted(snice-row:last-child) {
        border-bottom: none;
      }

      :host([striped]) .snice-table--slotted .table-body::slotted(snice-row:nth-child(even)) {
        background-color: var(--snice-color-surface-container-low, rgb(245 245 245));
      }

      :host([hoverable]) .snice-table--slotted .table-body::slotted(snice-row:hover) {
        background-color: var(--snice-color-surface-container, rgb(235 235 235));
      }
    `;
  }

  @render()
  render() {
    // Check if we have slotted rows
    const hasSlottedRows = this.querySelectorAll('snice-row[slot="rows"]').length > 0
      && !this.shouldModelSlottedRows();

    if (hasSlottedRows) {
      // Use slotted rows layout
      return html/*html*/`
        <div class="snice-table snice-table--slotted" @click=${this.handleClick} @keydown=${this.handleKeydown} @change=${this.handleChange} @checkbox-change=${this.handleChange}>
          <div class="table-controls-container"></div>
<div class="table-header" id="slotted-header"></div>
          <div class="table-body">
            <slot name="rows"></slot>
          </div>
          <slot name="columns" style="display: none;"></slot>
        </div>
      `;
    } else {
      // Use traditional table layout
      return html/*html*/`
        <div class="snice-table" @click=${this.handleClick} @keydown=${this.handleKeydown} @change=${this.handleChange} @checkbox-change=${this.handleChange}>
          <div class="table-controls-container"></div>
<div class="table-frame">
            <div class="table-superheader" part="superheader">
              <slot name="header"></slot>
            </div>
            <table>
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="table-pagination-container"></div>
        </div>
      `;
    }
  }

  renderControls() {
    const container = this.shadowRoot?.querySelector('.table-controls-container');
    if (!container) return;

    // A configured toolbar owns this container. Reattach it when a structural
    // render replaces the shadow template; legacy controls must not overwrite it.
    if (this.toolbarOptions) {
      this.setToolbar(this.toolbarOptions);
      return;
    }

    const showControls = this.searchable || this.filterable || this.quickFilter;
    if (!showControls) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = '';
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'table-controls';
    controlsDiv.setAttribute('part', 'controls');

    if (this.quickFilter) {
      const quickInput = document.createElement('snice-input') as any;
      quickInput.className = 'quick-filter-input';
      quickInput.type = 'search';
      quickInput.placeholder = 'Quick filter...';
      quickInput.size = 'small';
      quickInput.clearable = true;
      quickInput.style.width = '16rem';
      quickInput.style.maxWidth = '16rem';
      quickInput.value = this.filterEngine.getFilterModel().quickFilter || '';
      quickInput.addEventListener('input', this.handleQuickFilterInput);
      controlsDiv.appendChild(quickInput);
    } else if (this.searchable) {
        const searchInput = document.createElement('snice-input');
        searchInput.className = 'search-input';
        searchInput.setAttribute('type', 'search');
        searchInput.setAttribute('placeholder', 'Search...');
        searchInput.setAttribute('size', 'small');
        searchInput.style.width = '16rem';
        searchInput.style.maxWidth = '16rem';
        searchInput.style.flex = '0 0 auto';
        searchInput.addEventListener('input', this.handleSearchInput);
        controlsDiv.appendChild(searchInput);
    }

    if (this.filterable) {
        const select = document.createElement('snice-select');
        select.className = 'selector-input';
        select.setAttribute('multiple', '');
        select.setAttribute('searchable', '');
        select.setAttribute('clearable', '');
        select.setAttribute('placeholder', 'Filter...');
        select.setAttribute('size', 'medium');

        this.selectorOptions.forEach(opt => {
          const option = document.createElement('snice-option');
          option.setAttribute('value', opt.value);
          option.textContent = opt.label;
          select.appendChild(option);
        });

        controlsDiv.appendChild(select);
    }

    container.appendChild(controlsDiv);
  }

  @ready()
  async initialize() {
    // Listen for controller attached event
    this.addEventListener('controller-attached', this.onAttached as EventListener);

    // Listen for select change events from the filter dropdown
    this.addEventListener('select-change', this.handleSelectorChange as EventListener);
    this.addEventListener('row-select', this.handleSlottedRowSelect as EventListener);

    // Listen for detail panel toggle
    this.addEventListener('detail-toggle', () => this.renderBody());

    // Persist committed edits back into the local dataset so the re-render
    // shows the new value. Fires before commitEdit()'s renderBody() (the
    // editor dispatches synchronously), so data is current by render time.
    this.addEventListener('cell-edit-commit', ((e: CustomEvent) => {
      const { rowIndex, columnKey, newValue } = e.detail;
      const row = this.data[rowIndex];
      if (row) row[columnKey] = newValue;
      // A4: an in-place cell change can alter which rows match an active filter.
      // Row identity is unchanged, so the index map stays valid — only the
      // filtered snapshot must be dropped.
      this.invalidateFilteredCache();
      // Task B: the row object was mutated in place (same reference), so the
      // reconciler would reuse its stale cell DOM. Drop its cached <tr> so the
      // post-commit render rebuilds it with the new value.
      if (row) this.invalidateRenderedRow(row);
    }) as EventListener);

    this.addEventListener('row-edit-commit', ((e: CustomEvent) => {
      const { rowIndex, newRow } = e.detail;
      if (this.data[rowIndex]) this.data[rowIndex] = newRow;
      // A1/A4: an element was swapped in place (same array reference), so the
      // ref-check can't see it — resync the index map and filtered snapshot.
      this.rebuildRowIndex();
    }) as EventListener);

    // Wait for snice-column to be defined
    await customElements.whenDefined('snice-column');
    await customElements.whenDefined('snice-row');

    // Process slotted columns and rows
    await this.processSlottedContent();
    await (this as any).rendered;

    // Pre-connect property assignments do not invoke change-only watchers in
    // Snice. Configure grouping explicitly once initialization has applied
    // those values so `table.groupBy = ...` works before the element is added
    // to the document (React/story/programmatic creation path).
    this.syncGrouping();

    // Render controls after initial setup
    this.renderControls();

    // Initialize feature modules
    this.initializeModules();
    this.initColumnMenu();

    // Setup DnD
    if (this.rowReorder) this.rowDnD.attach(this);
    if (this.columnReorder) this.columnDnD.attach(this);

    // We are at the safe post-template point and all feature modules that
    // affect row/header construction are attached. Finish the initial paint
    // synchronously so the public `ready` promise includes pre-connect
    // grouping, DnD handles, keyboard ARIA, and aggregate footers.
    this.renderHeader();
    this.renderBody();

    // Setup virtualization if enabled
    if (this.virtualize) {
      requestAnimationFrame(() => {
        if (!this.virtualizer.isEnabled()) this.setupVirtualization();
      });
    }

    // Setup lazy loading
    if (this.lazyLoad) {
      requestAnimationFrame(() => this.setupLazyLoading());
    }

    // Listen for DnD events
    this.addEventListener('row-reorder', ((e: CustomEvent) => {
      const { fromIndex, toIndex } = e.detail;
      if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)
          || fromIndex < 0 || toIndex < 0
          || fromIndex >= this.data.length || toIndex >= this.data.length) return;
      if (fromIndex === toIndex) return;

      const selectedRows = this.selectedRows
        .map((index) => this.data[index])
        .filter((row) => row !== undefined);
      const expandedRows = Array.from(this.masterDetail.getExpandedRows())
        .map((index) => this.data[index])
        .filter((row) => row !== undefined);
      const item = this.data.splice(fromIndex, 1)[0];

      // A drop onto another group means reparenting the row. Group rendering
      // is derived from the groupBy fields, so merely changing raw array order
      // would make a cross-group drop visually snap back to its old group.
      // Copy the target leaf's grouping values before insertion so the rendered
      // result honors the user's actual drop target (all nested levels too).
      const targetBeforeRemoval = this.data[toIndex > fromIndex ? toIndex - 1 : toIndex];
      if (item && targetBeforeRemoval && this.grouping.hasGrouping()) {
        for (const key of this.grouping.getGroupByKeys()) {
          item[key] = targetBeforeRemoval[key];
        }
      }

      this.data.splice(toIndex, 0, item);
      this.data = [...this.data];
      this.selectedRows = selectedRows
        .map((row) => this.indexOfRow(row))
        .filter((index) => index >= 0);
      this.masterDetail.setExpandedRows(
        expandedRows.map((row) => this.indexOfRow(row)).filter((index) => index >= 0)
      );
    }) as EventListener);

    this.addEventListener('column-reorder', ((e: CustomEvent) => {
      const { fromKey, toKey } = e.detail;
      const fromIdx = this.columns.findIndex(c => c.key === fromKey);
      const toIdx = this.columnManager.getVisibleColumns().findIndex(c => c.key === toKey);
      if (fromIdx >= 0 && toIdx >= 0) {
        this.columnManager.moveColumn(fromKey, toIdx);
        this.renderHeader();
        this.renderBody();
      }
    }) as EventListener);

    // Listen for tree toggle
    this.addEventListener('tree-toggle', () => this.renderBody());

  }

  private async processSlottedContent() {
    // Get slotted column elements
    const columnElements = Array.from(this.querySelectorAll('snice-column[slot="columns"]')) as any[];
    const rowElements = Array.from(this.querySelectorAll('snice-row[slot="rows"]')) as any[];
    await Promise.all(rowElements.map((row) => row.ready));

    if (columnElements.length > 0) {
      // Extract column definitions from snice-column elements
      this.columns = columnElements.map((col: any) => col.getColumnDefinition());
    }

    // Pass declarative or programmatically assigned column definitions to rows.
    rowElements.forEach((row: any, index: number) => {
      row.columns = this.columns;
      row.index = index;
      row.hoverable = this.hoverable;
      row.clickable = this.clickable;
    });
    this.syncSlottedSelectionState();

    // Grouping/aggregation operates on the same model regardless of whether
    // rows came from a JS array or declarative <snice-row> children.
    if (this.shouldModelSlottedRows()) this.syncSlottedRowsIntoData();

    // Render the header for slotted mode (after next tick to ensure DOM is updated)
    if (columnElements.length > 0 && !this.shouldModelSlottedRows()) {
      requestAnimationFrame(() => this.renderSlottedHeader());
    }
  }

  /** Whether declarative rows need the full grouping/aggregation table model. */
  private shouldModelSlottedRows(): boolean {
    const keys = Array.isArray(this.groupBy) ? this.groupBy : (this.groupBy ? [this.groupBy] : []);
    return keys.some(Boolean) || this.columns.some((column) => column.aggregate != null);
  }

  /** Copy declarative row data into the table model without parsing markup. */
  private syncSlottedRowsIntoData() {
    const rowElements = Array.from(this.querySelectorAll('snice-row[slot="rows"]')) as any[];
    if (rowElements.length === 0) return;

    const rows = rowElements.map((row) => {
      if (row.data && Object.keys(row.data).length > 0) return row.data;
      const serialized = row.getAttribute('data');
      if (serialized) {
        try { return JSON.parse(serialized); }
        catch { /* snice-row's data-* extraction remains the fallback */ }
      }
      return row.data ?? {};
    });
    this.data = rows;
  }

  private renderSlottedHeader() {
    const headerContainer = this.shadowRoot?.querySelector('#slotted-header');
    if (!headerContainer || this.columns.length === 0) return;

    // Render column headers as DOM/text, never parsed definition markup.
    headerContainer.replaceChildren();
    for (const column of this.columns) {
      const cell = document.createElement('div');
      cell.className = 'header-cell';
      cell.textContent = column.label ?? column.key;
      headerContainer.appendChild(cell);
    }
  }

  /** Keep declarative column definitions reactive, including aggregate. */
  @on('column-changed')
  private handleDeclarativeColumnChange() {
    const columnElements = Array.from(this.querySelectorAll('snice-column[slot="columns"]')) as any[];
    if (columnElements.length === 0) return;
    this.columns = columnElements.map((column) => column.getColumnDefinition());

    // Ungrouped declarative rows stay in their light-DOM rendering path, so
    // they do not consume the native table render scheduled by the columns
    // watcher. Keep their model and header synchronized explicitly. When a new
    // aggregate switches the table to native mode the watcher instead copies
    // row data into the shared model.
    const rowElements = Array.from(this.querySelectorAll('snice-row[slot="rows"]')) as any[];
    rowElements.forEach((row) => { row.columns = this.columns; });
    requestAnimationFrame(() => {
      if (!this.shouldModelSlottedRows()) this.renderSlottedHeader();
      this.renderControls();
    });
  }


  @watch('selectorOptions')
  handleSelectorOptionsChange() {
    // Update CSS class to show/hide selector
    if (this.selectorOptions.length === 0) {
      this.classList.add('selector-options-empty');
    } else {
      this.classList.remove('selector-options-empty');
    }
  }

  @watch('sortable')
  handleSortableChange() {
    this.renderHeader(); // Re-render header to show/hide sort indicators
  }

  @watch('selectable')
  handleSelectableChange() {
    this.render(); // Re-render both header and body for checkbox columns
    queueMicrotask(() => this.syncSlottedSelectionState());
  }

  // C1: reactive columns. A new column set can change cell types/formatting
  // without changing keys (which the row signature keys on), so drop the
  // recycler map and resync the column model before the header renders. All DOM
  // construction is deferred to the coalescing queue (setter-stack landmine).
  @watch('columns', { immediate: false })
  handleColumnsAssignment() {
    this.renderedRows = new Map();
    if (this.columns.length > 0) this.columnManager.initialize(this.columns, this);
    // F: a column set change can add/remove an `aggregate` — resync the grouping
    // model's aggregator list and drop its stale flattened snapshot.
    this.grouping.setColumns(this.columns);
    this.invalidateGroupingCache();
    const hasSlottedRows = !!this.querySelector('snice-row[slot="rows"]');
    const modelSlottedRows = this.shouldModelSlottedRows();
    if (hasSlottedRows
        && this.virtualizer.isEnabled()
        && !!this.shadowRoot?.querySelector('table') !== modelSlottedRows) {
      this.virtualizer.detach();
    }
    if (modelSlottedRows) this.syncSlottedRowsIntoData();
    if (hasSlottedRows) {
      requestAnimationFrame(() => {
        if (!modelSlottedRows) this.renderSlottedHeader();
        this.renderControls();
        if (this.toolbarOptions) this.setToolbar(this.toolbarOptions);
        if (this.lazyLoad) this.setupLazyLoading();
      });
    }
    this.scheduleRender('both');
  }

  // F: reactive groupBy. Post-mount `table.groupBy = 'department'` reconfigures
  // the grouping model and re-renders through the coalescing queue. immediate:
  // false so the initial value doesn't kick a render (the columns/data watchers
  // drive the first paint). No synchronous cell construction here — scheduleRender
  // defers to a microtask (happy-dom constructor landmine).
  @watch('groupBy', 'groupDefaults', { immediate: false })
  handleGroupByChange() {
    this.syncGrouping();
    const hasSlottedRows = !!this.querySelector('snice-row[slot="rows"]');
    const modelSlottedRows = this.shouldModelSlottedRows();
    if (hasSlottedRows
        && this.virtualizer.isEnabled()
        && !!this.shadowRoot?.querySelector('table') !== modelSlottedRows) {
      this.virtualizer.detach();
    }
    if (modelSlottedRows) {
      this.syncSlottedRowsIntoData();
    }
    if (hasSlottedRows) {
      requestAnimationFrame(() => {
        // Clearing the last model feature switches the structural template
        // back to slotted mode; either direction replaces the controls.
        if (!modelSlottedRows) this.renderSlottedHeader();
        this.renderControls();
        if (this.toolbarOptions) this.setToolbar(this.toolbarOptions);
        if (this.lazyLoad) this.setupLazyLoading();
      });
    }
    this.scheduleRender(hasSlottedRows ? 'both' : 'body');
  }

  // F: push the current groupBy/groupDefaults into the grouping model and drop
  // the flattened cache. Called from the watch and before the first render.
  private syncGrouping() {
    const keys = Array.isArray(this.groupBy)
      ? this.groupBy.filter(Boolean)
      : (this.groupBy ? [this.groupBy] : []);
    this.grouping.configure({ groupBy: keys, defaultExpanded: this.groupDefaults?.expanded !== false });
    this.grouping.setColumns(this.columns);
    this.invalidateGroupingCache();
  }

  // C1: reactive data. `table.data = rows` refreshes the unsortedData snapshot
  // and the row-index map, then renders the body. The internal sort path
  // (sortLocalData) reassigns this.data with a re-sorted view of the SAME rows
  // and owns its own snapshot/render — settingSortedData tells us to skip.
  @watch('data', { immediate: false })
  handleDataAssignment() {
    if (this.settingSortedData) return;
    this.unsortedData = [...this.data];
    this.rebuildRowIndex();
    this.masterDetail.prepare(this.data);
    if (this.settingDataImperative) return; // imperative setData(): caller renders
    this.scheduleRender('body');
  }

  @watch('loading')
  handleDataChange() {
    this.renderBody();
  }

  @watch('selectedRows')
  handleSelectedRowsChange(oldVal?: number[], newVal?: number[]) {
    // A2: selection is a @property, so every reassignment lands here — the
    // single source of truth for reflecting selection into the DOM. Touch only
    // the rows whose membership actually changed (symmetric difference of old
    // vs new), not every rendered <tr>. A single toggle updates one row; a
    // select-all/clear-all naturally updates every changed row.
    const oldSet = new Set(oldVal ?? []);
    const newSet = new Set(newVal ?? this.selectedRows ?? []);
    const changed = new Set<number>();
    for (const i of oldSet) if (!newSet.has(i)) changed.add(i);
    for (const i of newSet) if (!oldSet.has(i)) changed.add(i);

    for (const i of changed) this.updateRowSelectionStateFor(i, newSet.has(i));
    this.updateSelectAllState();
    // F: a data-row toggle must refresh its group header's all/some/none state.
    this.updateGroupSelectionStates();
  }

  @watch('selectionMode', { immediate: false })
  handleSelectionModeChange() {
    if (this.selectionMode === 'none') {
      this.selectedRows = [];
      this.selectionAnchor = null;
    } else if (this.selectionMode === 'single' && this.selectedRows.length > 1) {
      this.selectedRows = this.selectedRows.slice(0, 1);
      this.selectionAnchor = this.data[this.selectedRows[0]] ?? null;
    }
    this.syncSlottedSelectionState();
    // The selection mode changes the tool-column structure (none has no
    // checkbox column; single has row checkboxes but no select-all control).
    this.scheduleRender('both');
  }

  @watch('currentSort')
  handleSortChange() {
    this.renderHeader();
  }

  @watch('searchable', 'filterable', 'quickFilter')
  handleControlsChange() {
    this.renderControls();
    if (this.quickFilter) this.scheduleRender('body');
  }

  // ── C2: controlled-state props. Assigning any of these post-mount routes to
  // the same effect its imperative setter produces, rendering through the
  // coalescing queue. immediate:false so the initial value never kicks a render
  // (the initial render is driven by the other immediate watchers).

  // A controlled `currentSort` must actually re-sort (local) or re-request
  // (remote) — the sibling handleSortChange only repaints the arrows.
  @watch('currentSort', { immediate: false })
  handleControlledSort() {
    if (this.mode === 'remote') this.debouncedDataRequest();
    else this.sortLocalData();
  }

  @watch('currentPage', { immediate: false })
  handleCurrentPageChange() {
    if (this.paginationMode === 'server' && this.mode === 'remote') this.debouncedDataRequest();
    else this.scheduleRender('body');
  }

  @watch('pageSize', { immediate: false })
  handlePageSizeChange() {
    this.currentPage = 1;
    if (this.paginationMode === 'server' && this.mode === 'remote') this.debouncedDataRequest();
    else this.scheduleRender('body');
  }

  @watch('density', { immediate: false })
  handleDensityChange() {
    // The density attribute reflects automatically (drives the CSS); the body
    // rebuilds because density is part of the row signature.
    this.scheduleRender('body');
    this.dispatchDensityChange();
  }

  @watch('list', { immediate: false })
  handleListChange() {
    this.renderedRows = new Map();
    this.scheduleRender('body');
  }

  @watch('editable', { immediate: false })
  handleEditableChange() {
    if (this.editable) this.setupEditor();
    this.scheduleRender('body');
  }

  @watch('editMode', { immediate: false })
  handleEditModeChange() {
    if (this.editable) this.editor.setEditMode(this.editMode);
    this.scheduleRender('body');
  }

  @watch('virtualize', { immediate: false })
  handleVirtualizeChange() {
    // renderBody self-heals virtualization (enables the virtualizer when
    // requested); turning it off detaches so the normal path takes over.
    if (!this.virtualize) this.virtualizer.detach();
    this.scheduleRender('body');
  }

  @watch('rowHeight', { immediate: false })
  handleRowHeightChange() {
    this.scheduleRender('body');
  }

  @watch('columnResize', { immediate: false })
  handleColumnResizeChange() {
    this.scheduleRender('header');
  }

  @watch('headerFilters', { immediate: false })
  handleHeaderFiltersChange() {
    this.scheduleRender('header');
  }

  @watch('rowReorder', { immediate: false })
  handleRowReorderChange() {
    if (this.rowReorder) this.rowDnD.attach(this);
    else this.rowDnD.detach();
    this.scheduleRender('both');
  }

  @watch('columnReorder', { immediate: false })
  handleColumnReorderChange() {
    if (this.columnReorder) this.columnDnD.attach(this);
    else this.columnDnD.detach();
    this.scheduleRender('header');
  }

  @watch('lazyLoad', 'lazyLoadThreshold', { immediate: false })
  handleLazyLoadChange() {
    if (this.lazyLoad) {
      queueMicrotask(() => this.setupLazyLoading());
    } else {
      if (this.lazyLoadHandler) this.lazyLoadContainer?.removeEventListener('scroll', this.lazyLoadHandler);
      this.lazyLoadHandler = null;
      this.lazyLoadContainer = null;
    }
  }

  @watch('columnMenu', { immediate: false })
  handleColumnMenuChange() {
    if (this.columnMenu) this.initColumnMenu();
    this.scheduleRender('header');
  }

  /** Column definitions in their actual painted order. Column state owns
   * visibility/order; pinned columns are partitioned to their physical edges
   * so right-pinned cells do not overlap later unpinned columns. */
  private getVisibleColumnDefinitions(): ColumnDefinition[] {
    if (this.columnManager.getAllStates().length === 0) return this.columns;
    const states = [
      ...this.columnManager.getPinnedLeft(),
      ...this.columnManager.getUnpinned(),
      ...this.columnManager.getPinnedRight(),
    ];
    const byKey = new Map(this.columns.map((column) => [column.key, column]));
    return states
      .map((state) => byKey.get(state.key))
      .filter((column): column is ColumnDefinition => !!column);
  }

  renderHeader() {
    if (!this.thead) return;
    
    const headerRow = document.createElement('tr');
    headerRow.className = 'column-header-row';

    // Tool column headers — must match createRow order
    if (this.rowReorder && this.rowDnD.isEnabled()) {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.className = 'drag-handle-cell';
      headerRow.appendChild(th);
    }

    if (this.masterDetail.isEnabled()) {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.className = 'detail-toggle-cell';
      headerRow.appendChild(th);
    }

    if (this.hasSelectionColumn()) {
      const selectCell = document.createElement('th');
      selectCell.setAttribute('scope', 'col');
      selectCell.className = 'select-column';
      if (this.selectionMode === 'multiple') {
        const filteredIndices = this.getSelectableIndices(this.getFilteredData());
        const selectedInFiltered = filteredIndices.filter(i => this.selectedRows.includes(i));
        const allSelected = selectedInFiltered.length === filteredIndices.length && filteredIndices.length > 0;
        const someSelected = selectedInFiltered.length > 0 && selectedInFiltered.length < filteredIndices.length;
        selectCell.innerHTML = `<snice-checkbox class="select-all" size="small" compact ${allSelected ? 'checked' : ''}></snice-checkbox>`;

        // Set indeterminate after insertion.
        setTimeout(() => {
          const checkbox = selectCell.querySelector('.select-all') as HTMLInputElement;
          if (checkbox) checkbox.indeterminate = someSelected;
        }, 0);
      } else {
        selectCell.setAttribute('aria-label', 'Select one row');
      }
      headerRow.appendChild(selectCell);
    }

    const visibleColumns = this.getVisibleColumnDefinitions();

    visibleColumns.forEach(column => {

      const th = document.createElement('th');
      th.setAttribute('data-key', column.key);
      th.setAttribute('scope', 'col');
      // Reflect current sort direction for SR users.
      if (this.sortable && column.sortable !== false) {
        const sortState = this.currentSort.find(s => s.column === column.key);
        if (sortState?.direction === 'asc') th.setAttribute('aria-sort', 'ascending');
        else if (sortState?.direction === 'desc') th.setAttribute('aria-sort', 'descending');
        else th.setAttribute('aria-sort', 'none');
      }

      // Apply column width
      const state = this.columnManager.getState(column.key);
      if (state) {
        th.style.width = `${state.width}px`;

        // Pinned column sticky positioning
        if (state.pinned === 'left') {
          const offsets = this.columnManager.getPinnedLeftOffsets();
          th.classList.add('pinned-cell');
          th.style.position = 'sticky';
          th.style.left = `${offsets.get(column.key) ?? 0}px`;
          th.style.zIndex = '2';
        } else if (state.pinned === 'right') {
          const offsets = this.columnManager.getPinnedRightOffsets();
          th.classList.add('pinned-cell');
          th.style.position = 'sticky';
          th.style.right = `${offsets.get(column.key) ?? 0}px`;
          th.style.zIndex = '2';
        }
      }

      if (this.sortable && column.sortable !== false) {
        th.classList.add('sortable');
        th.setAttribute('role', 'button');
        // A role=button must be focusable and named, or the keyboard cannot
        // sort at all. Matches the declarative header in snice-header.ts.
        th.setAttribute('tabindex', '0');
        th.setAttribute('aria-label', `Sort by ${column.label}`);
        th.innerHTML = this.renderSortableHeader(column);
      } else {
        th.textContent = column.label;
      }

      // Filter indicator
      if (this.filterEngine.hasColumnFilter(column.key)) {
        th.classList.add('filtered');
      }

      // Resize handle
      if (this.columnResize && column.resizable !== false) {
        const handle = document.createElement('span');
        handle.className = 'resize-handle';
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.columnManager.startResize(column.key, e.clientX);
        });
        handle.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          if (this.tbody) {
            this.columnManager.autoSizeColumn(column.key, this.tbody);
            this.renderHeader();
            this.renderBody();
          }
        });
        th.appendChild(handle);
        // No inline position:relative here — inline styles outrank the
        // stylesheet and would stomp the sticky header (thead th) and
        // pinned-column sticky positioning. `position: sticky` is itself a
        // positioned ancestor, so the absolutely-positioned resize handle
        // anchors correctly without it.
      }

      // Column menu (right-click)
      if (this.columnMenu) {
        th.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          const colState = this.columnManager.getState(column.key);
          this.columnMenuManager.show(column.key, e.clientX, e.clientY, {
            sortable: this.sortable && column.sortable !== false,
            filterable: column.filterable !== false,
            hideable: colState?.hideable,
            pinnable: colState?.pinnable,
            pinned: colState?.pinned,
          });
        });
      }

      // Column DnD
      if (this.columnReorder && this.columnDnD.isEnabled()) {
        // A pinned column has a fixed physical edge. Presenting it as draggable
        // would emit a reorder event that the column manager correctly ignores.
        this.columnDnD.makeHeaderDraggable(th, column.key, column.reorderable !== false && !state?.pinned);
      }

      headerRow.appendChild(th);
    });

    this.thead.innerHTML = '';

    // Column groups header row (if any)
    const groups = this.columnManager.getColumnGroups();
    if (groups.length > 0) {
      const groupRow = document.createElement('tr');
      groupRow.className = 'column-group-row';
      // Tool-column spacers must line up with the equivalent cells in the main
      // header row before the grouped data-column runs.
      const toolColumnClasses = [
        this.rowReorder && this.rowDnD.isEnabled() ? 'drag-handle-cell' : '',
        this.masterDetail.isEnabled() ? 'detail-toggle-cell' : '',
        this.hasSelectionColumn() ? 'select-column' : '',
      ].filter(Boolean);
      for (const className of toolColumnClasses) {
        const spacer = document.createElement('th');
        spacer.className = className;
        spacer.setAttribute('aria-hidden', 'true');
        groupRow.appendChild(spacer);
      }
      const groupedHeaders = document.createElement('template');
      groupedHeaders.innerHTML = this.columnManager.renderGroupHeaders(
        visibleColumns.map((column) => column.key)
      );
      groupRow.appendChild(groupedHeaders.content);
      this.thead.appendChild(groupRow);
    }

    this.thead.appendChild(headerRow);

    // Header filter row (if enabled)
    if (this.headerFilters) {
      const filterRow = document.createElement('tr');
      filterRow.className = 'header-filter-row';

      if (this.rowReorder && this.rowDnD.isEnabled()) {
        const spacer = document.createElement('td');
        spacer.className = 'drag-handle-cell';
        filterRow.appendChild(spacer);
      }
      if (this.masterDetail.isEnabled()) {
        const spacer = document.createElement('td');
        spacer.className = 'detail-toggle-cell';
        filterRow.appendChild(spacer);
      }
      if (this.hasSelectionColumn()) {
        const spacer = document.createElement('td');
        spacer.className = 'select-column';
        filterRow.appendChild(spacer);
      }

      visibleColumns.forEach(column => {
        const td = document.createElement('td');
        const input = document.createElement('snice-input') as any;
        input.size = 'small';
        input.placeholder = `Filter ${column.label}...`;
        input.setAttribute('data-column', column.key);
        input.value = this.filterEngine.getHeaderFilter(column.key);
        input.style.cssText = 'width:100%;--snice-color-border:transparent;--snice-border-radius-md:0;';
        input.addEventListener('input', () => {
          // A3: engine model updates synchronously (cheap); the expensive
          // re-filter + re-render is debounced so a keystroke burst is one apply.
          this.filterEngine.setHeaderFilter(column.key, input.value);
          this.debouncedApplyClientFilters();
        });
        td.appendChild(input);
        filterRow.appendChild(td);
      });

      this.thead.appendChild(filterRow);
    }
  }

  renderSortableHeader(column: any): string {
    const sortItem = this.currentSort.find(s => s.column === column.key);
    const sortIndex = this.currentSort.findIndex(s => s.column === column.key);
    const isActive = !!sortItem;

    const chevronUp = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5l4-4 4 4"/></svg>`;
    const chevronDown = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l4 4 4-4"/></svg>`;

    let indicator = `<span style="display:flex;flex-direction:column;gap:0;opacity:0.3">${chevronUp}${chevronDown}</span>`;
    let orderNumber = '';

    if (sortItem) {
      if (sortItem.direction === 'asc') {
        indicator = chevronUp;
      } else if (sortItem.direction === 'desc') {
        indicator = chevronDown;
      }

      if (this.currentSort.length > 1) {
        orderNumber = `<span class="sort-order">${sortIndex + 1}</span>`;
      }
    }

    const indicatorClasses = ['sort-indicator', isActive ? 'active' : ''].filter(Boolean).join(' ');

    return `
      <div class="sort-header">
        <span>${column.label}</span>
        <div class="${indicatorClasses}">
          ${indicator}
          ${orderNumber}
        </div>
      </div>
    `;
  }


  renderBody() {
    if (!this.tbody) return;

    // Update column manager when columns change
    if (this.columns.length > 0) {
      this.columnManager.initialize(this.columns, this);
    }

    // F: keep the grouping model's aggregator list current before any
    // isEnabled() check below — isEnabled() reports aggregation-only tables too,
    // and setColumns is what tells it which columns aggregate.
    if (this.grouping.setColumns(this.columns)) this.invalidateGroupingCache();

    // In grouped client-pagination mode the public total is the flattened
    // display model (headers + visible rows + aggregate footers), including on
    // the virtual path which returns before the ordinary pagination block.
    if (this.pagination && this.paginationMode === 'client') {
      if (this.usesGroupingDisplayModel()) {
        this.totalItems = this.getGroupingItems().length;
      } else if (this.treeData.isEnabled()) {
        this.totalItems = this.getTreeDisplayRows(false).length;
      }
    }

    // Self-heal: virtualize requested but the virtualizer never enabled
    // (property assigned after @ready, or the one-shot rAF setup missed the
    // scroll container). Never fall through to an empty or full render.
    if (this.virtualize && !this.virtualizer.isEnabled()) {
      this.setupVirtualization();
    }

    // Virtualized rendering: delegate to virtualizer. Total row count comes
    // from the feature-aware model (flattened tree rows when tree data is on),
    // NOT the raw filtered data — otherwise the virtualizer windows the wrong
    // dataset and expand/collapse silently no-ops.
    if (this.virtualize && this.virtualizer.isEnabled()) {
      this.virtualRowsSnapshot = this.getVirtualRows();
      this.virtualizer.setTotalRows(this.virtualRowsSnapshot.length);
      // The virtualizer's afterRender hook re-establishes grid ARIA/focus on
      // the freshly inserted window.

      // Still render pagination
      if (this.pagination) this.renderPagination();
      return;
    }

    if (this.data.length === 0 && this.columns.length > 0) {
      // Empty / loading / error states replace the body with a single message
      // row. Reset the recycler map so a later data render starts from a clean
      // slate (no stale reuse candidates pointing at removed rows).
      this.tbody.innerHTML = '';
      this.renderedRows = new Map();

      const toolCols = (this.hasSelectionColumn() ? 1 : 0)
        + (this.masterDetail.isEnabled() ? 1 : 0)
        + (this.rowReorder && this.rowDnD.isEnabled() ? 1 : 0);
      const colSpan = this.columns.length + toolCols;

      if (this.loading) {
        // Show loading spinner
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colSpan;
        td.className = 'no-data';
        td.innerHTML = '<snice-progress variant="circular" indeterminate size="small"></snice-progress>';
        tr.appendChild(td);
        this.tbody.appendChild(tr);
        return;
      } else if (this.loadError) {
        // Show error state — surfaces a failed remote load instead of
        // silently falling through to the generic "No data" empty state.
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colSpan;
        td.className = 'no-data';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'table-error-message';
        errorDiv.textContent = `⚠️ ${this.loadError}`;
        td.appendChild(errorDiv);
        tr.appendChild(td);
        this.tbody.appendChild(tr);
        return;
      } else {
        // Show empty state
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colSpan;
        td.className = 'no-data';
        const slotted = this.querySelector('[slot="empty-state"]');
        if (slotted) {
          td.appendChild(slotted.cloneNode(true));
        } else {
          const empty = document.createElement('snice-empty-state');
          empty.setAttribute('size', 'small');
          empty.setAttribute('icon', '📭');
          empty.setAttribute('title', 'No data');
          empty.setAttribute('description', 'No records to display.');
          td.appendChild(empty);
        }
        tr.appendChild(td);
        this.tbody.appendChild(tr);
        return;
      }
    }

    // Apply client-side filters (cached snapshot — see getFilteredData).
    const filteredData = this.getFilteredData();

    // Client-side pagination: slice ordinary data. Group and tree modes page
    // their own flattened models and already set totalItems above; overwriting
    // it here with the raw filtered-row count made public state differ between
    // virtual and non-virtual rendering.
    let displayData = filteredData;
    if (this.pagination && this.paginationMode === 'client'
        && !this.usesGroupingDisplayModel() && !this.treeData.isEnabled()) {
      this.totalItems = filteredData.length;
      const startIndex = (this.currentPage - 1) * this.pageSize;
      displayData = filteredData.slice(startIndex, startIndex + this.pageSize);
    }

    const extraCols = (this.hasSelectionColumn() ? 1 : 0) + (this.masterDetail.isEnabled() ? 1 : 0) + (this.rowReorder && this.rowDnD.isEnabled() ? 1 : 0);
    const managedColumns = this.columnManager.getAllStates();
    const visibleColumnCount = managedColumns.length > 0
      ? this.columnManager.getVisibleColumns().length
      : this.columns.length;
    const totalColSpan = visibleColumnCount + extraCols;
    const structuralSig = this.computeStructuralSig();

    // Task B: describe the desired body as an ordered list of keyed entries,
    // then reconcile the tbody to match. Rows whose object + signature are
    // unchanged are reused (moved on reorder); only new/changed rows construct
    // fresh DOM. Replaces the old wipe-and-rebuild-everything path.
    const entries: RowEntry[] = [];

    // Pinned top rows — few, and rebuilt each pass under a positional key.
    this.pinnedTopRows.forEach((row, i) => {
      entries.push({
        key: `__pinned_top_${i}`,
        sig: 'pinned',
        alwaysRebuild: true,
        create: () => {
          const tr = this.createRow(row, -1);
          tr.classList.add('pinned-row', 'pinned-row--top');
          return tr;
        },
      });
    });

    if (this.usesGroupingDisplayModel()) {
      // F: page over the FLATTENED group+row+aggregate list (built from the full
      // filtered data — grouping must see every row, not a pre-sliced page).
      const items = this.getDisplayedGroupingItems();

      for (const item of items) {
        if (item.type === 'group') {
          entries.push({
            key: item.key,
            // Group + aggregate rows are few; rebuild them each pass so their
            // count / expanded / selection / aggregate state is always fresh
            // (perf-critical recycling is for the many DATA rows below).
            sig: `${structuralSig}|grp:${item.key}:${item.expanded ? 1 : 0}:${item.count}`,
            alwaysRebuild: true,
            create: () => this.createGroupRow(item, totalColSpan),
          });
        } else if (item.type === 'aggregate') {
          entries.push({
            key: item.key,
            sig: `${structuralSig}|agg:${item.key}`,
            alwaysRebuild: true,
            create: () => this.createAggregateRow(item, totalColSpan),
          });
        } else {
          // Data row — index is its position in `this.data`, not the flattened
          // list (selection / editing / data-index all key off the data index).
          const index = this.indexOfRow(item.data);
          const editing = this.isRowEditing(index);
          entries.push({
            key: item.data,
            sig: this.rowSignature(item.data, index, structuralSig) + (editing ? '|edit' : ''),
            alwaysRebuild: editing,
            restampIndex: index,
            create: () => this.createRow(item.data, index),
          });

          // Grouping/aggregation must compose with master-detail exactly like
          // the ordinary and virtual paths. Aggregation-only mode also routes
          // through this branch, so omitting this entry made enabling a footer
          // silently remove every expanded detail panel.
          if (this.masterDetail.isEnabled() && this.masterDetail.isExpanded(index)) {
            entries.push({
              key: `__detail_${index}`,
              sig: 'detail',
              alwaysRebuild: true,
              create: () =>
                this.masterDetail.createDetailRow(item.data, index, totalColSpan) ??
                document.createElement('tr'),
            });
          }
        }
      }
    } else if (this.treeData.isEnabled()) {
      const treeRows = this.getTreeDisplayRows(true);
      treeRows.forEach(({ data: rowData, index, treeRow, groupItem }) => {
        if (groupItem?.type === 'aggregate') {
          entries.push({
            key: groupItem.key,
            sig: `${structuralSig}|agg:${groupItem.key}`,
            alwaysRebuild: true,
            create: () => this.createAggregateRow(groupItem, totalColSpan),
          });
          return;
        }
        if (!treeRow) return;
        const editing = this.isRowEditing(index);
        entries.push({
          key: rowData,
          // The edit marker makes the editing→display transition a signature
          // change, so a row leaving edit state rebuilds (drops its editor DOM).
          sig: this.rowSignature(rowData, index, structuralSig, treeRow) + (editing ? '|edit' : ''),
          alwaysRebuild: editing,
          restampIndex: index,
          create: () => this.createRow(rowData, index, treeRow),
        });
      });
    } else {
      displayData.forEach((rowData) => {
        const index = this.indexOfRow(rowData);
        const editing = this.isRowEditing(index);
        entries.push({
          key: rowData,
          sig: this.rowSignature(rowData, index, structuralSig) + (editing ? '|edit' : ''),
          alwaysRebuild: editing,
          restampIndex: index,
          create: () => this.createRow(rowData, index),
        });

        // Detail row (master-detail): shape depends on state, always rebuilt.
        if (this.masterDetail.isEnabled() && this.masterDetail.isExpanded(index)) {
          entries.push({
            key: `__detail_${index}`,
            sig: 'detail',
            alwaysRebuild: true,
            create: () =>
              this.masterDetail.createDetailRow(rowData, index, totalColSpan) ??
              document.createElement('tr'),
          });
        }
      });
    }

    // Pinned bottom rows
    this.pinnedBottomRows.forEach((row, i) => {
      entries.push({
        key: `__pinned_bottom_${i}`,
        sig: 'pinned',
        alwaysRebuild: true,
        create: () => {
          const tr = this.createRow(row, -1);
          tr.classList.add('pinned-row', 'pinned-row--bottom');
          return tr;
        },
      });
    });

    this.reconcileRows(entries);

    // Re-establish grid role + roving tabindex after the body changed.
    this.keyboard.refresh();

    // Render pagination after body
    if (this.pagination) {
      this.renderPagination();
    }
  }

  // ── Task B: render-path reconciler ──────────────────────────────────────
  //
  // Reconcile the tbody's children to `entries` (an ordered list) while reusing
  // existing <tr> elements keyed by identity. Mirrors the keyed-move algorithm
  // in src/parts.ts `_reconcileKeyed`: drop departed rows first, then walk the
  // survivors placing each desired row, moving out-of-position ones via a
  // detach-into-fragment step (avoids the happy-dom stale-querySelectorAll bug
  // that an in-place insertBefore move triggers). Stationary rows are never
  // touched, so an unchanged re-render performs zero moves and constructs zero
  // cells.
  private reconcileRows(entries: RowEntry[]) {
    const tbody = this.tbody;
    if (!tbody) return;

    const next = new Map<unknown, { el: HTMLElement; sig: string }>();
    const desired: HTMLElement[] = [];
    const used = new Set<HTMLElement>();

    for (const entry of entries) {
      const prev = this.renderedRows.get(entry.key);
      let el: HTMLElement;

      if (prev && !used.has(prev.el) && !entry.alwaysRebuild && prev.sig === entry.sig) {
        // Reuse the existing element. A reorder may have changed its logical
        // index without changing its signature — re-stamp index-derived DOM.
        el = prev.el;
        if (entry.restampIndex !== undefined) this.restampRowIndex(el, entry.restampIndex);
      } else {
        el = entry.create();
      }

      used.add(el);
      desired.push(el);
      // First occurrence wins on a duplicate key (matches rowIndexMap / _reconcileKeyed).
      if (!next.has(entry.key)) next.set(entry.key, { el, sig: entry.sig });
    }

    // Remove any current child that is not part of the desired set (departed
    // rows, plus a prior empty/loading/error message row).
    const desiredSet = new Set(desired);
    for (const child of Array.from(tbody.children)) {
      if (!desiredSet.has(child as HTMLElement)) child.remove();
    }

    // Place desired rows in order. `ref` walks the surviving children; a row
    // already sitting at `ref` is skipped, anything else is moved/inserted here.
    let ref: Node | null = tbody.firstChild;
    for (const el of desired) {
      if (el === ref) {
        ref = el.nextSibling;
      } else {
        const frag = document.createDocumentFragment();
        frag.appendChild(el); // detaches el from its old position (if any)
        tbody.insertBefore(frag, ref);
      }
    }

    this.renderedRows = next;
  }

  /**
   * A structural fingerprint of everything `createRow` reads that is NOT
   * per-row data: visible columns + their widths/pinning/offsets, tool columns,
   * density, uniform row height, tree group column. A change here (resize, pin,
   * hide/show, density) forces every row to rebuild, since a reused element
   * would carry stale layout.
   */
  // E2: stable identity for a custom renderer function, so computeStructuralSig
  // can encode "which renderer" without stringifying the function. A new
  // function reference gets a new id → the structural signature changes →
  // reused rows rebuild.
  private rendererIds = new WeakMap<object, number>();
  private rendererIdSeq = 0;
  private rendererIdFor(fn?: unknown): string {
    if (typeof fn !== 'function') return '';
    let id = this.rendererIds.get(fn as object);
    if (id === undefined) {
      id = ++this.rendererIdSeq;
      this.rendererIds.set(fn as object, id);
    }
    return String(id);
  }

  private computeStructuralSig(): string {
    const cols = this.getVisibleColumnDefinitions().map(col => {
      const state = this.columnManager.getState(col.key);
      // E2: fold each column's custom renderer identity in so swapping a
      // renderCell function invalidates every reused row (Task B recycling).
      const rc = this.rendererIdFor((col as any).renderCell);
      return `${col.key}:${state?.width ?? ''}:${state?.pinned ?? ''}:rc${rc}`;
    });

    return [
      cols.join(','),
      `pl=${Array.from(this.columnManager.getPinnedLeftOffsets().values()).join('/')}`,
      `pr=${Array.from(this.columnManager.getPinnedRightOffsets().values()).join('/')}`,
      `sel=${this.selectable ? this.selectionMode : 'off'}`,
      `selectable=${this.rendererIdFor(this.selectabilityCheck)}`,
      `md=${this.masterDetail.isEnabled() ? 1 : 0}`,
      `rr=${this.rowReorder && this.rowDnD.isEnabled() ? 1 : 0}`,
      `rh=${this.rowHeight}`,
      `d=${this.density}`,
      `tree=${this.treeData.isEnabled() ? this.treeData.getGroupColumn() : ''}`,
    ].join('|');
  }

  /**
   * The per-row rebuild signature. Selection and the plain data-index are
   * re-stamped on reuse (not here) so they never force a rebuild; this captures
   * only what a re-stamp cannot repair: tree node state, per-row height, and —
   * when a feature embeds the index in a row-scoped closure (row DnD drag index,
   * master-detail toggle index) — the index itself.
   */
  private rowSignature(rowData: any, index: number, structuralSig: string, treeRow?: TreeRow): string {
    const parts = [structuralSig];
    if (treeRow) parts.push(`t:${treeRow.depth}:${treeRow.expanded ? 1 : 0}:${treeRow.hasChildren ? 1 : 0}`);
    if (this.rowHeightCallback) parts.push(`h:${this.rowHeightCallback(rowData, index)}`);
    if (this.masterDetail.isEnabled()) parts.push(`detail:${this.masterDetail.isExpanded(index) ? 1 : 0}`);
    // Features whose row DOM closes over the index must rebuild when it changes.
    if ((this.rowReorder && this.rowDnD.isEnabled()) || this.masterDetail.isEnabled()) {
      parts.push(`i:${index}`);
    }
    return parts.join('|');
  }

  /** Whether the row at `index` currently hosts an inline editor. */
  private isRowEditing(index: number): boolean {
    if (!this.editable) return false;
    if (this.editMode === 'row') {
      const rowState = this.editor.getRowEditState();
      return !!(rowState?.isEditing && rowState.rowIndex === index);
    }
    const cellState = this.editor.getCellEditState();
    return !!(cellState?.isEditing && cellState.rowIndex === index);
  }

  /**
   * Update a reused row's index-derived DOM after a reorder: the tr's
   * `data-index`, its selection reflection, and the select checkbox's
   * `data-row-index` (read back by the click/change handlers). Everything else
   * that depends on the index is captured by the signature and forces a rebuild.
   */
  private restampRowIndex(el: HTMLElement, index: number) {
    el.setAttribute('data-index', String(index));
    const isSelected = this.selectedRows.includes(index);
    el.setAttribute('data-selected', String(isSelected));
    const checkbox = el.querySelector('snice-checkbox.row-select') as any;
    if (checkbox) {
      checkbox.setAttribute('data-row-index', String(index));
      checkbox.checked = isSelected;
      const disabled = !!(this.selectabilityCheck && !this.selectabilityCheck(this.data[index], index));
      checkbox.disabled = disabled;
      checkbox.toggleAttribute('disabled', disabled);
    }
  }

  /**
   * Drop the cached <tr> for a row object so the next render rebuilds it. Used
   * when the table mutates a row in place (cell-edit commit) — the object
   * identity is unchanged, so the reconciler would otherwise reuse the stale
   * cell DOM.
   */
  private invalidateRenderedRow(rowData: any) {
    this.renderedRows.delete(rowData);
  }

  // F: the denominator for client-side pagination. When grouping/aggregation is
  // active the page unit is a FLATTENED display item (group/data/aggregate row),
  // not a raw data row — so pages cover the whole flattened list. Ungrouped
  // behavior is unchanged (data.length).
  private paginationTotal(): number {
    if (this.paginationMode !== 'client') return this.totalItems;
    if (this.usesGroupingDisplayModel()) return this.getGroupingItems().length;
    if (this.treeData.isEnabled()) return this.getTreeDisplayRows(false).length;
    return this.data.length;
  }

  private get totalPages(): number {
    const total = this.paginationTotal();
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, this.totalPages));
    if (clamped === this.currentPage) return;
    this.currentPage = clamped;

    if (this.paginationMode === 'server' && this.mode === 'remote') {
      this.debouncedDataRequest();
    } else {
      this.renderBody();
    }

    this.dispatchPageChange();
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;

    if (this.paginationMode === 'server' && this.mode === 'remote') {
      this.debouncedDataRequest();
    } else {
      this.renderBody();
    }

    this.dispatchPageChange();
  }

  @dispatch('page-change', { bubbles: true, composed: true })
  private dispatchPageChange() {
    return {
      page: this.currentPage,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      totalItems: this.paginationTotal()
    };
  }

  renderPagination() {
    const container = this.shadowRoot?.querySelector('.table-pagination-container');
    if (!container) return;

    if (!this.pagination) {
      container.innerHTML = '';
      return;
    }

    const total = this.paginationTotal();
    const totalPages = this.totalPages;
    const start = Math.min((this.currentPage - 1) * this.pageSize + 1, total);
    const end = Math.min(this.currentPage * this.pageSize, total);

    // Build page buttons
    const pageButtons: string[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageButtons.push(this.pageButton(i));
      }
    } else {
      pageButtons.push(this.pageButton(1));
      if (this.currentPage > 3) pageButtons.push('<span class="pagination__ellipsis">…</span>');

      const rangeStart = Math.max(2, this.currentPage - 1);
      const rangeEnd = Math.min(totalPages - 1, this.currentPage + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pageButtons.push(this.pageButton(i));
      }

      if (this.currentPage < totalPages - 2) pageButtons.push('<span class="pagination__ellipsis">…</span>');
      pageButtons.push(this.pageButton(totalPages));
    }

    container.innerHTML = '';

    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    pagination.setAttribute('part', 'pagination');

    // Info
    const info = document.createElement('div');
    info.className = 'pagination__info';
    info.textContent = `Showing ${start}\u2013${end} of ${total}`;
    pagination.appendChild(info);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'pagination__controls';
    controls.innerHTML = `
      <button class="pagination__btn pagination__first" ${this.currentPage <= 1 ? 'disabled' : ''} data-page="1" aria-label="First page">\u27E8\u27E8</button>
      <button class="pagination__btn pagination__prev" ${this.currentPage <= 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}" aria-label="Previous page">\u27E8</button>
      ${pageButtons.join('')}
      <button class="pagination__btn pagination__next" ${this.currentPage >= totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}" aria-label="Next page">\u27E9</button>
      <button class="pagination__btn pagination__last" ${this.currentPage >= totalPages ? 'disabled' : ''} data-page="${totalPages}" aria-label="Last page">\u27E9\u27E9</button>
    `;
    pagination.appendChild(controls);

    // Page size selector — use snice-select
    const sizeContainer = document.createElement('div');
    sizeContainer.className = 'pagination__size';
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Rows per page:';
    sizeContainer.appendChild(sizeLabel);

    const sizeSelect = document.createElement('snice-select') as any;
    sizeSelect.size = 'small';
    sizeSelect.className = 'pagination__size-select';
    // Always include the CURRENT pageSize: when it isn't in pageSizes (e.g.
    // pageSize=5 with the default list) no option matches the value and the
    // select shows its placeholder instead of the active size.
    const sizeOptions = this.pageSizes.includes(this.pageSize)
      ? this.pageSizes
      : [...this.pageSizes, this.pageSize].sort((a, b) => a - b);
    for (const s of sizeOptions) {
      const opt = document.createElement('snice-option') as any;
      opt.setAttribute('value', String(s));
      opt.textContent = String(s);
      if (s === this.pageSize) opt.setAttribute('selected', '');
      sizeSelect.appendChild(opt);
    }
    sizeSelect.value = String(this.pageSize);
    sizeContainer.appendChild(sizeSelect);
    pagination.appendChild(sizeContainer);

    container.appendChild(pagination);

    // Bind page button events
    controls.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt((btn as HTMLElement).getAttribute('data-page')!);
        this.goToPage(page);
      });
    });

    // Bind size select event
    sizeSelect.addEventListener('select-change', (e: CustomEvent) => {
      this.setPageSize(parseInt(e.detail.value));
    });
  }

  private pageButton(page: number): string {
    const active = page === this.currentPage ? ' pagination__btn--active' : '';
    return `<button class="pagination__btn pagination__page${active}" data-page="${page}">${page}</button>`;
  }

  /** Create a cell element safely using createElement + setAttribute */
  createCellElement(column: any, value: any, row?: any): HTMLElement {
    // E2: a custom renderCell bypasses the type-based cell entirely. A string
    // result is set via textContent (never innerHTML — no HTML parsing / XSS);
    // an HTMLElement is used as-is.
    if (typeof column.renderCell === 'function') {
      const rendered = column.renderCell(value, row, column);
      if (rendered instanceof HTMLElement) return rendered;
      const span = document.createElement('span');
      span.className = 'custom-cell';
      span.textContent = rendered == null ? '' : String(rendered);
      return span;
    }

    const tagName = this.getCellTagName(column.type);
    const el = document.createElement(tagName) as any;

    // Base attributes. Only force `align` if the column definition specifies
    // one; otherwise let the cell pick its type-appropriate default (numbers
    // right, rating/boolean center, text left). Hard-coding 'left' here fought
    // the cell's own type-based text-align and made number values drift.
    el.setAttribute('type', column.type || 'text');
    if (column.align) el.setAttribute('align', column.align);
    el.setAttribute('in-table', 'true');

    // Set the property directly so arrays/objects reach progress, sparkline,
    // JSON, action, and tag cells without a lossy attribute conversion. Keep a
    // primitive attribute for declarative inspection and CSS selectors.
    if (column.type === 'sparkline' && value !== null && typeof value === 'object') {
      el.setAttribute('value', JSON.stringify(value));
      if (Array.isArray(value)) el.data = value;
    } else {
      el.value = value ?? '';
    }
    if (value === null || typeof value !== 'object') {
      el.setAttribute('value', String(value ?? ''));
    }

    // Column definition as property (for formatter access etc.)
    el.column = column;
    // Row-aware formatters, conditional formatting, and action-cell events all
    // consume the originating row through the cell's property API.
    el.rowData = row ?? null;

    // Type-specific attributes
    switch (column.type) {
      case 'number':
      case 'currency': {
        if (column.decimals !== undefined) el.setAttribute('decimals', String(column.decimals));
        if (column.thousandsSeparator) el.setAttribute('thousands-separator', 'true');
        if (column.prefix) el.setAttribute('prefix', column.prefix);
        if (column.suffix) el.setAttribute('suffix', column.suffix);
        if (column.type === 'currency') {
          const cf = column.currencyFormat;
          if (cf) {
            if (cf.currency) el.setAttribute('currency', cf.currency);
            if (cf.locale) el.setAttribute('locale', cf.locale);
            if (cf.display || cf.currencyDisplay) {
              el.setAttribute('currencydisplay', cf.currencyDisplay || cf.display);
            }
            if (cf.decimals !== undefined) el.setAttribute('decimals', String(cf.decimals));
            if (cf.thousandsSeparator === false) el.thousandsSeparator = false;
          }
        }
        break;
      }
      case 'date':
        if (column.dateFormat) el.setAttribute('date-format', column.dateFormat);
        break;
      case 'boolean':
        if (column.useSymbols) el.setAttribute('use-symbols', 'true');
        if (column.trueSymbol) el.setAttribute('true-symbol', column.trueSymbol);
        if (column.falseSymbol) el.setAttribute('false-symbol', column.falseSymbol);
        if (column.trueValue) el.setAttribute('true-value', column.trueValue);
        if (column.falseValue) el.setAttribute('false-value', column.falseValue);
        break;
      case 'sparkline': {
        const sf = column.sparklineFormat;
        if (sf) {
          if (sf.color) el.setAttribute('color', sf.color);
          if (sf.type) el.setAttribute('chart-type', sf.type);
          if (sf.width) el.setAttribute('width', String(sf.width));
          if (sf.height) el.setAttribute('height', String(sf.height));
        }
        break;
      }
      case 'rating': {
        const rf = column.ratingFormat;
        if (rf) {
          if (rf.max) el.setAttribute('max', String(rf.max));
          if (rf.color) el.setAttribute('color', rf.color);
        }
        break;
      }
      case 'progress': {
        const pf = column.progressFormat;
        if (pf) {
          if (pf.max) el.setAttribute('max', String(pf.max));
          if (pf.color) el.setAttribute('color', pf.color);
          if (pf.showPercentage) el.setAttribute('show-percentage', 'true');
        }
        break;
      }
      case 'percentage':
      case 'percent': {
        const pf = column.percentageFormat;
        if (pf) {
          if (pf.decimals !== undefined) el.setAttribute('decimals', String(pf.decimals));
          if (pf.colorize) el.setAttribute('colorize', 'true');
        }
        break;
      }
      case 'status': {
        const sf = column.statusFormat;
        if (sf) {
          if (sf.variant) el.setAttribute('variant', sf.variant);
          if (sf.showDot) el.setAttribute('show-dot', 'true');
        }
        break;
      }
      case 'link': {
        const lf = column.linkFormat;
        if (lf) {
          if (lf.target) el.setAttribute('target', lf.target);
          if (lf.external) el.setAttribute('external', 'true');
        }
        break;
      }
      case 'image': {
        const imf = column.imageFormat;
        if (imf) {
          if (imf.shape) el.setAttribute('shape', imf.shape);
          if (imf.size) el.setAttribute('size', imf.size);
        }
        break;
      }
      case 'color': {
        const cf = column.colorFormat;
        if (cf) {
          if (cf.showSwatch !== false) el.setAttribute('show-swatch', 'true');
          if (cf.displayFormat) el.setAttribute('display-format', cf.displayFormat);
        }
        break;
      }
      case 'email': {
        const ef = column.emailFormat;
        if (ef) {
          if (ef.showIcon) el.setAttribute('show-icon', 'true');
        }
        break;
      }
      case 'phone': {
        const pf = column.phoneFormat;
        if (pf) {
          if (pf.showIcon) el.setAttribute('show-icon', 'true');
          if (pf.format) el.setAttribute('format', 'true');
        }
        break;
      }
    }

    return el;
  }

  getCellTagName(type: string): string {
    switch (type) {
      case 'text':
        return 'snice-cell-text';
      case 'number':
        return 'snice-cell-number';
      case 'currency':
        return 'snice-cell-currency';
      case 'date':
        return 'snice-cell-date';
      case 'boolean':
        return 'snice-cell-boolean';
      case 'rating':
        return 'snice-cell-rating';
      case 'progress':
        return 'snice-cell-progress';
      case 'duration':
        return 'snice-cell-duration';
      case 'filesize':
        return 'snice-cell-filesize';
      case 'sparkline':
        return 'snice-cell-sparkline';
      case 'image':
        return 'snice-cell-image';
      case 'percentage':
      case 'percent':
        return 'snice-cell-percentage';
      case 'tag':
        return 'snice-cell-tag';
      case 'status':
        return 'snice-cell-status';
      case 'actions':
        return 'snice-cell-actions';
      case 'link':
        return 'snice-cell-link';
      case 'email':
        return 'snice-cell-email';
      case 'phone':
        return 'snice-cell-phone';
      case 'color':
        return 'snice-cell-color';
      case 'location':
        return 'snice-cell-location';
      case 'json':
        return 'snice-cell-json';
      default:
        return 'snice-cell';
    }
  }

  private fsExitHandler: (() => void) | null = null;

  toggleFullscreen = async () => {
    const isFullscreen = this.classList.contains('table-fullscreen');
    if (isFullscreen) {
      this.classList.remove('table-fullscreen');
      if (document.fullscreenElement === this) {
        try { await document.exitFullscreen(); } catch { /* already exited */ }
      }
      if (this.fsExitHandler) {
        document.removeEventListener('fullscreenchange', this.fsExitHandler);
        this.fsExitHandler = null;
      }
    } else {
      this.classList.add('table-fullscreen');
      // Use the platform Fullscreen API — escapes the page's stacking context
      // (the showcase header has backdrop-filter which fights CSS-only overlays)
      // and gives the user the browser's native Esc-to-exit affordance.
      try {
        if (typeof this.requestFullscreen === 'function') {
          await this.requestFullscreen();
        }
      } catch {
        // Browser blocked it (e.g. not from a user gesture) — fall back to CSS.
      }
      // Sync class with the browser's fullscreen state
      this.fsExitHandler = () => {
        if (document.fullscreenElement !== this) {
          this.classList.remove('table-fullscreen');
          if (this.fsExitHandler) {
            document.removeEventListener('fullscreenchange', this.fsExitHandler);
            this.fsExitHandler = null;
          }
        }
      };
      document.addEventListener('fullscreenchange', this.fsExitHandler);
    }
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const th = (e.target as HTMLElement).closest('th.sortable') as HTMLElement | null;
    if (!th) return;

    const columnKey = th.getAttribute('data-key');
    if (!columnKey) return;

    e.preventDefault();
    this.toggleSort(columnKey, true);
  };

  private handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Handle sortable header click — every click adds/cycles in multi-sort.
    const th = target.closest('th.sortable') as HTMLElement;
    if (th) {
      const columnKey = th.getAttribute('data-key');
      if (columnKey) {
        this.toggleSort(columnKey, true);
      }
      return;
    }

    // Handle row click
    const tr = target.closest('tbody tr') as HTMLElement;
    if (tr) {
      // Group rows have no data-index. Route the whole header cell (including
      // its chevron) through the table's one Snice-bound click handler so the
      // model toggles once and @dispatch emits from the host. Checkbox clicks
      // are handled by handleChange and must not also collapse the group.
      if (tr.classList.contains('group-header-row')) {
        if (target.closest('snice-checkbox.group-select')) return;
        const key = tr.getAttribute('data-group-key');
        const group = key
          ? this.getGroupingItems().find(
              (item): item is GroupRow => item.type === 'group' && item.key === key
            )
          : undefined;
        if (group) this.toggleGroup(group);
        return;
      }

      // Aggregate, spacer, loading, error, and empty-state rows are structural
      // rows, not row zero. Ignoring them prevents phantom selection/click
      // events caused by parseInt(null || '0').
      if (!tr.hasAttribute('data-index')) return;

      // Don't trigger if clicking on checkbox or other interactive elements
      if (target.matches('input[type="checkbox"], button, a, .interactive, snice-checkbox, snice-button, snice-input, snice-select')) {
        return;
      }

      const rowIndex = parseInt(tr.getAttribute('data-index') || '0');
      const rowData = this.data[rowIndex];

      // Handle row selection if selectable. selectionMode + modifier intent
      // (ctrl/meta = additive toggle, shift = range) resolved in one place.
      if (this.selectable) {
        this.applyRowSelection(rowIndex, {
          additive: e.ctrlKey || e.metaKey,
          range: e.shiftKey,
        });
      }

      // Handle clickable row event
      if (this.clickable) {
        this.dispatchRowClicked(rowData, rowIndex);
      }
    }
  }

  private handleChange = (e: Event) => {
    const target = e.target as HTMLElement;

    // Handle snice-checkbox events (row-select and select-all)
    if (target.matches('snice-checkbox.row-select')) {
      const checkbox = target as any;
      const rowIndex = parseInt(checkbox.getAttribute('data-row-index') || '0');

      if (this.selectionMode === 'none') return;
      if (this.selectabilityCheck && !this.selectabilityCheck(this.data[rowIndex], rowIndex)) {
        checkbox.checked = this.selectedRows.includes(rowIndex);
        return;
      }

      if (this.selectionMode === 'single') {
        this.selectedRows = checkbox.checked ? [rowIndex] : [];
      } else if (checkbox.checked) {
        if (!this.selectedRows.includes(rowIndex)) {
          this.selectedRows = [...this.selectedRows, rowIndex];
        }
      } else {
        this.selectedRows = this.selectedRows.filter(i => i !== rowIndex);
      }
      this.selectionAnchor = this.data[rowIndex];

      // DOM update happens in the selectedRows @watch (delta, one row).
      this.dispatchRowSelectionChanged(rowIndex, checkbox.checked);
      this.dispatchSelectionChanged();
      return;
    }

    // F: a group-header checkbox selects/deselects all rows in that group.
    if (target.matches('snice-checkbox.group-select')) {
      const checkbox = target as any;
      if (this.selectionMode !== 'multiple') return;

      const key = checkbox.getAttribute('data-group-key');
      const group = this.getGroupingItems().find(
        (it): it is GroupRow => it.type === 'group' && it.key === key
      );
      if (!group) return;

      const indices = this.getSelectableGroupIndices(group);
      if (checkbox.checked) {
        this.selectedRows = Array.from(new Set([...this.selectedRows, ...indices]));
      } else {
        const remove = new Set(indices);
        this.selectedRows = this.selectedRows.filter((i) => !remove.has(i));
      }

      // Row DOM + group/header checkboxes update in the selectedRows @watch.
      this.dispatchSelectionChanged();
      return;
    }

    if (target.matches('snice-checkbox.select-all')) {
      const checkbox = target as any;

      // Select-all only carries meaning in multiple mode.
      if (this.selectionMode !== 'multiple') return;

      if (checkbox.checked) {
        // Select only filtered/displayed rows, not all data
        this.selectedRows = this.getSelectableIndices(this.getFilteredData());
      } else {
        this.selectedRows = [];
      }

      // Row DOM + header checkbox update in the selectedRows @watch.
      this.dispatchSelectAllChanged(checkbox.checked);
      this.dispatchSelectionChanged();
    }
  }

  private onAttached = () => {
    // A controller attached. Only fetch if the user explicitly declared
    // remote mode (mode="remote" on the element, or set programmatically).
    // Local mode is the default and means the table owns its dataset.
    if (this.mode !== 'remote') return;
    this.getTableConfig();
    this.getTableData();
  }

  private searchDebounceTimeout: any = null;

  private handleSearchInput = (e: Event) => {
    const target = e.target as HTMLElement;
    const input = target as HTMLInputElement;
    this.searchText = input.value;

    // Manual debounce implementation
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }
    this.searchDebounceTimeout = setTimeout(() => {
      if (this.mode === 'remote') this.getTableData();
      else this.setQuickFilter(this.searchText);
    }, this.searchDebounce);
  }

  private handleQuickFilterInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (this.filterInputDebounceTimeout) clearTimeout(this.filterInputDebounceTimeout);
    this.filterInputDebounceTimeout = setTimeout(() => {
      this.filterInputDebounceTimeout = null;
      this.setQuickFilter(input.value || '');
    }, SniceTable.FILTER_INPUT_DEBOUNCE_MS);
  }

  private selectorDebounceTimeout: any = null;

  private handleSelectorChange = (e: CustomEvent) => {
    this.selector = Array.isArray(e.detail.value) ? e.detail.value.join(',') : e.detail.value;

    // Manual debounce implementation
    if (this.selectorDebounceTimeout) {
      clearTimeout(this.selectorDebounceTimeout);
    }
    this.selectorDebounceTimeout = setTimeout(() => {
      this.debouncedDataRequest();
    }, 150);
  }


  // A2: full sweep — kept for external/programmatic callers and post-render
  // resync. NOT on the single-toggle path (that goes through the delta in
  // handleSelectedRowsChange → updateRowSelectionStateFor).
  updateRowSelectionState() {
    if (!this.tbody) return;

    const rows = this.tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
      const isSelected = this.selectedRows.includes(index);
      row.setAttribute('data-selected', String(isSelected));

      const checkbox = row.querySelector('snice-checkbox.row-select') as any;
      if (checkbox) {
        checkbox.checked = isSelected;
      }
    });
  }

  // A2: reflect one row's selection into the DOM (located by data-index). The
  // reconciler (Task B) re-stamps data-index on moved rows, so this stays
  // correct after reorder. No-op if the row isn't in the current window.
  private updateRowSelectionStateFor(index: number, isSelected: boolean) {
    if (!this.tbody) return;
    const row = this.tbody.querySelector(`tr[data-index="${index}"]`) as HTMLElement | null;
    if (!row) return;
    row.setAttribute('data-selected', String(isSelected));
    const checkbox = row.querySelector('snice-checkbox.row-select') as any;
    if (checkbox) checkbox.checked = isSelected;
  }

  updateSelectAllState() {
    const selectAllCheckbox = this.thead?.querySelector('snice-checkbox.select-all') as any;
    if (!selectAllCheckbox) return;

    const filteredIndices = this.getSelectableIndices(this.getFilteredData());
    const selectedInFiltered = filteredIndices.filter(i => this.selectedRows.includes(i));
    const allSelected = selectedInFiltered.length === filteredIndices.length && filteredIndices.length > 0;
    const someSelected = selectedInFiltered.length > 0 && selectedInFiltered.length < filteredIndices.length;

    selectAllCheckbox.checked = allSelected;
    selectAllCheckbox.indeterminate = someSelected;
  }

  toggleSort(columnKey: string, multiSort: boolean = false) {
    if (!multiSort) {
      // Single column sort - clear all other sorts
      const existingSort = this.currentSort.find(s => s.column === columnKey);

      if (!existingSort) {
        this.currentSort = [{ column: columnKey, direction: 'asc' }];
      } else if (existingSort.direction === 'asc') {
        this.currentSort = [{ column: columnKey, direction: 'desc' }];
      } else {
        this.currentSort = [];
      }
    } else {
      // Multi column sort - modify existing or add new
      const existingSortIndex = this.currentSort.findIndex(s => s.column === columnKey);

      if (existingSortIndex === -1) {
        // Add new sort
        this.currentSort = [...this.currentSort, { column: columnKey, direction: 'asc' }];
      } else {
        const existingSort = this.currentSort[existingSortIndex];
        if (existingSort.direction === 'asc') {
          // Change to desc - create new array to trigger reactivity
          this.currentSort = this.currentSort.map((sort, index) =>
            index === existingSortIndex ? { ...sort, direction: 'desc' as const } : sort
          );
        } else {
          // Remove this sort
          this.currentSort = this.currentSort.filter(s => s.column !== columnKey);
        }
      }
    }

    this.renderHeader();
    this.dispatchSortChange();
    if (this.mode === 'remote') {
      this.debouncedDataRequest();
    } else {
      this.sortLocalData();
    }
  }

  private sortLocalData() {
    if (!this.unsortedData.length) {
      this.unsortedData = [...this.data];
    }
    // C1: bracket the reassignment so the data @watch does NOT treat this
    // re-sorted view as a new dataset (would clobber unsortedData + double-render).
    this.settingSortedData = true;
    if (this.currentSort.length === 0) {
      this.data = [...this.unsortedData];
    } else {
      this.data = [...this.unsortedData].sort((a, b) => {
        for (const { column, direction } of this.currentSort) {
          const colDef = this.columns.find(c => c.key === column);
          const customComparator = (colDef as any)?.sortComparator;

          if (customComparator) {
            const cmp = customComparator(a[column], b[column], direction);
            if (cmp !== 0) return cmp;
          } else {
            // Use value pipeline getter if available
            const aVal = colDef?.valueGetter ? colDef.valueGetter(a[column], a) : (a[column] ?? '');
            const bVal = colDef?.valueGetter ? colDef.valueGetter(b[column], b) : (b[column] ?? '');
            const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
            if (cmp !== 0) return direction === 'asc' ? cmp : -cmp;
          }
        }
        return 0;
      });
    }
    this.settingSortedData = false;
    // Sort replaced this.data (new order + reference) — resync the row-index
    // map and drop the stale filtered snapshot before re-rendering. Render is
    // queued (not synchronous): sortLocalData is reachable from the currentSort
    // setter stack via handleControlledSort, and cells must never construct there.
    this.rebuildRowIndex();
    this.scheduleRender('body');
  }

  @dispatch('table-row-selection-changed', { bubbles: true, composed: true })
  private dispatchRowSelectionChanged(rowIndex: number, selected: boolean) {
    return {
      selectedRows: this.selectedRows,
      rowIndex,
      selected
    };
  }

  @dispatch('row-clicked', { bubbles: true, composed: true })
  private dispatchRowClicked(rowData: any, rowIndex: number) {
    return { rowData, rowIndex };
  }

  @dispatch('table-load-error', { bubbles: true, composed: true })
  private dispatchLoadError(error: unknown) {
    return { error };
  }

  @dispatch('table-select-all-changed', { bubbles: true, composed: true })
  private dispatchSelectAllChanged(allSelected: boolean) {
    return {
      selectedRows: this.selectedRows,
      allSelected
    };
  }

  // E1: unified selection event, emitted alongside the two legacy events on
  // every user-driven selection change. `rows` are the current row objects.
  @dispatch('selection-changed', { bubbles: true, composed: true })
  private dispatchSelectionChanged() {
    return {
      selectedRows: this.selectedRows,
      rows: this.getSelectedData(),
    };
  }

  @dispatch('sort-change', { bubbles: true, composed: true })
  private dispatchSortChange() {
    return { sort: this.currentSort };
  }

  @dispatch('filter-change', { bubbles: true, composed: true })
  private dispatchFilterChange() {
    return { filters: this.filterEngine.getFilterModel() };
  }

  @dispatch('column-visibility-change', { bubbles: true, composed: true })
  private dispatchColumnVisibilityChange(key: string, visible: boolean) {
    return { key, visible, visibility: this.columnManager.getVisibilityModel() };
  }

  @dispatch('column-pin-change', { bubbles: true, composed: true })
  private dispatchColumnPinChange(key: string, pinned: 'left' | 'right' | false) {
    return { key, pinned };
  }

  @dispatch('column-order-change', { bubbles: true, composed: true })
  private dispatchColumnOrderChange(key: string, toIndex: number) {
    return { key, toIndex };
  }

  @dispatch('density-change', { bubbles: true, composed: true })
  private dispatchDensityChange() {
    return { density: this.density };
  }

  // ── Module Integration: Initialize ──

  private initializeModules() {
    // Column manager
    this.columnManager.initialize(this.columns, this);

    // Editor
    this.setupEditor();

    // Keyboard
    if (this.shadowRoot) {
      this.keyboard.attach({
        shadowRoot: this.shadowRoot,
        // Keyboard order follows the rows users can actually focus. In grouped
        // mode this excludes group/aggregate rows and collapsed descendants;
        // callbacks below translate that navigation position back to the raw
        // data index expected by selection/editing APIs.
        totalRows: () => this.getKeyboardRows().length,
        ariaRows: () => this.usesGroupingDisplayModel()
          ? this.getDisplayedGroupingItems().length
          : (this.treeData.isEnabled()
              ? this.getTreeDisplayRows(true).length
              : this.getKeyboardRows().length),
        ariaRowOffset: () => this.virtualize && this.virtualizer.isEnabled()
          ? Math.max(0, this.virtualizer.getVisibleRange().start)
          : 0,
        // Use the actual main-header width: tool columns add grid cells and
        // hidden data columns remove them. Raw columns.length made keyboard
        // navigation stop early or point at nonexistent cells.
        totalColumns: () => this.getKeyboardColumnCount(),
        tabMode: 'all',
        isEditing: () => this.editor.isEditing(),
        getRowElement: (rowIndex) => this.getKeyboardRowElement(rowIndex),
        ensureRowVisible: (rowIndex) => this.ensureKeyboardRowRendered(rowIndex),
        onCellActivate: (row, col) => {
          const dataIndex = this.getKeyboardDataIndex(row);
          if (this.editable && dataIndex >= 0 && col) this.startEdit(dataIndex, col);
        },
        onSelectionToggle: (row) => {
          const dataIndex = this.getKeyboardDataIndex(row);
          if (this.selectable && dataIndex >= 0) this.toggleRowSelection(dataIndex);
        },
        onSelectAll: () => {
          if (this.selectable) this.selectAllRows();
        },
      });
    }
  }

  @dispose()
  cleanup() {
    this.virtualizer.detach();
    this.keyboard.detach();
    if (this.lazyLoadHandler) this.lazyLoadContainer?.removeEventListener('scroll', this.lazyLoadHandler);
    this.lazyLoadHandler = null;
    this.lazyLoadContainer = null;
    this.rowDnD.detach();
    this.columnDnD.detach();
  }

  // ── Virtualization API ──

  /**
   * The element that actually scrolls. `.table-frame` owns `overflow: auto`
   * in the live styles — attaching scroll listeners to `.snice-table` works
   * in happy-dom (no layout) but never fires in a real browser.
   */
  private getScrollContainer(): HTMLElement | null {
    return (this.shadowRoot?.querySelector('.table-frame') ??
            this.shadowRoot?.querySelector('.snice-table')) as HTMLElement | null;
  }

  private setupVirtualization() {
    if (!this.virtualize || !this.shadowRoot || !this.tbody) return;

    const scrollContainer = this.getScrollContainer();
    if (!scrollContainer) return;

    this.virtualRowsSnapshot = this.getVirtualRows();
    this.virtualizer.attach({
      rowHeight: (displayIndex) => this.getVirtualRowHeight(displayIndex),
      bufferPx: this.virtualBuffer,
      totalRows: this.virtualRowsSnapshot.length,
      scrollContainer,
      renderRange: (start, end) => this.renderRowRange(start, end),
      // Pinned rows live outside the windowed range so they are always present,
      // exactly like the non-virtual path (renderBody).
      renderPinnedTop: () => this.renderPinnedRows(this.pinnedTopRows, 'top'),
      renderPinnedBottom: () => this.renderPinnedRows(this.pinnedBottomRows, 'bottom'),
      // Scroll-driven windows bypass renderBody; restore grid roles, logical
      // row indices, and roving focus after every inserted range.
      afterRender: () => this.keyboard.refresh(),
    });
  }

  private getVirtualRowHeight(displayIndex: number): number {
    const entry = this.virtualRowsSnapshot[displayIndex];
    if (!entry || (entry.groupItem && entry.groupItem.type !== 'row')) return this.rowHeight;
    const dataIndex = entry.groupItem ? this.indexOfRow(entry.data) : entry.index;
    const base = this.rowHeightCallback
      ? this.rowHeightCallback(entry.data, dataIndex)
      : this.rowHeight;
    return base + this.masterDetail.getFixedAdditionalHeight(dataIndex);
  }

  /**
   * The feature-aware row list the virtualizer windows over. In tree-data mode
   * this is the FLATTENED visible tree (so expand/collapse works while
   * virtualized); otherwise it is the filtered data. Each descriptor carries
   * the logical index used for `data-index`, selection, and detail lookups.
   */
  private getVirtualRows(): Array<{ data: any; index: number; treeRow?: TreeRow; groupItem?: DisplayItem }> {
    const filtered = this.getFilteredData();
    // F: the flattened group+row+aggregate list is the virtual model when
    // grouping/aggregation is on — same pattern as tree data. Group/aggregate
    // rows carry no data index; data rows key off their index in `this.data`.
    if (this.usesGroupingDisplayModel()) {
      return this.getDisplayedGroupingItems().map((groupItem, i) => ({
        data: groupItem.type === 'row' ? groupItem.data : undefined,
        index: i,
        groupItem,
      }));
    }
    if (this.treeData.isEnabled()) {
      return this.getTreeDisplayRows(true);
    }
    return filtered.map((data) => ({ data, index: this.indexOfRow(data) }));
  }

  private renderRowRange(startIndex: number, endIndex: number): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const rows = this.virtualRowsSnapshot.length > 0
      ? this.virtualRowsSnapshot
      : this.getVirtualRows();

    const extraCols =
      (this.hasSelectionColumn() ? 1 : 0) +
      (this.masterDetail.isEnabled() ? 1 : 0) +
      (this.rowReorder && this.rowDnD.isEnabled() ? 1 : 0);
    const managedColumns = this.columnManager.getAllStates();
    const visibleColumnCount = managedColumns.length > 0
      ? this.columnManager.getVisibleColumns().length
      : this.columns.length;
    const totalColSpan = visibleColumnCount + extraCols;
    const structuralSig = this.computeStructuralSig();

    // Task B: recycle rows that stay in the window across a scroll shift. A row
    // still visible after scrolling keeps its data-object key and signature, so
    // it is MOVED into the freshly built fragment (appendChild detaches it from
    // the live tbody) instead of reconstructed. The virtualizer wipes the tbody
    // AFTER we build this fragment — reused rows are already parked in the
    // fragment by then, so the wipe only clears departed rows and the spacers.
    // Net cost of a small scroll: a few createRow calls for the entering rows.
    const next = new Map<unknown, { el: HTMLElement; sig: string }>();
    const used = new Set<HTMLElement>();

    for (let i = startIndex; i < endIndex && i < rows.length; i++) {
      const { data, index, treeRow, groupItem } = rows[i];

      // F: group + aggregate rows are rebuilt each window (few, always fresh),
      // keyed by their synthetic key so the reconciler places them correctly.
      if (groupItem && groupItem.type !== 'row') {
        const el = groupItem.type === 'group'
          ? this.createGroupRow(groupItem, totalColSpan)
          : this.createAggregateRow(groupItem, totalColSpan);
        used.add(el);
        if (!next.has(groupItem.key)) next.set(groupItem.key, { el, sig: 'grouprow' });
        fragment.appendChild(el);
        continue;
      }

      // F: a grouped data row's logical index is its index in `this.data`.
      const dataIndex = groupItem ? this.indexOfRow(data) : index;
      const editing = this.isRowEditing(dataIndex);
      // Edit marker: see renderBody. Ensures leaving edit state rebuilds the row.
      const sig = this.rowSignature(data, dataIndex, structuralSig, treeRow) + (editing ? '|edit' : '');
      const prev = this.renderedRows.get(data);
      let tr: HTMLElement;

      if (prev && !used.has(prev.el) && !editing && prev.sig === sig) {
        tr = prev.el;
        this.restampRowIndex(tr, dataIndex);
      } else {
        tr = this.createRow(data, dataIndex, treeRow);
      }

      used.add(tr);
      if (!next.has(data)) next.set(data, { el: tr, sig });
      fragment.appendChild(tr);

      // Master-detail: render the expanded detail row in-window. The detail
      // A fixed detailHeight participates in virtual spacer math through
      // getVirtualRowHeight. Auto-height content is still rendered in-window
      // and contributes through normal table layout. Tree rows never carry
      // detail panels, so skip them.
      if (!treeRow && this.masterDetail.isEnabled() && this.masterDetail.isExpanded(dataIndex)) {
        const detailRow = this.masterDetail.createDetailRow(data, dataIndex, totalColSpan);
        if (detailRow) fragment.appendChild(detailRow);
      }
    }

    this.renderedRows = next;
    return fragment;
  }

  /** Build a fragment of pinned rows for the given position (top/bottom). */
  private renderPinnedRows(rows: any[], position: 'top' | 'bottom'): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const tr = this.createRow(row, -1);
      tr.classList.add('pinned-row', position === 'top' ? 'pinned-row--top' : 'pinned-row--bottom');
      fragment.appendChild(tr);
    }
    return fragment;
  }

  scrollToRow(index: number) {
    // Public row indices refer to `this.data`; grouped/tree virtualization
    // scrolls a flattened display model containing structural rows as well.
    // Translate through row identity so callers still land on the requested
    // data row rather than an unrelated header/subtotal.
    if (this.usesGroupingDisplayModel() || this.treeData.isEnabled()) {
      const row = this.data[index];
      const displayIndex = this.getVirtualRows().findIndex((entry) => entry.data === row);
      if (displayIndex >= 0) this.virtualizer.scrollToIndex(displayIndex);
      return;
    }
    this.virtualizer.scrollToRow(index);
  }

  /** Rows currently reachable by grid keyboard navigation, in display order. */
  private getKeyboardColumnCount(): number {
    const rendered = this.shadowRoot?.querySelectorAll('thead tr.column-header-row > th').length ?? 0;
    if (rendered > 0) return rendered;

    const states = this.columnManager.getAllStates();
    const dataColumns = states.length > 0
      ? this.columnManager.getVisibleColumns().length
      : this.columns.length;
    return dataColumns
      + (this.rowReorder && this.rowDnD.isEnabled() ? 1 : 0)
      + (this.masterDetail.isEnabled() ? 1 : 0)
      + (this.hasSelectionColumn() ? 1 : 0);
  }

  private getKeyboardRows(): any[] {
    if (this.usesGroupingDisplayModel()) {
      return this.getDisplayedGroupingItems()
        .filter((item): item is Extract<DisplayItem, { type: 'row' }> => item.type === 'row')
        .map((item) => item.data);
    }

    if (this.treeData.isEnabled()) {
      return this.getTreeDisplayRows(true)
        .filter((item) => !!item.treeRow)
        .map((item) => item.data);
    }

    let rows = this.getFilteredData();
    if (this.pagination && this.paginationMode === 'client') {
      const start = (this.currentPage - 1) * this.pageSize;
      rows = rows.slice(start, start + this.pageSize);
    }
    return rows;
  }

  /** Translate a keyboard navigation position to the table's raw data index. */
  private getKeyboardDataIndex(rowIndex: number): number {
    const row = this.getKeyboardRows()[rowIndex];
    return row === undefined ? -1 : this.indexOfRow(row);
  }

  private getKeyboardRowElement(rowIndex: number): HTMLElement | null {
    const dataIndex = this.getKeyboardDataIndex(rowIndex);
    if (dataIndex < 0) return null;
    return this.tbody?.querySelector(`tr[data-index="${dataIndex}"]`) as HTMLElement | null;
  }

  /**
   * Ensure a keyboard row is in the virtual window. The virtualizer scrolls by
   * flattened display position while keyboard navigation indexes visible data
   * rows, so resolve through the shared virtual row model instead of assuming
   * those two indices are interchangeable.
   */
  private ensureKeyboardRowRendered(rowIndex: number) {
    if (!this.virtualize || !this.virtualizer.isEnabled()) return;
    if (this.getKeyboardRowElement(rowIndex)) return;

    const row = this.getKeyboardRows()[rowIndex];
    if (row === undefined) return;
    const displayIndex = this.getVirtualRows().findIndex((entry) => entry.data === row);
    if (displayIndex >= 0) this.virtualizer.scrollToIndex(displayIndex);
  }

  getScrollPosition() {
    return this.virtualizer.getScrollPosition();
  }

  // ── Filtering API ──

  setColumnFilter(column: string, operator: any, value: any) {
    this.filterEngine.setColumnFilter(column, operator, value);
    this.applyClientFilters();
  }

  removeColumnFilter(column: string) {
    this.filterEngine.removeColumnFilter(column);
    this.applyClientFilters();
  }

  setQuickFilter(text: string) {
    this.filterEngine.setQuickFilter(text);
    this.applyClientFilters();
  }

  setFilterModel(model: FilterModel) {
    this.filterEngine.setFilterModel(model);
    this.applyClientFilters();
  }

  getFilterModel() {
    return this.filterEngine.getFilterModel();
  }

  clearAllFilters() {
    this.filterEngine.clearAllFilters();
    this.applyClientFilters();
  }

  private getFilteredData(): any[] {
    // Keep the row-index map + filtered snapshot coherent with the current
    // `this.data` reference (catches a direct `table.data = [...]` assignment).
    this.ensureRowIndex();
    if (this.filteredCache) return this.filteredCache;
    const filteredDataOp = !this.filterEngine.hasActiveFilters()
      ? this.data
      : this.filterEngine.applyFilters(this.data, this.columns);
    this.filteredCache = filteredDataOp;
    return filteredDataOp;
  }

  // A1: rebuild the row-object → index map from `this.data`. Call wherever the
  // data array is REPLACED (setData, remote load, sortLocalData) or an element
  // is swapped in place (row-edit commit). First occurrence wins, matching
  // `Array.prototype.indexOf` semantics. Also drops the filtered snapshot,
  // since replacing the data invalidates any previously filtered view.
  private rebuildRowIndex() {
    this.rowIndexMap.clear();
    const rows = this.data;
    for (let i = 0; i < rows.length; i++) {
      if (!this.rowIndexMap.has(rows[i])) this.rowIndexMap.set(rows[i], i);
    }
    this.rowIndexDataRef = rows;
    this.filteredCache = null;
    this.groupingCache = null; // F: derived from the filtered snapshot.
  }

  // Rebuild lazily if `this.data` was reassigned out from under the map (plain
  // `table.data = [...]`, used widely by app code and tests, bypasses setData).
  private ensureRowIndex() {
    if (this.rowIndexDataRef !== this.data) this.rebuildRowIndex();
  }

  // A1: map lookup replacing `this.data.indexOf(row)`. Same identity semantics
  // (reference equality, -1 when absent).
  private indexOfRow(row: any): number {
    this.ensureRowIndex();
    const idx = this.rowIndexMap.get(row);
    return idx === undefined ? -1 : idx;
  }

  // A4: the filtered snapshot must be dropped on every mutation of the model it
  // is derived from. Enumerated invalidation sites:
  //   1. data replacement    — rebuildRowIndex() (setData, remote load,
  //                            sortLocalData) + the ensureRowIndex() ref-check
  //                            for a direct `table.data = [...]` assignment.
  //   2. in-place row change — cell-edit-commit / row-edit-commit handlers
  //                            (see @ready initialize()).
  //   3. filter model change — invalidateFilteredCache() below, called from
  //                            applyClientFilters(); every setQuickFilter /
  //                            setColumnFilter / setHeaderFilter / setFilterModel
  //                            / clearAllFilters / removeColumnFilter and the
  //                            header-filter INPUT path route through it.
  //   4. sort                — sortLocalData() replaces this.data (case 1).
  private invalidateFilteredCache() {
    this.filteredCache = null;
    // F: the flattened group list is derived from the filtered snapshot, so any
    // change that drops one drops the other (data/filter/sort/edit).
    this.groupingCache = null;
  }

  // F: drop only the flattened group list — expand/collapse and groupBy changes
  // reshape it without touching the filtered snapshot.
  private invalidateGroupingCache() {
    this.groupingCache = null;
  }

  // F: the flattened { group | row | aggregate } display list for the current
  // filtered data, cached like filteredCache. setColumns keeps the aggregator
  // set in sync with the live columns before each rebuild.
  private getGroupingItems(): DisplayItem[] {
    if (this.grouping.setColumns(this.columns)) this.invalidateGroupingCache();
    if (this.groupingCache) return this.groupingCache;
    this.groupingCache = this.grouping.processData(this.getFilteredData());
    return this.groupingCache;
  }

  /**
   * Row grouping owns the hierarchy whenever groupBy is non-empty. With no
   * groupBy, aggregation normally uses the same flattened row+footer model,
   * except when tree data is active: tree hierarchy stays intact and the table
   * total is appended to that tree model instead.
   */
  private usesGroupingDisplayModel(): boolean {
    return this.grouping.hasGrouping()
      || (this.grouping.hasAggregation() && !this.treeData.isEnabled());
  }

  /**
   * Group display items on the active client-side page. This single helper is
   * shared by normal rendering, virtualization, keyboard navigation, and ARIA
   * so combining those features cannot produce four different row models.
   */
  private getDisplayedGroupingItems(): DisplayItem[] {
    const items = this.getGroupingItems();
    if (!this.pagination || this.paginationMode !== 'client') return items;

    const totalPages = Math.max(1, Math.ceil(items.length / this.pageSize));
    const page = Math.max(1, Math.min(this.currentPage, totalPages));
    if (page !== this.currentPage) this.currentPage = page;
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  /** Tree rows plus an optional table-total footer, optionally page-sliced. */
  private getTreeDisplayRows(paginate: boolean): Array<{
    data: any;
    index: number;
    treeRow?: TreeRow;
    groupItem?: AggregateRow;
  }> {
    const rows: Array<{ data: any; index: number; treeRow?: TreeRow; groupItem?: AggregateRow }> =
      this.treeData.processData(this.getFilteredData()).map((treeRow) => ({
        data: treeRow.data,
        index: this.indexOfRow(treeRow.data),
        treeRow,
      }));

    if (this.grouping.hasAggregation()) {
      const total = this.getGroupingItems().find(
        (item): item is AggregateRow => item.type === 'aggregate' && item.scope === 'table'
      );
      if (total) rows.push({ data: undefined, index: -1, groupItem: total });
    }

    if (!paginate || !this.pagination || this.paginationMode !== 'client') return rows;
    const totalPages = Math.max(1, Math.ceil(rows.length / this.pageSize));
    const page = Math.max(1, Math.min(this.currentPage, totalPages));
    if (page !== this.currentPage) this.currentPage = page;
    const start = (page - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  }

  private applyClientFilters() {
    this.invalidateFilteredCache();
    this.dispatchFilterChange();
    if (this.mode === 'remote') {
      // Server-side: send filter params to controller
      this.debouncedDataRequest();
    } else {
      // Client-side: re-render with filtered data
      this.renderBody();
    }
  }

  // A3: 150 ms window (matches the remote debounce constant) so a burst of
  // keystrokes into a live filter INPUT collapses into a single re-filter +
  // re-render. Only the INPUT event paths (header-filter inputs) route through
  // here; programmatic API (setQuickFilter/setColumnFilter/...) stays
  // synchronous so callers and tests keep deterministic behavior.
  private static readonly FILTER_INPUT_DEBOUNCE_MS = 150;
  private filterInputDebounceTimeout: any = null;

  private debouncedApplyClientFilters() {
    if (this.filterInputDebounceTimeout) clearTimeout(this.filterInputDebounceTimeout);
    this.filterInputDebounceTimeout = setTimeout(() => {
      this.filterInputDebounceTimeout = null;
      this.applyClientFilters();
    }, SniceTable.FILTER_INPUT_DEBOUNCE_MS);
  }

  // ── Column API ──

  setColumnVisible(key: string, visible: boolean) {
    this.columnManager.setColumnVisible(key, visible);
    this.renderHeader();
    this.renderBody();
    this.dispatchColumnVisibilityChange(key, visible);
  }

  showAllColumns() {
    this.columnManager.showAllColumns();
    this.renderHeader();
    this.renderBody();
  }

  hideAllColumns() {
    this.columnManager.hideAllColumns();
    this.renderHeader();
    this.renderBody();
  }

  getColumnVisibility() {
    return this.columnManager.getVisibilityModel();
  }

  pinColumn(key: string, side: 'left' | 'right') {
    this.columnManager.pinColumn(key, side);
    this.renderHeader();
    this.renderBody();
    this.dispatchColumnPinChange(key, side);
  }

  unpinColumn(key: string) {
    this.columnManager.unpinColumn(key);
    this.renderHeader();
    this.renderBody();
    this.dispatchColumnPinChange(key, false);
  }

  autoSizeColumn(key: string) {
    if (this.tbody) {
      this.columnManager.autoSizeColumn(key, this.tbody);
      this.renderHeader();
    }
  }

  autoSizeAllColumns() {
    if (this.tbody) {
      this.columnManager.autoSizeAll(this.tbody);
      this.renderHeader();
    }
  }

  moveColumn(key: string, toIndex: number) {
    this.columnManager.moveColumn(key, toIndex);
    this.renderHeader();
    this.renderBody();
    this.dispatchColumnOrderChange(key, toIndex);
  }

  // ── Editing API ──

  /**
   * Configure the editor from the current columns. Safe to call repeatedly —
   * columns/data are plain fields that can be assigned after @ready ran with an
   * empty set, so this re-syncs editable columns + pipelines before an edit
   * starts rather than trusting the one-time @ready snapshot.
   */
  private setupEditor() {
    if (!this.editable) return;

    this.editor.attach(this);
    this.editor.setEditMode(this.editMode);
    const editableCols = this.columns.filter(c => c.editable !== false).map(c => c.key);
    this.editor.setEditableColumns(editableCols);

    // Register value pipelines
    for (const col of this.columns) {
      if (col.valueGetter || col.valueFormatter || col.valueParser || col.valueSetter) {
        this.editor.setPipeline(col.key, {
          valueGetter: col.valueGetter,
          valueFormatter: col.valueFormatter,
          valueParser: col.valueParser,
          valueSetter: col.valueSetter,
        });
      }
    }
  }

  startEdit(rowIndex: number, columnKey: string) {
    if (!this.editable) return;
    const row = this.data[rowIndex];
    if (!row) return;

    // Ensure the editor knows which columns are editable for the current
    // column set (columns may have been assigned after @ready).
    this.setupEditor();

    if (this.editMode === 'row') {
      this.editor.startRowEdit(rowIndex, row);
    } else {
      const column = this.columns.find(c => c.key === columnKey);
      const value = row[columnKey];
      this.editor.startCellEdit(rowIndex, columnKey, value, row, column?.editorType ?? column?.type);
    }
    // Re-render the affected row to show the editor, then focus it.
    this.renderBody();
    this.focusActiveEditor();
  }

  /** Focus the first rendered editor input (called after renderBody). */
  private focusActiveEditor() {
    const el = this.tbody?.querySelector(
      '.table-editor-input, .table-editor-checkbox, .table-editor-select'
    ) as HTMLElement | null;
    if (!el) return;

    el.focus();
    if (el instanceof HTMLInputElement && (el.type === 'text' || el.type === 'number')) {
      try { el.select(); } catch { /* happy-dom may not implement select */ }
    }
  }

  async commitEdit(): Promise<string | null> {
    if (this.editMode === 'row') {
      const errors = await this.editor.commitRowEdit();
      this.renderBody();
      return errors ? 'Validation errors' : null;
    } else {
      const error = await this.editor.commitCellEdit();
      this.renderBody();
      return error;
    }
  }

  cancelEdit() {
    if (this.editMode === 'row') {
      this.editor.cancelRowEdit();
    } else {
      this.editor.cancelCellEdit();
    }
    this.renderBody();
  }

  // ── Export API ──

  exportCSV(options?: any) {
    const data = this.getFilteredData();
    const selectedData = options?.selectedOnly
      ? this.getSelectedRowsIn(data)
      : data;
    this.exporter.exportCSV(selectedData, this.columns, options);
  }

  printTable(options?: any) {
    this.exporter.print(this, options);
  }

  async copyToClipboard(options?: any): Promise<boolean> {
    const filtered = this.getFilteredData();
    const rows = this.selectedRows.length > 0 ? this.getSelectedRowsIn(filtered) : filtered;
    return this.exporter.copyToClipboard(rows, this.columns, options);
  }

  /** Resolve raw selection indices against the source data first, then retain
   * only rows present in the current filtered view. Filtered positions are not
   * interchangeable with raw indices. */
  private getSelectedRowsIn(view: any[]): any[] {
    const selected = new Set(this.getSelectedData());
    return view.filter((row) => selected.has(row));
  }

  // ── Selection helpers ──

  private hasSelectionColumn(): boolean {
    return this.selectable && this.selectionMode !== 'none';
  }

  private getSlottedSelectionRows(): any[] {
    if (this.shouldModelSlottedRows()) return [];
    return Array.from(this.querySelectorAll('snice-row[slot="rows"]')) as any[];
  }

  private getSelectionSourceRows(): any[] {
    const slotted = this.getSlottedSelectionRows();
    return slotted.length > 0 ? slotted.map((row) => row.data) : this.data;
  }

  /** Keep light-DOM rows aligned with the table's live selection mode and
   * conditional selectability, including property changes after connection. */
  private syncSlottedSelectionState() {
    const rows = this.getSlottedSelectionRows();
    if (rows.length === 0) return;

    const showSelectors = this.hasSelectionColumn();
    let keptSingleSelection = false;
    rows.forEach((row, index) => {
      const disabled = !!(showSelectors && this.selectabilityCheck
        && !this.selectabilityCheck(row.data, index));
      row.index = index;
      row.selectable = showSelectors;
      row.selectionDisabled = disabled;

      if (!showSelectors || disabled) {
        row.selected = false;
      } else if (this.selectionMode === 'single' && row.selected) {
        if (keptSingleSelection) row.selected = false;
        else keptSingleSelection = true;
      }
    });

    this.selectedRows = rows
      .map((row, index) => row.selected && !row.selectionDisabled ? index : -1)
      .filter((index) => index >= 0);
  }

  private handleSlottedRowSelect = (event: CustomEvent) => {
    const row = event.detail?.element as any;
    const rows = this.getSlottedSelectionRows();
    const index = rows.indexOf(row);
    if (index < 0) return;

    const blocked = !this.hasSelectionColumn()
      || !!(this.selectabilityCheck && !this.selectabilityCheck(row.data, index));
    if (blocked) {
      row.selected = false;
      this.syncSlottedSelectionState();
      return;
    }

    if (this.selectionMode === 'single' && row.selected) {
      rows.forEach((candidate, candidateIndex) => {
        if (candidateIndex !== index) candidate.selected = false;
      });
    }
    this.selectedRows = rows
      .map((candidate, candidateIndex) => candidate.selected ? candidateIndex : -1)
      .filter((candidateIndex) => candidateIndex >= 0);
    this.selectionAnchor = row.data;
    this.dispatchRowSelectionChanged(index, row.selected);
    this.dispatchSelectionChanged();
  };

  private getSelectableIndices(rows: any[]): number[] {
    const indices: number[] = [];
    for (const row of rows) {
      const index = this.indexOfRow(row);
      if (index < 0) continue;
      if (this.selectabilityCheck && !this.selectabilityCheck(row, index)) continue;
      indices.push(index);
    }
    return indices;
  }

  /**
   * E1: the single entry point for a pointer/keyboard interaction on one row.
   * Resolves selectionMode + modifier intent (`additive` = ctrl/meta,
   * `range` = shift), mutates `selectedRows` (delta DOM via the @watch), moves
   * the object-valued anchor for non-range interactions, and emits the legacy
   * row-selection event plus the unified `selection-changed` event.
   */
  private applyRowSelection(rowIndex: number, opts: { additive: boolean; range: boolean }) {
    if (this.selectionMode === 'none') return;
    // Conditional selectability gate (shared with the keyboard path).
    if (this.selectabilityCheck && !this.selectabilityCheck(this.data[rowIndex], rowIndex)) return;

    const row = this.data[rowIndex];

    // Single mode: always collapse to exactly the interacted row.
    if (this.selectionMode === 'single') {
      this.selectedRows = [rowIndex];
      this.selectionAnchor = row;
      this.dispatchRowSelectionChanged(rowIndex, true);
      this.dispatchSelectionChanged();
      return;
    }

    // Multiple mode. Shift extends the contiguous range from the anchor object.
    if (opts.range && this.selectionAnchor != null) {
      this.selectRange(this.selectionAnchor, row); // anchor stays put
      this.dispatchRowSelectionChanged(rowIndex, this.selectedRows.includes(rowIndex));
      this.dispatchSelectionChanged();
      return;
    }

    // Plain or additive (ctrl/meta) click → toggle this row (historical path).
    const isSelected = this.selectedRows.includes(rowIndex);
    this.selectedRows = isSelected
      ? this.selectedRows.filter(i => i !== rowIndex)
      : [...this.selectedRows, rowIndex];
    this.selectionAnchor = row;

    // DOM update happens in the selectedRows @watch (delta, one row).
    this.dispatchRowSelectionChanged(rowIndex, !isSelected);
    this.dispatchSelectionChanged();
  }

  /**
   * E1: replace the selection with the contiguous range between the anchor and
   * target ROW OBJECTS, resolved against the current filtered snapshot (display
   * order). Object-valued endpoints mean the range follows the rows across a
   * sort — `getFilteredData()` reflects the reordered `this.data`, and each
   * position maps back to a data index via `indexOfRow` (rowIndexMap).
   */
  private selectRange(anchorRow: any, targetRow: any) {
    const view = this.getFilteredData();
    let posA = view.indexOf(anchorRow);
    const posT = view.indexOf(targetRow);
    if (posT === -1) return;
    if (posA === -1) posA = posT;

    const lo = Math.min(posA, posT);
    const hi = Math.max(posA, posT);
    const indices: number[] = [];
    for (let p = lo; p <= hi; p++) {
      const idx = this.indexOfRow(view[p]);
      if (idx < 0) continue;
      if (this.selectabilityCheck && !this.selectabilityCheck(view[p], idx)) continue;
      indices.push(idx);
    }
    this.selectedRows = indices;
  }

  private toggleRowSelection(rowIndex: number) {
    // Keyboard Space/Shift+Space toggle — additive intent, no range.
    this.applyRowSelection(rowIndex, { additive: true, range: false });
  }

  private selectAllRows() {
    // Select-all only carries meaning in multiple mode.
    if (this.selectionMode !== 'multiple') return;

    const filteredIndices = this.getSelectableIndices(this.getFilteredData());
    const allFilteredSelected = filteredIndices.every(i => this.selectedRows.includes(i));

    if (allFilteredSelected) {
      this.selectedRows = this.selectedRows.filter(i => !filteredIndices.includes(i));
    } else {
      const combined = new Set([...this.selectedRows, ...filteredIndices]);
      this.selectedRows = Array.from(combined);
    }
    // Row DOM + header checkbox update in the selectedRows @watch.
    this.dispatchSelectAllChanged(allFilteredSelected);
    this.dispatchSelectionChanged();
  }

  // ── Master-Detail API ──

  setDetailPanel(options: DetailPanelOptions) {
    this.masterDetail.attach(this, options);
    this.masterDetail.onHeightChange = () => {
      if (!this.virtualize || !this.virtualizer.isEnabled()) return;
      this.virtualRowsSnapshot = this.getVirtualRows();
      this.virtualizer.setTotalRows(this.virtualRowsSnapshot.length);
    };
    this.masterDetail.prepare(this.data);
    this.renderHeader();
    this.renderBody();
  }

  expandRow(index: number) {
    this.masterDetail.expand(index);
    this.renderBody();
  }

  collapseRow(index: number) {
    this.masterDetail.collapse(index);
    this.renderBody();
  }

  toggleRowExpansion(index: number) {
    this.masterDetail.toggle(index);
    this.renderBody();
  }

  expandAllRows() {
    this.masterDetail.expandAll(this.data.length);
    this.renderBody();
  }

  collapseAllRows() {
    this.masterDetail.collapseAll();
    this.renderBody();
  }

  // ── Toolbar API ──

  setToolbar(options: ToolbarOptions) {
    this.toolbarOptions = options;
    const container = this.shadowRoot?.querySelector('.table-controls-container') as HTMLElement;
    if (!container) return;

    this.toolbar.attach(this, container, options);
    // Share the table's filter engine with the toolbar so reads (panel rendering)
    // and writes (apply/clear) operate on the same model.
    this.toolbar.setFilterEngine(this.filterEngine);
    this.toolbar.onSearch = (query) => this.setQuickFilter(query);
    this.toolbar.onSortColumn = (key, dir) => {
      this.currentSort = [{ column: key, direction: dir }];
      this.dispatchSortChange();
      this.renderHeader();
      if (this.mode === 'remote') this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.toolbar.onSetSortModel = (sortModel) => {
      this.currentSort = sortModel;
      this.dispatchSortChange();
      this.renderHeader();
      if (this.mode === 'remote') this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.toolbar.onFilterColumn = (key, operator, value) => {
      this.setColumnFilter(key, operator, value);
    };
    this.toolbar.onRemoveFilter = (key) => {
      this.removeColumnFilter(key);
    };
    this.toolbar.onSetFilterModel = (filters, logic) => {
      this.filterEngine.clearAllFilters();
      this.filterEngine.setFilterLogic(logic);
      for (const f of filters) {
        this.filterEngine.setColumnFilter(f.column, f.operator, f.value);
      }
      this.applyClientFilters();
    };
    this.toolbar.onClearFilters = () => {
      this.clearAllFilters();
    };
    this.toolbar.onExportCSV = () => this.exportCSV();
    this.toolbar.onFullscreen = () => this.toggleFullscreen();
  }

  // ── Tree Data API ──

  setTreeData(options: TreeDataOptions) {
    this.treeData.attach(options);
    this.renderBody();
  }

  expandTreeNode(key: string) {
    this.treeData.expand(key);
    this.renderBody();
  }

  collapseTreeNode(key: string) {
    this.treeData.collapse(key);
    this.renderBody();
  }

  toggleTreeNode(key: string) {
    this.treeData.toggle(key);
    this.renderBody();
  }

  expandAllTreeNodes() {
    this.treeData.expandAll(this.data);
    this.renderBody();
  }

  collapseAllTreeNodes() {
    this.treeData.collapseAll();
    this.renderBody();
  }

  // ── Column Groups API ──

  setColumnGroups(groups: ColumnGroup[]) {
    this.columnManager.setColumnGroups(groups);
    this.renderHeader();
  }

  // ── Column Menu API ──

  private initColumnMenu() {
    if (!this.columnMenu) return;
    this.columnMenuManager.attach(this);
    this.columnMenuManager.onSortAsc = (col) => {
      this.currentSort = [{ column: col, direction: 'asc' }];
      this.dispatchSortChange();
      this.renderHeader();
      if (this.mode === 'remote') this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.columnMenuManager.onSortDesc = (col) => {
      this.currentSort = [{ column: col, direction: 'desc' }];
      this.dispatchSortChange();
      this.renderHeader();
      if (this.mode === 'remote') this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.columnMenuManager.onFilter = (col) => {
      // Open filter modal pre-populated with this column
      this.toolbar.openFilterModal(col);
    };
    this.columnMenuManager.onHide = (col) => this.setColumnVisible(col, false);
    this.columnMenuManager.onPinLeft = (col) => this.pinColumn(col, 'left');
    this.columnMenuManager.onPinRight = (col) => this.pinColumn(col, 'right');
    this.columnMenuManager.onUnpin = (col) => this.unpinColumn(col);
    this.columnMenuManager.onAutoSize = (col) => this.autoSizeColumn(col);
  }

  // ── Row Pinning API ──

  pinRowTop(row: any) {
    this.pinnedTopRows.push(row);
    this.renderBody();
  }

  pinRowBottom(row: any) {
    this.pinnedBottomRows.push(row);
    this.renderBody();
  }

  unpinRow(row: any) {
    this.pinnedTopRows = this.pinnedTopRows.filter(r => r !== row);
    this.pinnedBottomRows = this.pinnedBottomRows.filter(r => r !== row);
    this.renderBody();
  }

  clearPinnedRows() {
    this.pinnedTopRows = [];
    this.pinnedBottomRows = [];
    this.renderBody();
  }

  // ── Row Height API ──

  setRowHeight(height: number) {
    this.rowHeight = height;
    this.renderBody();
  }

  setRowHeightCallback(fn: (row: any, index: number) => number) {
    this.rowHeightCallback = fn;
    this.renderBody();
  }

  // ── Sort Enhancements ──

  setSortComparator(columnKey: string, comparator: (a: any, b: any, direction: 'asc' | 'desc') => number) {
    const col = this.columns.find(c => c.key === columnKey);
    if (col) (col as any).sortComparator = comparator;
  }

  // ── Selection Enhancements ──

  private selectabilityCheck: ((row: any, index: number) => boolean) | null = null;

  setSelectabilityCheck(fn: (row: any, index: number) => boolean) {
    this.selectabilityCheck = fn;
    const sourceRows = this.getSelectionSourceRows();
    this.selectedRows = this.selectedRows.filter((index) => {
      const row = sourceRows[index];
      return !!row && fn(row, index);
    });
    this.syncSlottedSelectionState();
    this.scheduleRender('both');
  }

  // E2: register a per-cell editability predicate. Wraps the editor's check —
  // gates whether a given (row, columnKey) may enter edit mode, on top of the
  // column's `editable` flag. Stored on the editor instance, so it survives the
  // setupEditor() re-sync that startEdit() performs.
  setCellEditableCheck(fn: (row: any, column: string) => boolean) {
    this.editor.setEditabilityCheck(fn);
  }

  getSelectedData(): any[] {
    const rows = this.getSelectionSourceRows();
    return this.selectedRows.map(i => rows[i]).filter(Boolean);
  }

  // ── Lazy Loading ──

  private setupLazyLoading() {
    if (!this.lazyLoad) return;

    const scrollContainer = this.getScrollContainer();
    if (!scrollContainer) return;

    if (this.lazyLoadHandler) {
      this.lazyLoadContainer?.removeEventListener('scroll', this.lazyLoadHandler);
    }

    this.lazyLoadHandler = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      if (scrollHeight - scrollTop - clientHeight < this.lazyLoadThreshold) {
        this.dispatchEvent(new CustomEvent('lazy-load', {
          detail: { currentCount: this.data.length },
          bubbles: true,
          composed: true,
        }));
      }
    };

    scrollContainer.addEventListener('scroll', this.lazyLoadHandler, { passive: true });
    this.lazyLoadContainer = scrollContainer;
  }

  // ── Scrolling API ──

  scrollToColumn(columnKey: string) {
    const th = this.shadowRoot?.querySelector(`th[data-key="${columnKey}"]`) as HTMLElement;
    th?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }

  // ── List View ──

  private listViewRenderer: ((row: any, index: number) => string | HTMLElement) | null = null;

  setListViewRenderer(fn: (row: any, index: number) => string | HTMLElement) {
    this.listViewRenderer = fn;
    if (this.list) {
      // The row recycler cannot infer that a callback identity changed from
      // row data alone. Force fresh rows so list markup replaces table cells.
      this.renderedRows = new Map();
      this.renderBody();
    }
  }

  // ── Row creation helper (used by both regular and virtualized rendering) ──

  private createRow(rowData: any, index: number, treeRow?: TreeRow): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.setAttribute('data-index', String(index));

    // Row height
    if (this.rowHeightCallback) {
      tr.style.height = `${this.rowHeightCallback(rowData, index)}px`;
    } else if (this.rowHeight !== 48) {
      tr.style.height = `${this.rowHeight}px`;
    }

    const isSelected = this.selectedRows.includes(index);
    tr.setAttribute('data-selected', String(isSelected));

    // Row DnD handle
    if (this.rowReorder && this.rowDnD.isEnabled()) {
      tr.appendChild(this.rowDnD.createDragHandle());
      this.rowDnD.makeRowDraggable(tr, index);
    }

    // Master-detail expand/collapse toggle
    if (this.masterDetail.isEnabled()) {
      const toggleCell = document.createElement('td');
      toggleCell.className = 'detail-toggle-cell';
      toggleCell.appendChild(this.masterDetail.createToggleButton(index));
      tr.appendChild(toggleCell);
    }

    if (this.hasSelectionColumn()) {
      const selectCell = document.createElement('td');
      selectCell.className = 'select-column';
      const disabled = !!(this.selectabilityCheck && !this.selectabilityCheck(rowData, index));
      selectCell.innerHTML = `<snice-checkbox class="row-select" size="small" compact ${isSelected ? 'checked' : ''} ${disabled ? 'disabled' : ''} data-row-index="${index}"></snice-checkbox>`;
      const checkbox = selectCell.querySelector('snice-checkbox') as any;
      checkbox.disabled = disabled;
      tr.appendChild(selectCell);
    }

    const columnsToRender = this.getVisibleColumnDefinitions();

    if (this.list && this.listViewRenderer) {
      const td = document.createElement('td');
      td.className = 'list-view-cell';
      td.colSpan = Math.max(1, columnsToRender.length);
      const rendered = this.listViewRenderer(rowData, index);
      if (rendered instanceof HTMLElement) td.appendChild(rendered);
      else td.textContent = rendered == null ? '' : String(rendered);
      tr.appendChild(td);
      return tr;
    }

    let skipColumns = 0;
    columnsToRender.forEach((column, colIdx) => {
      // Column spanning: skip cells consumed by a previous span
      if (skipColumns > 0) {
        skipColumns--;
        return;
      }

      const td = document.createElement('td');
      td.setAttribute('data-key', column.key);
      const value = rowData[column.key];

      this.applyCellPresentation(td, column, value, rowData);

      // Column span
      const colSpanDef = (column as any).colSpan;
      if (colSpanDef) {
        const span = typeof colSpanDef === 'function' ? colSpanDef(value, rowData) : colSpanDef;
        if (span > 1) {
          td.colSpan = span;
          skipColumns = span - 1;
        }
      }

      // Cell/row edit: when this cell is being edited, render its editor
      // element instead of the display cell.
      const editorEl = this.maybeCreateCellEditor(column, rowData, value, index);
      if (editorEl) {
        td.classList.add('editing');
        td.appendChild(editorEl);
      } else if (treeRow && column.key === this.treeData.getGroupColumn()) {
        // Tree data: add indent + toggle on the group column
        const toggle = this.treeData.createToggle(treeRow);
        td.appendChild(toggle);
        const textSpan = document.createElement('span');
        textSpan.textContent = value == null ? '' : String(value);
        // Clicking the text label also toggles expand/collapse
        if (treeRow.hasChildren) {
          textSpan.style.cursor = 'pointer';
          textSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            this.treeData.toggle(treeRow.key);
            this.renderBody();
          });
        }
        td.appendChild(textSpan);
      } else {
        td.appendChild(this.createCellElement(column, value, rowData));
      }

      // Apply column width
      const state = this.columnManager.getState(column.key);
      if (state) {
        td.style.width = `${state.width}px`;

        // Pinned column sticky positioning
        if (state.pinned === 'left') {
          const offsets = this.columnManager.getPinnedLeftOffsets();
          td.classList.add('pinned-cell');
          td.style.position = 'sticky';
          td.style.left = `${offsets.get(column.key) ?? 0}px`;
          td.style.zIndex = '1';
        } else if (state.pinned === 'right') {
          const offsets = this.columnManager.getPinnedRightOffsets();
          td.classList.add('pinned-cell');
          td.style.position = 'sticky';
          td.style.right = `${offsets.get(column.key) ?? 0}px`;
          td.style.zIndex = '1';
        }
      }

      tr.appendChild(td);
    });

    return tr;
  }

  private applyCellPresentation(td: HTMLTableCellElement, column: ColumnDefinition, value: any, row: any) {
    const applyStyle = (style?: ColumnDefinition['style']) => {
      if (!style) return;
      if (style.backgroundColor) td.style.backgroundColor = style.backgroundColor;
      if (style.color) td.style.color = style.color;
      if (style.fontWeight) td.style.fontWeight = style.fontWeight;
      if (style.fontStyle) td.style.fontStyle = style.fontStyle;
      if (style.fontSize) td.style.fontSize = style.fontSize;
      if (style.textDecoration) td.style.textDecoration = style.textDecoration;
    };

    applyStyle(column.style);
    for (const rule of column.conditionalFormats || []) {
      if (!rule.condition(value, row)) continue;
      applyStyle(rule.style);
      if (rule.className) td.classList.add(rule.className);
      break;
    }

    if (column.tooltip) {
      td.title = typeof column.tooltip === 'function'
        ? column.tooltip(value, row)
        : (value == null ? '' : String(value));
    }
  }

  // ── F: group + aggregate row construction ──

  /**
   * A group-header row: a single full-width cell holding an optional group
   * checkbox (selectable), the expand/collapse chevron (reusing the tree-toggle
   * affordance), the group value, and a leaf-count badge. The table's delegated
   * click handler toggles the whole cell (except the checkbox) and emits one
   * host-level `group-toggle` event.
   */
  private createGroupRow(group: GroupRow, totalColSpan: number): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = 'group-header-row';
    tr.setAttribute('data-group-key', group.key);
    tr.setAttribute('data-depth', String(group.depth));
    tr.setAttribute('aria-label', `${group.value == null || group.value === '' ? 'Blank' : String(group.value)} group, ${group.count} rows`);

    const td = document.createElement('td');
    td.colSpan = totalColSpan;
    td.className = 'group-header-cell';

    // Group selection checkbox (multiple mode only — select-all semantics).
    if (this.selectable && this.selectionMode === 'multiple') {
      const state = this.groupSelectionState(group);
      const wrap = document.createElement('span');
      wrap.className = 'group-select-wrap';
      const checkbox = document.createElement('snice-checkbox') as any;
      checkbox.className = 'group-select';
      checkbox.setAttribute('size', 'small');
      checkbox.setAttribute('compact', '');
      checkbox.setAttribute('data-group-key', group.key);
      checkbox.setAttribute('aria-label', `Select all rows in ${group.value == null || group.value === '' ? 'blank' : String(group.value)} group`);
      checkbox.checked = state === 'all';
      checkbox.indeterminate = state === 'some';
      checkbox.disabled = this.getSelectableGroupIndices(group).length === 0;
      wrap.appendChild(checkbox);
      td.appendChild(wrap);
    }

    // The chevron is passive DOM; the root template's @click handler owns the
    // interaction and host-level group-toggle dispatch.
    const toggle = this.grouping.createToggle(group);
    td.appendChild(toggle);

    const label = document.createElement('span');
    label.className = 'group-header-label';
    label.textContent = group.value == null ? '' : String(group.value);
    td.appendChild(label);

    const count = document.createElement('span');
    count.className = 'group-header-count';
    count.textContent = String(group.count);
    td.appendChild(count);

    tr.appendChild(td);
    return tr;
  }

  /**
   * An aggregate footer row: per-column cells carrying the aggregate value for
   * columns that declare one (formatted through the column's normal type /
   * formatter pipeline), empty otherwise. Tool columns get spacer cells so the
   * aggregated values line up under their columns.
   */
  private createAggregateRow(agg: AggregateRow, _totalColSpan: number): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = 'group-aggregate-row';
    tr.setAttribute('data-agg-scope', agg.scope);
    tr.setAttribute('data-depth', String(agg.depth));
    if (agg.groupKey) tr.setAttribute('data-group-key', agg.groupKey);
    const groupLabel = agg.groupValue == null || agg.groupValue === '' ? 'Blank' : String(agg.groupValue);
    const scopeLabel = agg.scope === 'table'
      ? 'Total'
      : `${agg.groupColumn ? `${agg.groupColumn}: ` : ''}${groupLabel} subtotal`;
    tr.setAttribute('aria-label', scopeLabel);

    // Tool-column spacers (match createRow / renderHeader order).
    if (this.rowReorder && this.rowDnD.isEnabled()) {
      const spacer = document.createElement('td');
      spacer.className = 'drag-handle-cell';
      tr.appendChild(spacer);
    }
    if (this.masterDetail.isEnabled()) {
      const spacer = document.createElement('td');
      spacer.className = 'detail-toggle-cell';
      tr.appendChild(spacer);
    }
    if (this.hasSelectionColumn()) {
      const spacer = document.createElement('td');
      spacer.className = 'select-column';
      tr.appendChild(spacer);
    }

    const columnsToRender = this.getVisibleColumnDefinitions();

    const labelColumn = columnsToRender.find(
      (column) => !Object.prototype.hasOwnProperty.call(agg.aggregates, column.key)
    );
    // If every visible column aggregates, keep the scope/group label in the
    // first aggregate cell instead of silently omitting it.
    const inlineLabelKey = labelColumn ? null : columnsToRender[0]?.key;
    let labelled = false;
    columnsToRender.forEach((column) => {
      const td = document.createElement('td');
      td.setAttribute('data-key', column.key);
      td.className = 'aggregate-cell';

      const hasAgg = Object.prototype.hasOwnProperty.call(agg.aggregates, column.key);
      if ((!hasAgg && !labelled) || (hasAgg && column.key === inlineLabelKey)) {
        labelled = true;
        const label = document.createElement('span');
        label.className = `aggregate-label${hasAgg ? ' aggregate-label--inline' : ''}`;
        label.textContent = scopeLabel;
        if (agg.scope === 'group' && agg.depth > 0) {
          label.style.paddingLeft = `${agg.depth * 1.5}rem`;
        }
        td.appendChild(label);
      }

      if (hasAgg) {
        const value = agg.aggregates[column.key];
        td.setAttribute('data-agg-value', String(value));
        // Format through the type/formatter pipeline, but never a custom
        // renderCell (it's a per-row renderer; aggregates have no row).
        const aggCol = (column.renderCell || (!column.formatter && column.valueFormatter))
          ? {
              ...column,
              renderCell: undefined,
              // valueFormatter is the newer pipeline spelling; cell elements
              // consume the established `formatter` field. Adapt it only for
              // the already-computed aggregate value (valueGetter ran before
              // reduction and must not run a second time here).
              formatter: column.formatter ?? column.valueFormatter,
            }
          : column;
        td.appendChild(this.createCellElement(aggCol, value));
      }

      // Keep pinned columns aligned under their headers.
      const state = this.columnManager.getState(column.key);
      if (state) {
        td.style.width = `${state.width}px`;
        if (state.pinned === 'left') {
          const offsets = this.columnManager.getPinnedLeftOffsets();
          td.classList.add('pinned-cell');
          td.style.position = 'sticky';
          td.style.left = `${offsets.get(column.key) ?? 0}px`;
          td.style.zIndex = '1';
        } else if (state.pinned === 'right') {
          const offsets = this.columnManager.getPinnedRightOffsets();
          td.classList.add('pinned-cell');
          td.style.position = 'sticky';
          td.style.right = `${offsets.get(column.key) ?? 0}px`;
          td.style.zIndex = '1';
        }
      }

      tr.appendChild(td);
    });

    return tr;
  }

  /** F: whether all / some / none of a group's rows are selected. */
  private groupSelectionState(group: GroupRow): 'all' | 'some' | 'none' {
    const indices = this.getSelectableGroupIndices(group);
    if (indices.length === 0) return 'none';
    const selected = indices.filter((i) => this.selectedRows.includes(i)).length;
    if (selected === 0) return 'none';
    if (selected === indices.length) return 'all';
    return 'some';
  }

  /** Raw indices in a group that the table's conditional selectability allows. */
  private getSelectableGroupIndices(group: GroupRow): number[] {
    const indices: number[] = [];
    for (const row of group.rows) {
      const index = this.indexOfRow(row);
      if (index < 0) continue;
      if (this.selectabilityCheck && !this.selectabilityCheck(row, index)) continue;
      indices.push(index);
    }
    return indices;
  }

  /** F: toggle a group's expansion, dispatch `group-toggle`, and re-render. */
  private toggleGroup(group: GroupRow) {
    this.grouping.toggle(group.key);
    this.invalidateGroupingCache();
    this.dispatchGroupToggle(group.key, group.value, this.grouping.isExpanded(group.key));
    this.renderBody();
  }

  // F: reflect selection state onto the rendered group-header checkboxes.
  // Called from the selectedRows @watch delta path (a data-row toggle must
  // update its group header's all/some/none without a full re-render).
  private updateGroupSelectionStates() {
    if (!this.tbody || !this.grouping.hasGrouping() || !this.selectable) return;
    const groups = this.getGroupingItems().filter((it): it is GroupRow => it.type === 'group');
    if (groups.length === 0) return;
    const byKey = new Map(groups.map((g) => [g.key, g]));
    const headers = this.tbody.querySelectorAll('tr.group-header-row');
    headers.forEach((header) => {
      const key = header.getAttribute('data-group-key');
      const group = key ? byKey.get(key) : undefined;
      if (!group) return;
      const checkbox = header.querySelector('snice-checkbox.group-select') as any;
      if (!checkbox) return;
      const state = this.groupSelectionState(group);
      checkbox.checked = state === 'all';
      checkbox.indeterminate = state === 'some';
    });
  }

  @dispatch('group-toggle', { bubbles: true, composed: true })
  private dispatchGroupToggle(key: string, value: any, expanded: boolean) {
    return { key, value, expanded };
  }

  // ── Editor rendering ──

  /**
   * If the given cell is currently being edited (cell mode → this exact cell;
   * row mode → any editable cell in the edited row), build and wire its editor
   * element. Returns null when the cell is not in an edit state.
   */
  private maybeCreateCellEditor(column: any, rowData: any, value: any, index: number): HTMLElement | null {
    if (!this.editable) return null;

    let editing = false;
    let editValue = value;
    let editorType: EditorType;

    if (this.editMode === 'row') {
      const rowState = this.editor.getRowEditState();
      if (rowState?.isEditing && rowState.rowIndex === index
          && this.editor.isCellEditable(rowData, column.key)) {
        editing = true;
        editValue = rowState.editedRow[column.key];
      }
      editorType = this.resolveEditorType(column);
    } else {
      const cellState = this.editor.getCellEditState();
      if (cellState?.isEditing && cellState.rowIndex === index
          && cellState.columnKey === column.key) {
        editing = true;
        editValue = cellState.currentValue;
      }
      editorType = cellState?.editorType ?? this.resolveEditorType(column);
    }

    if (!editing) return null;

    // E2: a custom renderEditor bypasses the built-in editor. commit(v) writes
    // the value through the same pipeline the default editor uses, then commits;
    // cancel() aborts. No default wiring is attached — the renderer owns its UI.
    if (typeof column.renderEditor === 'function') {
      const commit = (v: any) => {
        if (this.editMode === 'row') this.editor.updateRowField(column.key, v);
        else this.editor.updateCellValue(v);
        this.commitEdit();
      };
      const cancel = () => this.cancelEdit();
      return column.renderEditor(editValue, rowData, column, commit, cancel);
    }

    const options = column.selectOptions ? { selectOptions: column.selectOptions } : undefined;
    const editorEl = this.editor.createEditor(editorType, editValue, options);
    this.wireEditorElement(editorEl, column);
    return editorEl;
  }

  /** Resolve the editor kind for a column (explicit override wins, else by type). */
  private resolveEditorType(column: any): EditorType {
    if (column.editorType) return column.editorType;
    return this.editor.getEditorType(column.type || 'text');
  }

  /**
   * Attach input/commit/cancel behavior to an editor element. Plain listeners
   * on a module-created element — the established pattern for imperative table
   * DOM (see createRow's checkbox/tree wiring).
   */
  private wireEditorElement(editorEl: HTMLElement, column: any) {
    const isCheckbox = editorEl instanceof HTMLInputElement && editorEl.type === 'checkbox';
    const readValue = () =>
      isCheckbox ? (editorEl as HTMLInputElement).checked : (editorEl as any).value;

    const syncValue = () => {
      const v = readValue();
      if (this.editMode === 'row') this.editor.updateRowField(column.key, v);
      else this.editor.updateCellValue(v);
    };

    editorEl.addEventListener('input', syncValue);
    editorEl.addEventListener('change', syncValue);

    editorEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        syncValue();
        this.commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      }
    });

    editorEl.addEventListener('blur', () => {
      // Commit on blur only in cell mode — in row mode, tabbing between the
      // row's editors would otherwise commit the whole row prematurely. Guard
      // on isEditing so re-renders that remove the editor (also firing blur)
      // don't re-trigger a commit.
      if (this.editMode !== 'row' && this.editor.isEditing()) {
        syncValue();
        this.commitEdit();
      }
    });
  }

}
