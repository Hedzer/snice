/**
 * Shared cell-tag resolution and optional feature registry for modular `snice-table`.
 * Kept strictly leaf (zero imports of optional cells, optional features, or sibling components)
 * so `snice-table-core` never transitively pulls omitted modules into ESM bundles.
 */

export type TableFeatureName =
  | 'virtualizer'
  | 'filter'
  | 'editor'
  | 'export'
  | 'masterDetail'
  | 'toolbar'
  | 'treeData'
  | 'grouping'
  | 'columnMenu'
  | 'rowDnD'
  | 'columnDnD';

export type TableFeatureConstructors = Partial<Record<TableFeatureName, new () => any>>;

const featureRegistry: TableFeatureConstructors = {};
const warnedCells = new Set<string>();
const warnedFeatures = new Set<string>();

/**
 * Canonical cell type → custom element tag name (matching `snice-table.getCellTagName`).
 */
export const TABLE_CELL_TAG_MAP: Readonly<Record<string, string>> = {
  text: 'snice-cell-text',
  number: 'snice-cell-number',
  date: 'snice-cell-date',
  boolean: 'snice-cell-boolean',
  rating: 'snice-cell-rating',
  progress: 'snice-cell-progress',
  duration: 'snice-cell-duration',
  filesize: 'snice-cell-filesize',
  sparkline: 'snice-cell-sparkline',
  percentage: 'snice-cell-percentage',
  percent: 'snice-cell-percentage',
  tag: 'snice-cell-tag',
  status: 'snice-cell-status',
  actions: 'snice-cell-actions',
  link: 'snice-cell-link',
  email: 'snice-cell-email',
  phone: 'snice-cell-phone',
  color: 'snice-cell-color',
  location: 'snice-cell-location',
  json: 'snice-cell-json',
  currency: 'snice-cell-currency',
  image: 'snice-cell-image',
};

/**
 * Extended declarative `<snice-row>` aliases (preserving `<snice-table>`'s
 * direct `<snice-cell>` handling for `fraction`/`accounting`/`scientific`).
 */
export const ROW_CELL_ALIAS_MAP: Readonly<Record<string, string>> = {
  accounting: 'snice-cell-number',
  scientific: 'snice-cell-number',
  fraction: 'snice-cell-number',
  tags: 'snice-cell-tag',
  badge: 'snice-cell-tag',
  badges: 'snice-cell-tag',
  url: 'snice-cell-link',
  tel: 'snice-cell-phone',
  telephone: 'snice-cell-phone',
  address: 'snice-cell-location',
  coordinates: 'snice-cell-location',
  object: 'snice-cell-json',
  money: 'snice-cell-currency',
  avatar: 'snice-cell-image',
  thumbnail: 'snice-cell-image',
};

/**
 * Resolve a column type or alias to its custom element tag name (or `'snice-cell'` for unknown/custom).
 */
export function resolveCellTagName(type: string | undefined, includeRowAliases = false): string {
  if (!type) return 'snice-cell';
  return TABLE_CELL_TAG_MAP[type] ?? (includeRowAliases ? ROW_CELL_ALIAS_MAP[type] : undefined) ?? 'snice-cell';
}

/**
 * Resolve a column type to a REGISTERED custom element tag name.
 * If the specialized cell component is not registered (e.g., under `snice-table-core`
 * or plugin-guided stripping), falls back safely to `'snice-cell-text'` and emits
 * a foldable dev-only warning once per missing cell type.
 */
export function getRegisteredCellTagName(type: string | undefined, includeRowAliases = false): string {
  const tag = resolveCellTagName(type, includeRowAliases);
  if (tag === 'snice-cell' || tag === 'snice-cell-text') return tag;
  if (typeof customElements !== 'undefined' && customElements.get(tag)) {
    return tag;
  }
  if (
    (typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) &&
    (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')
  ) {
    if (!warnedCells.has(tag)) {
      warnedCells.add(tag);
      console.warn(
        `[snice-table] Cell type "${type}" (<${tag}>) is not registered; falling back to <snice-cell-text>. ` +
        `Import "snice/components/table/${tag}" or add "${type}" to snice({ table: { cells: [...] } }).`
      );
    }
  }
  return 'snice-cell-text';
}

export function registerTableFeatures(ctors: TableFeatureConstructors): void {
  Object.assign(featureRegistry, ctors);
}

export function hasTableFeature(name: TableFeatureName): boolean {
  return typeof featureRegistry[name] === 'function';
}

export function warnMissingTableFeature(feature: TableFeatureName, apiName: string): void {
  if (
    (typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) &&
    (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')
  ) {
    const key = `${feature}:${apiName}`;
    if (!warnedFeatures.has(key)) {
      warnedFeatures.add(key);
      console.warn(
        `[snice-table] Feature "${feature}" is not registered (called via "${apiName}"). ` +
        `Use full "snice/components/table/snice-table", call registerTableFeatures({ ${feature}: ... }), ` +
        `or add "${feature}" to snice({ table: { features: [...] } }).`
      );
    }
  }
}

export function _resetTableRegistryWarnings(): void {
  warnedCells.clear();
  warnedFeatures.clear();
}

function createNoopFeature(name: TableFeatureName): any {
  switch (name) {
    case 'virtualizer':
      return {
        isEnabled: () => false,
        attach: () => warnMissingTableFeature('virtualizer', 'virtualize'),
        detach: () => {},
        setBuffer: () => {},
        setTotalRows: () => {},
        getVisibleRange: () => ({ start: 0, end: 0 }),
        getScrollPosition: () => 0,
        scrollToIndex: () => warnMissingTableFeature('virtualizer', 'scrollToIndex'),
        scrollToRow: () => warnMissingTableFeature('virtualizer', 'scrollToRow'),
      };
    case 'filter':
      return {
        applyFilters: (rows: any[]) => rows,
        getFilterModel: () => ({ filters: [], logic: 'and', quickFilter: '' }),
        hasActiveFilters: () => false,
        hasColumnFilter: () => false,
        getHeaderFilter: () => '',
        clearAllFilters: () => {},
        removeColumnFilter: () => {},
        setFilterLogic: () => {},
        setColumnFilter: () => warnMissingTableFeature('filter', 'setColumnFilter'),
        setFilterModel: () => warnMissingTableFeature('filter', 'setFilterModel'),
        setHeaderFilter: () => warnMissingTableFeature('filter', 'setHeaderFilter'),
        setQuickFilter: () => warnMissingTableFeature('filter', 'setQuickFilter'),
      };
    case 'editor':
      return {
        isEditing: () => false,
        isCellEditable: () => false,
        getRowEditState: () => null,
        getCellEditState: () => null,
        getEditorType: (t: string) => t || 'text',
        attach: () => {},
        setEditMode: () => {},
        setEditableColumns: () => {},
        setEditabilityCheck: () => {},
        setPipeline: () => {},
        cancelCellEdit: () => {},
        cancelRowEdit: () => {},
        updateCellValue: () => {},
        updateRowField: () => {},
        createEditor: () => document.createElement('input'),
        startCellEdit: () => warnMissingTableFeature('editor', 'startCellEdit'),
        startRowEdit: () => warnMissingTableFeature('editor', 'startRowEdit'),
        commitCellEdit: async () => { warnMissingTableFeature('editor', 'commitCellEdit'); return null; },
        commitRowEdit: async () => { warnMissingTableFeature('editor', 'commitRowEdit'); return []; },
      };
    case 'export':
      return {
        exportCSV: () => warnMissingTableFeature('export', 'exportCSV'),
        print: () => warnMissingTableFeature('export', 'print'),
        copyToClipboard: async () => { warnMissingTableFeature('export', 'copyToClipboard'); return false; },
      };
    case 'masterDetail':
      return {
        isEnabled: () => false,
        isExpanded: () => false,
        getExpandedRows: () => new Set<number>(),
        setExpandedRows: () => {},
        getFixedAdditionalHeight: () => 0,
        prepare: () => {},
        collapse: () => {},
        collapseAll: () => {},
        createDetailRow: () => null,
        createToggleButton: () => document.createElement('button'),
        attach: () => warnMissingTableFeature('masterDetail', 'setDetailPanel'),
        expand: () => warnMissingTableFeature('masterDetail', 'expandRow'),
        expandAll: () => warnMissingTableFeature('masterDetail', 'expandAllRows'),
        toggle: () => warnMissingTableFeature('masterDetail', 'toggleRowDetail'),
      };
    case 'toolbar':
      return {
        attach: () => warnMissingTableFeature('toolbar', 'toolbar'),
        setFilterEngine: () => {},
        openFilterModal: () => warnMissingTableFeature('toolbar', 'openFilterModal'),
      };
    case 'treeData':
      return {
        isEnabled: () => false,
        getGroupColumn: () => '',
        processData: (rows: any[]) => rows.map((data, idx) => ({ data, key: String(idx), depth: 0, hasChildren: false, expanded: false, path: [String(idx)] })),
        collapse: () => {},
        collapseAll: () => {},
        createToggle: () => document.createElement('span'),
        attach: () => warnMissingTableFeature('treeData', 'treeData'),
        expand: () => warnMissingTableFeature('treeData', 'expandTreeNode'),
        expandAll: () => warnMissingTableFeature('treeData', 'expandAllTreeNodes'),
        toggle: () => warnMissingTableFeature('treeData', 'toggleTreeNode'),
      };
    case 'grouping':
      return {
        hasGrouping: () => false,
        hasAggregation: () => false,
        getGroupByKeys: () => [],
        isExpanded: () => false,
        setColumns: () => false,
        processData: (rows: any[]) => rows.map((data, index) => ({ type: 'data', data, index })),
        createToggle: () => document.createElement('span'),
        configure: (cfg?: any) => {
          if (cfg?.groupBy && cfg.groupBy.length > 0) {
            warnMissingTableFeature('grouping', 'groupBy');
          }
        },
        toggle: () => warnMissingTableFeature('grouping', 'toggleGroup'),
      };
    case 'columnMenu':
      return {
        attach: () => {},
        show: () => warnMissingTableFeature('columnMenu', 'columnMenu'),
      };
    case 'rowDnD':
      return {
        isEnabled: () => false,
        detach: () => {},
        createDragHandle: () => document.createElement('td'),
        makeRowDraggable: () => {},
        attach: () => warnMissingTableFeature('rowDnD', 'rowReorder'),
      };
    case 'columnDnD':
      return {
        isEnabled: () => false,
        detach: () => {},
        makeHeaderDraggable: () => {},
        attach: () => warnMissingTableFeature('columnDnD', 'columnReorder'),
      };
  }
}

export function createTableFeature<T = any>(name: TableFeatureName): T {
  const Ctor = featureRegistry[name];
  if (typeof Ctor === 'function') {
    return new Ctor() as T;
  }
  return createNoopFeature(name) as T;
}
