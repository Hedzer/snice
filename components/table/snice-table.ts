import { element, property, query, request, dispatch, watch, render, styles, html, css, ready, dispose } from 'snice';
import '../input/snice-input';
import '../select/snice-select';
import '../button/snice-button';
import '../checkbox/snice-checkbox';
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

  setData(data: any[]) {
    this._unsortedData = [...data];
    this.data = data;
    this.render();
  }

  setColumns(columns: any[]) {
    this.columns = columns;
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
    this.loading = true;
    this.selectedRows = []; // Clear selections when loading new data

    try {
      const params: any = {
        search: this.searchText,
        sort: this.currentSort,
        selector: this.selector
      };

      if (this.pagination) {
        params.page = this.currentPage;
        params.pageSize = this.pageSize;
      }
      const response = await (yield params);
      this.data = response.data || [];
      if (response.totalItems !== undefined) {
        this.totalItems = response.totalItems;
      }
      this.loading = false;
      // Wait for next frame to ensure DOM is updated
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.renderBody();
      return response;
    } catch (error) {
      console.error('Error loading table data:', error);
      this.data = [];
      this.loading = false;
      // Wait for next frame to ensure DOM is updated
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.renderBody();
    }
  }

  private _hasController = false;
  private _unsortedData: any[] = [];
  private dataRequestTimeout: any = null;
  
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
      }

      .snice-table {
        width: 100%;
        overflow: auto;
      }

      /* Frame wraps super-header + table; provides the rounded border */
      .table-frame {
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: var(--snice-border-radius-lg, 0.5rem);
        overflow: hidden; /* clips cell borders at rounded corners */
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        /* no border or radius — handled by .table-frame */
      }

      /* Super-header (slotted area above column headers) */
      .table-superheader {
        background: var(--snice-color-background, rgb(255 255 255));
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
        padding: var(--snice-spacing-sm) var(--snice-spacing-sm);
      }

      /* Narrow utility columns: checkbox, expand toggle, drag handle */
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
        padding: 0 0.125rem;
        overflow: visible;
        box-sizing: content-box;
      }

      /* Force snice-checkbox compact inside table */
      .select-column snice-checkbox {
        min-height: 0;
        align-self: center;
      }

      th {
        background-color: var(--snice-color-background-secondary);
        color: var(--snice-color-text);
        font-weight: var(--snice-font-weight-semibold);
        border-bottom: 2px solid var(--snice-color-border);
      }

      th.sortable {
        cursor: pointer;
        user-select: none;
      }

      th.sortable:hover {
        background-color: var(--snice-color-background-tertiary);
      }

      /* Row styling */
      :host([striped]) tbody tr:nth-child(even) {
        background-color: var(--snice-color-background-secondary);
      }

      :host([hoverable]) tbody tr:hover {
        background-color: var(--snice-color-background-tertiary);
      }

      :host([clickable]) tbody tr {
        cursor: pointer;
      }

      :host([selectable]) tbody tr {
        cursor: pointer;
      }

      tbody tr[data-selected="true"] {
        background-color: var(--snice-color-background-tertiary);
        border-left: 3px solid var(--snice-color-primary);
      }

      tbody tr[data-selected="true"]:hover {
        background-color: var(--snice-color-background-tertiary);
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
        background-color: var(--snice-color-background);
      }

      [part="body"] {
        background-color: var(--snice-table-body-bg, --snice-color-background);
        display: block;
      }

      /* Toolbar */
      .table-toolbar {
        display: flex;
        align-items: center;
        gap: var(--snice-spacing-xs, 0.5rem);
        padding: var(--snice-spacing-xs, 0.5rem) var(--snice-spacing-sm, 0.75rem);
        flex-wrap: wrap;
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
        background: var(--snice-color-background, rgb(255 255 255));
      }

      .toolbar-search {
        flex: 1;
        min-width: 10rem;
      }

      .toolbar-spacer { flex: 1; }

      /* snice-button/snice-select handle their own styling — just layout here */
      .toolbar-density {
        min-width: 7rem;
      }

      .table-controls {
        display: flex;
        gap: var(--snice-spacing-md, 1rem);
        align-items: center;
        flex-wrap: wrap;
      }

      :host(:not([searchable])) .search-input {
        display: none;
      }

      :host(.selector-options-empty) .selector-input {
        display: none;
      }

      /* snice-input/snice-select handle own styling — layout only */
      .search-input {
        min-width: 12.5rem;
        flex: 1;
      }

      .selector-input {
        min-width: 9.375rem;
        --snice-select-min-height: 2rem;
      }

      /* Sort indicators */
      .sort-header {
        display: flex;
        align-items: center;
        gap: var(--snice-spacing-xs);
        justify-content: space-between;
      }


      .sort-indicator {
        display: flex;
        flex-direction: column;
        font-size: 0.7em;
        line-height: 1;
        opacity: 0.3;
        transition: opacity var(--snice-transition-fast);
      }

      .sort-indicator.active {
        opacity: 1;
      }

      .sort-order {
        font-size: 0.6em;
        background: var(--snice-color-primary);
        color: var(--snice-color-text-inverse);
        border-radius: var(--snice-border-radius-sm);
        padding: 1px 3px;
        min-width: 12px;
        text-align: center;
      }

      /* Loading fade */
      tbody {
        transition: opacity var(--snice-transition-normal);
      }

      :host([loading]) tbody {
        opacity: 0.5;
      }

      .no-data {
        text-align: center;
        padding: var(--snice-spacing-lg);
        color: var(--snice-color-text-secondary);
      }

      /* Pagination */
      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--snice-spacing-md, 1rem);
        padding: var(--snice-spacing-sm, 0.75rem) var(--snice-spacing-md, 1rem);
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        background: var(--snice-color-background, rgb(255 255 255));
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
        background: var(--snice-color-background, rgb(255 255 255));
        color: var(--snice-color-text, rgb(23 23 23));
        font-size: var(--snice-font-size-sm, 0.875rem);
        cursor: pointer;
        transition: all var(--snice-transition-fast, 150ms) ease;
        font-family: inherit;
        line-height: 1;
      }

      .pagination__btn:hover:not(:disabled) {
        background: var(--snice-color-background-secondary, rgb(245 245 245));
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
        background: var(--snice-color-background, rgb(255 255 255));
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
        background: var(--snice-color-background, rgb(255 255 255));
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
        background: var(--snice-color-background-secondary, rgb(245 245 245));
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
        background: var(--snice-color-background-input, rgb(248 247 245));
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
        background: var(--snice-color-background-secondary, rgb(245 245 245));
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
        background: var(--snice-color-background-tertiary, rgb(235 235 235));
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
        background: var(--snice-color-background-element, rgb(252 251 249));
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
        background: var(--snice-color-background-element, rgb(252 251 249));
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
        background: var(--snice-color-background-secondary, rgb(245 245 245));
      }

      .column-menu-item:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .column-menu-icon {
        width: 1.25rem;
        text-align: center;
        display: inline-block;
      }

      /* Slotted table layout */
      .snice-table--slotted {
        border: 1px solid var(--snice-color-border);
        border-radius: var(--snice-border-radius-lg);
        overflow: hidden;
      }

      .snice-table--slotted .table-header {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        background-color: var(--snice-color-background-secondary);
        border-bottom: 2px solid var(--snice-color-border);
        padding: var(--snice-spacing-sm);
        font-weight: var(--snice-font-weight-semibold);
        color: var(--snice-color-text);
      }

      .snice-table--slotted .header-cell {
        color: var(--snice-color-text);
      }

      .snice-table--slotted .table-header::slotted(snice-column) {
        padding: var(--snice-spacing-sm);
      }

      .snice-table--slotted .table-body {
        display: flex;
        flex-direction: column;
      }

      .snice-table--slotted .table-body::slotted(snice-row) {
        border-bottom: 1px solid var(--snice-color-border);
      }

      .snice-table--slotted .table-body::slotted(snice-row:last-child) {
        border-bottom: none;
      }

      :host([striped]) .snice-table--slotted .table-body::slotted(snice-row:nth-child(even)) {
        background-color: var(--snice-color-background-secondary);
      }

      :host([hoverable]) .snice-table--slotted .table-body::slotted(snice-row:hover) {
        background-color: var(--snice-color-background-tertiary);
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
        searchInput.setAttribute('size', 'medium');
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


  @watch('selector-options')
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

  @watch('columns')
  handleColumnsChange() {
    this.renderHeader();
  }

  @watch('data', 'loading')
  handleDataChange() {
    this.renderBody();
  }

  @watch('selected-rows')
  handleSelectedRowsChange() {
    this.updateRowSelectionState();
    this.updateSelectAllState();
  }

  @watch('current-sort')
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
      th.className = 'drag-handle-cell';
      headerRow.appendChild(th);
    }

    if (this.masterDetail.isEnabled()) {
      const th = document.createElement('th');
      th.className = 'detail-toggle-cell';
      headerRow.appendChild(th);
    }

    if (this.selectable) {
      const selectCell = document.createElement('th');
      selectCell.className = 'select-column';
      const allSelected = this.selectedRows.length === this.data.length && this.data.length > 0;
      const someSelected = this.selectedRows.length > 0 && this.selectedRows.length < this.data.length;
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
        th.style.position = 'relative';
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
        input.value = this.filterEngine.getHeaderFilter(column.key);
        input.style.width = '100%';
        input.addEventListener('input', () => {
          this.filterEngine.setHeaderFilter(column.key, input.value);
          this.applyClientFilters();
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

    let indicator = '▲▼'; // Default unsorted state
    let orderNumber = '';

    if (sortItem) {
      if (sortItem.direction === 'asc') {
        indicator = '▲';
      } else if (sortItem.direction === 'desc') {
        indicator = '▼';
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

    // Virtualized rendering: delegate to virtualizer
    if (this.virtualize && this.virtualizer.isEnabled()) {
      const filtered = this.getFilteredData();
      this.virtualizer.setTotalRows(filtered.length);
      this.virtualizer.refresh();

      // Still render pagination
      if (this.pagination) this.renderPagination();
      return;
    }

    this.tbody.innerHTML = '';

    if (this.data.length === 0 && this.columns.length > 0) {
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
      } else {
        // Show "No Data" message
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colSpan;
        td.className = 'no-data';
        td.textContent = 'No Data';
        tr.appendChild(td);
        this.tbody.appendChild(tr);
        return;
      }
    }

    const fragment = document.createDocumentFragment();

    // Apply client-side filters
    let filteredData = this.getFilteredData();

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

    // Pinned top rows
    for (const row of this.pinnedTopRows) {
      const tr = this.createRow(row, -1);
      tr.classList.add('pinned-row', 'pinned-row--top');
      // pinned row bg handled by CSS class
      fragment.appendChild(tr);
    }

    // Tree data mode
    if (this.treeData.isEnabled()) {
      const treeRows = this.treeData.processData(displayData);
      treeRows.forEach((treeRow, i) => {
        const index = startIndex + i;
        fragment.appendChild(this.createRow(treeRow.data, index, treeRow));
      });
    } else {
      // Normal rows
      displayData.forEach((rowData, i) => {
        const index = startIndex + i;
        fragment.appendChild(this.createRow(rowData, index));

        // Append detail row if expanded
        if (this.masterDetail.isEnabled() && this.masterDetail.isExpanded(index)) {
          const detailRow = this.masterDetail.createDetailRow(rowData, index, totalColSpan);
          if (detailRow) fragment.appendChild(detailRow);
        }
      });
    }

    // Pinned bottom rows
    for (const row of this.pinnedBottomRows) {
      const tr = this.createRow(row, -1);
      tr.classList.add('pinned-row', 'pinned-row--bottom');
      // pinned row bg handled by CSS class
      fragment.appendChild(tr);
    }

    this.tbody.appendChild(fragment);

    // Render pagination after body
    if (this.pagination) {
      this.renderPagination();
    }
  }

  private get totalPages(): number {
    const total = this.paginationMode === 'client' ? this.data.length : this.totalItems;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, this.totalPages));
    if (clamped === this.currentPage) return;
    this.currentPage = clamped;

    if (this.paginationMode === 'server' && this._hasController) {
      this.debouncedDataRequest();
    } else {
      this.renderBody();
    }

    this.dispatchPageChange();
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;

    if (this.paginationMode === 'server' && this._hasController) {
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
    for (const s of this.pageSizes) {
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

  getCellAttributes(column: any, value: any): string {
    const attributes = [
      `type="${column.type}"`,
      `align="${column.align || 'left'}"`,
      `value="${String(value || '').replace(/"/g, '&quot;')}"`,
      `in-table="true"`
    ];
    
    // Add type-specific attributes
    if (column.type === 'number' || column.type === 'currency') {
      if (column.decimals !== undefined) attributes.push(`decimals="${column.decimals}"`);
      if (column.thousandsSeparator) attributes.push(`thousands-separator="true"`);
      if (column.prefix) attributes.push(`prefix="${column.prefix}"`);
      if (column.suffix) attributes.push(`suffix="${column.suffix}"`);
    }
    
    if (column.type === 'date') {
      if (column.dateFormat) attributes.push(`date-format="${column.dateFormat}"`);
    }
    
    if (column.type === 'boolean') {
      if (column.useSymbols) attributes.push(`use-symbols="true"`);
      if (column.trueSymbol) attributes.push(`true-symbol="${column.trueSymbol}"`);
      if (column.falseSymbol) attributes.push(`false-symbol="${column.falseSymbol}"`);
      if (column.trueValue) attributes.push(`true-value="${column.trueValue}"`);
      if (column.falseValue) attributes.push(`false-value="${column.falseValue}"`);
    }

    if (column.type === 'sparkline') {
      const sf = (column as any).sparklineFormat;
      if (sf) {
        if (sf.color) attributes.push(`color="${sf.color}"`);
        if (sf.type) attributes.push(`chart-type="${sf.type}"`);
        if (sf.width) attributes.push(`width="${sf.width}"`);
        if (sf.height) attributes.push(`height="${sf.height}"`);
      }
    }

    if (column.type === 'rating') {
      const rf = (column as any).ratingFormat;
      if (rf) {
        if (rf.max) attributes.push(`max="${rf.max}"`);
        if (rf.color) attributes.push(`color="${rf.color}"`);
      }
    }

    if (column.type === 'progress') {
      const pf = (column as any).progressFormat;
      if (pf) {
        if (pf.max) attributes.push(`max="${pf.max}"`);
        if (pf.color) attributes.push(`color="${pf.color}"`);
        if (pf.showPercentage) attributes.push(`show-percentage="true"`);
      }
    }

    if (column.type === 'currency') {
      const cf = (column as any).currencyFormat;
      if (cf) {
        if (cf.currency) attributes.push(`currency="${cf.currency}"`);
        if (cf.locale) attributes.push(`locale="${cf.locale}"`);
        if (cf.display) attributes.push(`display="${cf.display}"`);
        if (cf.decimals !== undefined) attributes.push(`decimals="${cf.decimals}"`);
      }
    }

    if (column.type === 'percentage' || column.type === 'percent') {
      const pf = (column as any).percentageFormat;
      if (pf) {
        if (pf.decimals !== undefined) attributes.push(`decimals="${pf.decimals}"`);
        if (pf.colorize) attributes.push(`colorize="true"`);
      }
    }

    if (column.type === 'status') {
      const sf = (column as any).statusFormat;
      if (sf) {
        if (sf.variant) attributes.push(`variant="${sf.variant}"`);
        if (sf.showDot) attributes.push(`show-dot="true"`);
      }
    }

    if (column.type === 'link') {
      const lf = (column as any).linkFormat;
      if (lf) {
        if (lf.target) attributes.push(`target="${lf.target}"`);
        if (lf.external) attributes.push(`external="true"`);
      }
    }

    if (column.type === 'image') {
      const imf = (column as any).imageFormat;
      if (imf) {
        if (imf.shape) attributes.push(`shape="${imf.shape}"`);
        if (imf.size) attributes.push(`size="${imf.size}"`);
      }
    }

    if (column.type === 'color') {
      const cf = (column as any).colorFormat;
      if (cf) {
        if (cf.showSwatch !== false) attributes.push(`show-swatch="true"`);
        if (cf.displayFormat) attributes.push(`display-format="${cf.displayFormat}"`);
      }
    }

    if (column.type === 'email') {
      const ef = (column as any).emailFormat;
      if (ef) {
        if (ef.showIcon) attributes.push(`show-icon="true"`);
      }
    }

    if (column.type === 'phone') {
      const pf = (column as any).phoneFormat;
      if (pf) {
        if (pf.showIcon) attributes.push(`show-icon="true"`);
        if (pf.format) attributes.push(`format="true"`);
      }
    }

    return attributes.join(' ');
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

  private handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Handle sortable header click
    const th = target.closest('th.sortable') as HTMLElement;
    if (th) {
      const columnKey = th.getAttribute('data-key');
      if (columnKey) {
        this.toggleSort(columnKey, true); // Always multi-sort
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

        this.updateRowSelectionState();
        this.updateSelectAllState();
        this.dispatchRowSelectionChanged(rowIndex, !isCurrentlySelected);
      }

      // Handle clickable row event
      if (this.clickable) {
        this.dispatchEvent(new CustomEvent('row-clicked', {
          detail: { rowData, rowIndex }
        }));
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

      this.updateRowSelectionState();
      this.updateSelectAllState();
      this.dispatchRowSelectionChanged(rowIndex, checkbox.checked);
      return;
    }

    if (target.matches('snice-checkbox.select-all')) {
      const checkbox = target as any;

      if (checkbox.checked) {
        this.selectedRows = this.data.map((_, index) => index);
      } else {
        this.selectedRows = [];
      }

      this.updateRowSelectionState();
      this.dispatchSelectAllChanged(checkbox.checked);
    }
  }

  private onAttached = () => {
    this._hasController = true;
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

  updateSelectAllState() {
    const selectAllCheckbox = this.thead?.querySelector('snice-checkbox.select-all') as any;
    if (!selectAllCheckbox) return;

    const allSelected = this.selectedRows.length === this.data.length && this.data.length > 0;
    const someSelected = this.selectedRows.length > 0 && this.selectedRows.length < this.data.length;

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
    if (this._hasController) {
      this.debouncedDataRequest();
    } else {
      this.sortLocalData();
    }
  }

  private sortLocalData() {
    if (!this._unsortedData.length) {
      this._unsortedData = [...this.data];
    }
    if (this.currentSort.length === 0) {
      this.data = [...this._unsortedData];
    } else {
      this.data = [...this._unsortedData].sort((a, b) => {
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
    if (this.editable) {
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

    // Keyboard
    if (this.shadowRoot) {
      this.keyboard.attach({
        shadowRoot: this.shadowRoot,
        totalRows: this.data.length,
        totalColumns: this.columns.length,
        tabMode: 'all',
        isEditing: () => this.editor.isEditing(),
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
      const sc = this.shadowRoot?.querySelector('.snice-table') as HTMLElement;
      sc?.removeEventListener('scroll', this.lazyLoadHandler);
    }
  }

  // ── Virtualization API ──

  private setupVirtualization() {
    if (!this.virtualize || !this.shadowRoot) return;

    const scrollContainer = this.shadowRoot.querySelector('.snice-table') as HTMLElement;
    if (!scrollContainer) return;

    this.virtualizer.attach({
      rowHeight: this.rowHeight,
      bufferPx: this.virtualBuffer,
      totalRows: this.getFilteredData().length,
      scrollContainer,
      renderRange: (start, end) => this.renderRowRange(start, end),
    });
  }

  private renderRowRange(startIndex: number, endIndex: number): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const displayData = this.getFilteredData();

    for (let i = startIndex; i < endIndex && i < displayData.length; i++) {
      const rowData = displayData[i];
      const tr = this.createRow(rowData, i);
      fragment.appendChild(tr);
    }

    return fragment;
  }

  scrollToRow(index: number) {
    this.virtualizer.scrollToRow(index);
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
    if (!this.filterEngine.hasActiveFilters()) return this.data;
    return this.filterEngine.applyFilters(this.data, this.columns);
  }

  private applyClientFilters() {
    this.dispatchFilterChange();
    if (this._hasController) {
      // Server-side: send filter params to controller
      this.debouncedDataRequest();
    } else {
      // Client-side: re-render with filtered data
      this.renderBody();
    }
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

  startEdit(rowIndex: number, columnKey: string) {
    if (!this.editable) return;
    const row = this.data[rowIndex];
    if (!row) return;

    if (this.editMode === 'row') {
      this.editor.startRowEdit(rowIndex, row);
    } else {
      const value = row[columnKey];
      this.editor.startCellEdit(rowIndex, columnKey, value, row);
    }
    // Re-render the affected row to show editor
    this.renderBody();
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
    this.updateRowSelectionState();
    this.updateSelectAllState();
    this.dispatchRowSelectionChanged(rowIndex, !isSelected);
  }

  private selectAllRows() {
    if (this.selectedRows.length === this.data.length) {
      this.selectedRows = [];
    } else {
      this.selectedRows = this.data.map((_, i) => i);
    }
    this.updateRowSelectionState();
    this.updateSelectAllState();
    this.dispatchSelectAllChanged(this.selectedRows.length === this.data.length);
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
    this.toolbar.onSearch = (query) => this.setQuickFilter(query);
    this.toolbar.onDensityChange = (d) => { this.density = d as any; };
    this.toolbar.onExportCSV = () => this.exportCSV();
    this.toolbar.onExportPrint = () => this.printTable();
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
      if (this._hasController) this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.columnMenuManager.onSortDesc = (col) => {
      this.currentSort = [{ column: col, direction: 'desc' }];
      this.renderHeader();
      if (this._hasController) this.debouncedDataRequest();
      else this.sortLocalData();
    };
    this.columnMenuManager.onFilter = (col) => {
      // Toggle header filters and focus the filter input for this column
      if (!this.headerFilters) {
        this.headerFilters = true;
        this.renderHeader();
      }
      // Focus the filter input for the clicked column
      requestAnimationFrame(() => {
        const input = this.thead?.querySelector(`.header-filter-row input[data-column="${col}"]`) as HTMLInputElement;
        input?.focus();
      });
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

    const scrollContainer = this.shadowRoot?.querySelector('.snice-table') as HTMLElement;
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

      // Tree data: add indent + toggle on the group column
      if (treeRow && column.key === this.treeData.getGroupColumn()) {
        const toggle = this.treeData.createToggle(treeRow);
        td.appendChild(toggle);
        const textSpan = document.createElement('span');
        textSpan.textContent = value == null ? '' : String(value);
        td.appendChild(textSpan);
      } else {
        const cellTagName = this.getCellTagName(column.type);
        const attributes = this.getCellAttributes(column, value);
        td.innerHTML = `<${cellTagName} ${attributes}></${cellTagName}>`;
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

}