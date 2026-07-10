import { element, property, query, request, dispatch, watch, render, styles, html, css, ready, dispose } from 'snice';
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
import { TableColumnMenu } from './table-column-menu';
import { TableRowDnD, TableColumnDnD } from './table-row-dnd';
import type { FilterModel } from './table-filter-engine';
import type { DetailPanelOptions } from './table-master-detail';
import type { ToolbarOptions } from './table-toolbar';
import type { TreeDataOptions, TreeRow } from './table-tree-data';
import type { ColumnGroup } from './table-column-manager';

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
export class SniceTable extends HTMLElement {

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

  // Plain properties - no reflection to attributes
  columns: any[] = [];
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

  setData(data: any[]) {
    this.unsortedData = [...data];
    this.data = data;
    this.rebuildRowIndex();
    this.render();
  }

  setColumns(columns: any[]) {
    this.columns = columns;
    // Task B: a new column set can change cell types/formatting without changing
    // column keys, which the structural signature keys on. Drop the recycler map
    // so every row rebuilds against the new definitions.
    this.renderedRows = new Map();
    this.render();
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
  private columnMenuManager = new TableColumnMenu();
  private rowDnD = new TableRowDnD();
  private columnDnD = new TableColumnDnD();
  private pinnedTopRows: any[] = [];
  private pinnedBottomRows: any[] = [];
  private lazyLoadHandler: (() => void) | null = null;
  private rowHeightCallback: ((row: any, index: number) => number) | null = null;

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

      :host([selectable]) tbody tr {
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
    const hasSlottedRows = this.querySelectorAll('snice-row[slot="rows"]').length > 0;

    if (hasSlottedRows) {
      // Use slotted rows layout
      return html/*html*/`
        <div class="snice-table snice-table--slotted" @click=${this.handleClick} @change=${this.handleChange} @checkbox-change=${this.handleChange}>
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
        <div class="snice-table" @click=${this.handleClick} @change=${this.handleChange} @checkbox-change=${this.handleChange}>
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

    const showControls = this.searchable || this.filterable;
    if (!showControls) {
      container.innerHTML = '';
      return;
    }

    // Only render if container is empty (first time)
    if (container.children.length === 0) {
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'table-controls';
      controlsDiv.setAttribute('part', 'controls');

      if (this.searchable) {
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
  }

  @ready()
  async initialize() {
    // Listen for controller attached event
    this.addEventListener('controller-attached', this.onAttached as EventListener);

    // Listen for select change events from the filter dropdown
    this.addEventListener('select-change', this.handleSelectorChange as EventListener);

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

    // Render controls after initial setup
    this.renderControls();

    // Initialize feature modules
    this.initializeModules();
    this.initColumnMenu();

    // Setup DnD
    if (this.rowReorder) this.rowDnD.attach(this);
    if (this.columnReorder) this.columnDnD.attach(this);

    // Setup virtualization if enabled
    if (this.virtualize) {
      requestAnimationFrame(() => this.setupVirtualization());
    }

    // Setup lazy loading
    if (this.lazyLoad) {
      requestAnimationFrame(() => this.setupLazyLoading());
    }

    // Listen for DnD events
    this.addEventListener('row-reorder', ((e: CustomEvent) => {
      const { fromIndex, toIndex } = e.detail;
      const item = this.data.splice(fromIndex, 1)[0];
      this.data.splice(toIndex, 0, item);
      this.setData([...this.data]);
    }) as EventListener);

    this.addEventListener('column-reorder', ((e: CustomEvent) => {
      const { fromKey, toKey } = e.detail;
      const fromIdx = this.columns.findIndex(c => c.key === fromKey);
      const toIdx = this.columns.findIndex(c => c.key === toKey);
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

    if (columnElements.length > 0) {
      // Extract column definitions from snice-column elements
      this.columns = columnElements.map((col: any) => col.getColumnDefinition());

      // Pass column definitions to slotted rows
      const rowElements = Array.from(this.querySelectorAll('snice-row[slot="rows"]')) as any[];
      rowElements.forEach((row: any, index: number) => {
        row.columns = this.columns;
        row.index = index;
        row.hoverable = this.hoverable;
        row.clickable = this.clickable;
        row.selectable = this.selectable;
      });

      // Render the header for slotted mode (after next tick to ensure DOM is updated)
      requestAnimationFrame(() => this.renderSlottedHeader());
    }
  }

  private renderSlottedHeader() {
    const headerContainer = this.shadowRoot?.querySelector('#slotted-header');
    if (!headerContainer || this.columns.length === 0) return;

    // Render column headers
    headerContainer.innerHTML = this.columns.map(col =>
      `<div class="header-cell">${col.label}</div>`
    ).join('');
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
  }

  // NOTE: `columns` and `data` are plain fields (not @property), so watching
  // them never fired — the old @watch('columns') / @watch('data', ...) here
  // were dead code. Rendering happens via setColumns()/setData() manual calls.
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
  }

  @watch('currentSort')
  handleSortChange() {
    this.renderHeader();
  }

  @watch('searchable', 'filterable')
  handleControlsChange() {
    this.renderControls();
  }

  renderHeader() {
    if (!this.thead) return;
    
    const headerRow = document.createElement('tr');

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

    if (this.selectable) {
      const selectCell = document.createElement('th');
      selectCell.setAttribute('scope', 'col');
      selectCell.className = 'select-column';
      const filteredData = this.getFilteredData();
      const filteredIndices = filteredData.map((row) => this.indexOfRow(row));
      const selectedInFiltered = filteredIndices.filter(i => this.selectedRows.includes(i));
      const allSelected = selectedInFiltered.length === filteredIndices.length && filteredIndices.length > 0;
      const someSelected = selectedInFiltered.length > 0 && selectedInFiltered.length < filteredIndices.length;
      selectCell.innerHTML = `<snice-checkbox class="select-all" size="small" compact ${allSelected ? 'checked' : ''}></snice-checkbox>`;
      headerRow.appendChild(selectCell);
      
      // Set indeterminate after insertion
      setTimeout(() => {
        const checkbox = selectCell.querySelector('.select-all') as HTMLInputElement;
        if (checkbox) {
          checkbox.indeterminate = someSelected;
        }
      }, 0);
    }

    // Determine which columns are visible
    const visibleStates = this.columnManager.getVisibleColumns();
    const visibleKeys = visibleStates.length > 0 ? new Set(visibleStates.map(s => s.key)) : null;

    this.columns.forEach(column => {
      // Skip hidden columns
      if (visibleKeys && !visibleKeys.has(column.key)) return;

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
        this.columnDnD.makeHeaderDraggable(th, column.key, column.reorderable !== false);
      }

      headerRow.appendChild(th);
    });

    this.thead.innerHTML = '';

    // Column groups header row (if any)
    const groups = this.columnManager.getColumnGroups();
    if (groups.length > 0) {
      const groupRow = document.createElement('tr');
      groupRow.className = 'column-group-row';
      groupRow.innerHTML = this.columnManager.renderGroupHeaders();
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
      if (this.selectable) {
        const spacer = document.createElement('td');
        spacer.className = 'select-column';
        filterRow.appendChild(spacer);
      }

      this.columns.forEach(column => {
        if (visibleKeys && !visibleKeys.has(column.key)) return;
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
      this.virtualizer.setTotalRows(this.getVirtualRows().length);
      this.virtualizer.refresh();

      // Re-establish grid role + roving tabindex on the freshly windowed rows.
      this.keyboard.refresh();

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

      const toolCols = (this.selectable ? 1 : 0)
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

    // Client-side pagination: slice data
    let displayData = filteredData;
    let startIndex = 0;
    if (this.pagination && this.paginationMode === 'client') {
      this.totalItems = filteredData.length;
      startIndex = (this.currentPage - 1) * this.pageSize;
      displayData = filteredData.slice(startIndex, startIndex + this.pageSize);
    }

    const extraCols = (this.selectable ? 1 : 0) + (this.masterDetail.isEnabled() ? 1 : 0) + (this.rowReorder && this.rowDnD.isEnabled() ? 1 : 0);
    const totalColSpan = this.columns.length + extraCols;
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

    if (this.treeData.isEnabled()) {
      const treeRows = this.treeData.processData(displayData);
      treeRows.forEach((treeRow, i) => {
        const index = startIndex + i;
        const editing = this.isRowEditing(index);
        entries.push({
          key: treeRow.data,
          // The edit marker makes the editing→display transition a signature
          // change, so a row leaving edit state rebuilds (drops its editor DOM).
          sig: this.rowSignature(treeRow.data, index, structuralSig, treeRow) + (editing ? '|edit' : ''),
          alwaysRebuild: editing,
          restampIndex: index,
          create: () => this.createRow(treeRow.data, index, treeRow),
        });
      });
    } else {
      displayData.forEach((rowData, i) => {
        const index = startIndex + i;
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
  private computeStructuralSig(): string {
    const states = this.columnManager.getAllStates();
    const visibleCols = states.length > 0
      ? this.columns.filter(col => this.columnManager.getVisibleColumns().some(s => s.key === col.key))
      : this.columns;

    const cols = visibleCols.map(col => {
      const state = this.columnManager.getState(col.key);
      return `${col.key}:${state?.width ?? ''}:${state?.pinned ?? ''}`;
    });

    return [
      cols.join(','),
      `pl=${Array.from(this.columnManager.getPinnedLeftOffsets().values()).join('/')}`,
      `pr=${Array.from(this.columnManager.getPinnedRightOffsets().values()).join('/')}`,
      `sel=${this.selectable ? 1 : 0}`,
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

  private get totalPages(): number {
    const total = this.paginationMode === 'client' ? this.data.length : this.totalItems;
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
      totalItems: this.paginationMode === 'client' ? this.data.length : this.totalItems
    };
  }

  renderPagination() {
    const container = this.shadowRoot?.querySelector('.table-pagination-container');
    if (!container) return;

    if (!this.pagination) {
      container.innerHTML = '';
      return;
    }

    const total = this.paginationMode === 'client' ? this.data.length : this.totalItems;
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
  createCellElement(column: any, value: any): HTMLElement {
    const tagName = this.getCellTagName(column.type);
    const el = document.createElement(tagName) as any;

    // Base attributes. Only force `align` if the column definition specifies
    // one; otherwise let the cell pick its type-appropriate default (numbers
    // right, rating/boolean center, text left). Hard-coding 'left' here fought
    // the cell's own type-based text-align and made number values drift.
    el.setAttribute('type', column.type || 'text');
    if (column.align) el.setAttribute('align', column.align);
    el.setAttribute('in-table', 'true');

    // Value: serialize objects to JSON, primitives as string
    const isObjectValue = value !== null && typeof value === 'object';
    if (isObjectValue) {
      el.setAttribute('value', JSON.stringify(value));
    } else {
      el.setAttribute('value', String(value ?? ''));
    }

    // Column definition as property (for formatter access etc.)
    el.column = column;

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
            if (cf.display) el.setAttribute('display', cf.display);
            if (cf.decimals !== undefined) el.setAttribute('decimals', String(cf.decimals));
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
      case 'currency':
        return 'snice-cell-number';
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
      // Don't trigger if clicking on checkbox or other interactive elements
      if (target.matches('input[type="checkbox"], button, a, .interactive, snice-checkbox, snice-button, snice-input, snice-select')) {
        return;
      }

      const rowIndex = parseInt(tr.getAttribute('data-index') || '0');
      const rowData = this.data[rowIndex];

      // Handle row selection if selectable
      if (this.selectable) {
        const isCurrentlySelected = this.selectedRows.includes(rowIndex);

        if (isCurrentlySelected) {
          this.selectedRows = this.selectedRows.filter(i => i !== rowIndex);
        } else {
          this.selectedRows = [...this.selectedRows, rowIndex];
        }

        // DOM update happens in the selectedRows @watch (delta, one row).
        this.dispatchRowSelectionChanged(rowIndex, !isCurrentlySelected);
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

      if (checkbox.checked) {
        if (!this.selectedRows.includes(rowIndex)) {
          this.selectedRows = [...this.selectedRows, rowIndex];
        }
      } else {
        this.selectedRows = this.selectedRows.filter(i => i !== rowIndex);
      }

      // DOM update happens in the selectedRows @watch (delta, one row).
      this.dispatchRowSelectionChanged(rowIndex, checkbox.checked);
      return;
    }

    if (target.matches('snice-checkbox.select-all')) {
      const checkbox = target as any;

      if (checkbox.checked) {
        // Select only filtered/displayed rows, not all data
        const filteredData = this.getFilteredData();
        this.selectedRows = filteredData.map((row) => this.indexOfRow(row));
      } else {
        this.selectedRows = [];
      }

      // Row DOM + header checkbox update in the selectedRows @watch.
      this.dispatchSelectAllChanged(checkbox.checked);
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
      this.debouncedDataRequest();
    }, this.searchDebounce);
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

    const filteredData = this.getFilteredData();
    const filteredIndices = filteredData.map((row) => this.indexOfRow(row));
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
    // Sort replaced this.data (new order + reference) — resync the row-index
    // map and drop the stale filtered snapshot before re-rendering.
    this.rebuildRowIndex();
    this.renderBody();
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
        // Live getters: bounds always reflect the current filtered dataset and
        // column set, even after async setData/setColumns/filter/pagination.
        totalRows: () => this.getFilteredData().length,
        totalColumns: () => this.columns.length,
        tabMode: 'all',
        isEditing: () => this.editor.isEditing(),
        ensureRowVisible: (rowIndex) => this.ensureRowRendered(rowIndex),
        onCellActivate: (row, col) => {
          if (this.editable) this.startEdit(row, col);
        },
        onSelectionToggle: (row) => {
          if (this.selectable) this.toggleRowSelection(row);
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
    if (this.lazyLoadHandler) {
      this.getScrollContainer()?.removeEventListener('scroll', this.lazyLoadHandler);
    }
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
    if (!this.virtualize || !this.shadowRoot) return;

    const scrollContainer = this.getScrollContainer();
    if (!scrollContainer) return;

    this.virtualizer.attach({
      rowHeight: this.rowHeight,
      bufferPx: this.virtualBuffer,
      totalRows: this.getVirtualRows().length,
      scrollContainer,
      renderRange: (start, end) => this.renderRowRange(start, end),
      // Pinned rows live outside the windowed range so they are always present,
      // exactly like the non-virtual path (renderBody).
      renderPinnedTop: () => this.renderPinnedRows(this.pinnedTopRows, 'top'),
      renderPinnedBottom: () => this.renderPinnedRows(this.pinnedBottomRows, 'bottom'),
    });
  }

  /**
   * The feature-aware row list the virtualizer windows over. In tree-data mode
   * this is the FLATTENED visible tree (so expand/collapse works while
   * virtualized); otherwise it is the filtered data. Each descriptor carries
   * the logical index used for `data-index`, selection, and detail lookups.
   */
  private getVirtualRows(): Array<{ data: any; index: number; treeRow?: TreeRow }> {
    const filtered = this.getFilteredData();
    if (this.treeData.isEnabled()) {
      return this.treeData
        .processData(filtered)
        .map((treeRow, i) => ({ data: treeRow.data, index: i, treeRow }));
    }
    return filtered.map((data, i) => ({ data, index: i }));
  }

  private renderRowRange(startIndex: number, endIndex: number): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const rows = this.getVirtualRows();

    const extraCols =
      (this.selectable ? 1 : 0) +
      (this.masterDetail.isEnabled() ? 1 : 0) +
      (this.rowReorder && this.rowDnD.isEnabled() ? 1 : 0);
    const totalColSpan = this.columns.length + extraCols;
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
      const { data, index, treeRow } = rows[i];
      const editing = this.isRowEditing(index);
      // Edit marker: see renderBody. Ensures leaving edit state rebuilds the row.
      const sig = this.rowSignature(data, index, structuralSig, treeRow) + (editing ? '|edit' : '');
      const prev = this.renderedRows.get(data);
      let tr: HTMLElement;

      if (prev && !used.has(prev.el) && !editing && prev.sig === sig) {
        tr = prev.el;
        this.restampRowIndex(tr, index);
      } else {
        tr = this.createRow(data, index, treeRow);
      }

      used.add(tr);
      if (!next.has(data)) next.set(data, { el: tr, sig });
      fragment.appendChild(tr);

      // Master-detail: render the expanded detail row in-window. The detail
      // <tr> is an extra row the fixed-height spacer math does not account for,
      // so spacer heights are approximate around expanded rows — acceptable for
      // v1; exact variable-height support is Phase 3. Silent dropping was the
      // bug. Tree rows never carry detail panels, so skip them.
      if (!treeRow && this.masterDetail.isEnabled() && this.masterDetail.isExpanded(index)) {
        const detailRow = this.masterDetail.createDetailRow(data, index, totalColSpan);
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
    this.virtualizer.scrollToRow(index);
  }

  /**
   * Ensure the row at `rowIndex` (a logical/data index) is present in the DOM.
   * Under virtualization only the current window is rendered, so keyboard focus
   * moving to a row outside the window must scroll that row's range into view
   * and render it synchronously before focus can land on it. No-op when the row
   * is already rendered or virtualization is off.
   */
  private ensureRowRendered(rowIndex: number) {
    if (!this.virtualize || !this.virtualizer.isEnabled()) return;
    if (this.tbody?.querySelector(`tr[data-index="${rowIndex}"]`)) return;
    this.virtualizer.scrollToIndex(rowIndex);
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
      this.editor.startCellEdit(rowIndex, columnKey, value, row, column?.type);
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
      ? this.selectedRows.map(i => data[i]).filter(Boolean)
      : data;
    this.exporter.exportCSV(selectedData, this.columns, options);
  }

  printTable(options?: any) {
    this.exporter.print(this, options);
  }

  async copyToClipboard(options?: any): Promise<boolean> {
    return this.exporter.copyToClipboard(this.getFilteredData(), this.columns, this.selectedRows, options);
  }

  // ── Selection helpers ──

  private toggleRowSelection(rowIndex: number) {
    // Check conditional selectability
    if (this.selectabilityCheck && !this.selectabilityCheck(this.data[rowIndex], rowIndex)) return;

    const isSelected = this.selectedRows.includes(rowIndex)
    if (isSelected) {
      this.selectedRows = this.selectedRows.filter(i => i !== rowIndex);
    } else {
      this.selectedRows = [...this.selectedRows, rowIndex];
    }
    // DOM update happens in the selectedRows @watch (delta, one row).
    this.dispatchRowSelectionChanged(rowIndex, !isSelected);
  }

  private selectAllRows() {
    const filteredData = this.getFilteredData();
    const filteredIndices = filteredData.map((row) => this.indexOfRow(row));
    const allFilteredSelected = filteredIndices.every(i => this.selectedRows.includes(i));

    if (allFilteredSelected) {
      this.selectedRows = this.selectedRows.filter(i => !filteredIndices.includes(i));
    } else {
      const combined = new Set([...this.selectedRows, ...filteredIndices]);
      this.selectedRows = Array.from(combined);
    }
    // Row DOM + header checkbox update in the selectedRows @watch.
    this.dispatchSelectAllChanged(allFilteredSelected);
  }

  // ── Master-Detail API ──

  setDetailPanel(options: DetailPanelOptions) {
    this.masterDetail.attach(this, options);
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
    const container = this.shadowRoot?.querySelector('.table-controls-container') as HTMLElement;
    if (!container) return;

    this.toolbar.attach(this, container, options);
    // Share the table's filter engine with the toolbar so reads (panel rendering)
    // and writes (apply/clear) operate on the same model.
    this.toolbar.setFilterEngine(this.filterEngine);
    this.toolbar.onSearch = (query) => this.setQuickFilter(query);
    this.toolbar.onSortColumn = (key, dir) => {
      this.currentSort = [{ column: key, direction: dir }];
      this.renderHeader();
      if (this.mode === 'remote') this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.toolbar.onSetSortModel = (sortModel) => {
      this.currentSort = sortModel;
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
      this.renderHeader();
      if (this.mode === 'remote') this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.columnMenuManager.onSortDesc = (col) => {
      this.currentSort = [{ column: col, direction: 'desc' }];
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
  }

  getSelectedData(): any[] {
    return this.selectedRows.map(i => this.data[i]).filter(Boolean);
  }

  // ── Lazy Loading ──

  private setupLazyLoading() {
    if (!this.lazyLoad) return;

    const scrollContainer = this.getScrollContainer();
    if (!scrollContainer) return;

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
    if (this.list) this.renderBody();
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

    if (this.selectable) {
      const selectCell = document.createElement('td');
      selectCell.className = 'select-column';
      selectCell.innerHTML = `<snice-checkbox class="row-select" size="small" compact ${isSelected ? 'checked' : ''} data-row-index="${index}"></snice-checkbox>`;
      tr.appendChild(selectCell);
    }

    const visibleCols = this.columnManager.getAllStates().length > 0
      ? this.columnManager.getVisibleColumns()
      : null;

    const columnsToRender = visibleCols
      ? this.columns.filter(col => visibleCols.some(s => s.key === col.key))
      : this.columns;

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
        td.appendChild(this.createCellElement(column, value));
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