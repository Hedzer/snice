import type { SniceTableOptions } from './types';

export const VIRTUAL_TABLE_ID = '\0snice:table-modular';

export const CANONICAL_TABLE_CELLS = [
  'text',
  'number',
  'date',
  'boolean',
  'rating',
  'progress',
  'duration',
  'filesize',
  'sparkline',
  'percentage',
  'tag',
  'status',
  'actions',
  'link',
  'email',
  'phone',
  'color',
  'location',
  'json',
  'currency',
  'image',
] as const;

export type CanonicalTableCell = (typeof CANONICAL_TABLE_CELLS)[number];

export const TABLE_CELL_ALIASES: Readonly<Record<string, CanonicalTableCell>> = {
  accounting: 'number',
  scientific: 'number',
  fraction: 'number',
  percent: 'percentage',
  url: 'link',
  tags: 'tag',
  badge: 'tag',
  badges: 'tag',
  avatar: 'image',
  thumbnail: 'image',
  tel: 'phone',
  telephone: 'phone',
  object: 'json',
  money: 'currency',
  address: 'location',
  coordinates: 'location',
};

export const CANONICAL_TABLE_FEATURES = [
  'virtualizer',
  'filter',
  'editor',
  'export',
  'masterDetail',
  'toolbar',
  'treeData',
  'grouping',
  'columnMenu',
  'rowDnD',
  'columnDnD',
] as const;

export type CanonicalTableFeature = (typeof CANONICAL_TABLE_FEATURES)[number];

const CANONICAL_CELL_SET = new Set<string>(CANONICAL_TABLE_CELLS);
const CANONICAL_FEATURE_SET = new Set<string>(CANONICAL_TABLE_FEATURES);

interface FeatureImportSpec {
  module: string;
  exportName: string;
  deps?: CanonicalTableFeature[];
  siblings?: string[];
}

const FEATURE_SPECS: Record<CanonicalTableFeature, FeatureImportSpec> = {
  virtualizer: { module: 'snice/components/table/table-virtualizer', exportName: 'TableVirtualizer' },
  filter: {
    module: 'snice/components/table/table-filter-engine',
    exportName: 'TableFilterEngine',
    siblings: ['snice/components/input/snice-input', 'snice/components/select/snice-select'],
  },
  editor: {
    module: 'snice/components/table/table-editor',
    exportName: 'TableEditor',
    siblings: ['snice/components/input/snice-input', 'snice/components/select/snice-select'],
  },
  export: { module: 'snice/components/table/table-export', exportName: 'TableExport' },
  masterDetail: { module: 'snice/components/table/table-master-detail', exportName: 'TableMasterDetail' },
  toolbar: {
    module: 'snice/components/table/table-toolbar',
    exportName: 'TableToolbar',
    deps: ['filter'],
    siblings: ['snice/components/input/snice-input', 'snice/components/select/snice-select', 'snice/components/button/snice-button'],
  },
  treeData: { module: 'snice/components/table/table-tree-data', exportName: 'TableTreeData' },
  grouping: { module: 'snice/components/table/table-grouping', exportName: 'TableGrouping' },
  columnMenu: { module: 'snice/components/table/table-column-menu', exportName: 'TableColumnMenu' },
  rowDnD: { module: 'snice/components/table/table-row-dnd', exportName: 'TableRowDnD' },
  columnDnD: { module: 'snice/components/table/table-row-dnd', exportName: 'TableColumnDnD' },
};

export interface ResolvedTableStripConfig {
  cells: CanonicalTableCell[];
  features: CanonicalTableFeature[];
  siblings: string[];
}

/**
 * Validate and normalize `options.table` (fail fast in `buildStart` on unknown names).
 *
 * Omission rules:
 * - `table === undefined`: returns null (no stripping; keep full `snice-table`).
 * - `table.cells === undefined`: keep all 21 cells.
 * - `table.cells === [...]` (including `[]`): keep core `'text'` + ONLY listed cells (normalizing aliases).
 * - `table.features === undefined`: keep all 11 optional features.
 * - `table.features === [...]` (including `[]`): keep core features + ONLY listed optional features + transitive deps.
 */
export function resolveTableStripConfig(table?: SniceTableOptions): ResolvedTableStripConfig | null {
  if (!table) return null;

  let cells: CanonicalTableCell[];
  if (table.cells === undefined) {
    cells = [...CANONICAL_TABLE_CELLS];
  } else {
    const cellSet = new Set<CanonicalTableCell>(['text']);
    for (const raw of table.cells) {
      const canonical = CANONICAL_CELL_SET.has(raw)
        ? (raw as CanonicalTableCell)
        : TABLE_CELL_ALIASES[raw];
      if (!canonical) {
        throw new Error(
          `snice plugin: unknown table.cells entry "${raw}". ` +
          `Valid cell types: ${CANONICAL_TABLE_CELLS.join(', ')} (aliases: ${Object.keys(TABLE_CELL_ALIASES).join(', ')}).`
        );
      }
      cellSet.add(canonical);
    }
    cells = [...cellSet];
  }

  let features: CanonicalTableFeature[];
  if (table.features === undefined) {
    features = [...CANONICAL_TABLE_FEATURES];
  } else {
    const featSet = new Set<CanonicalTableFeature>();
    const addFeature = (name: CanonicalTableFeature) => {
      if (featSet.has(name)) return;
      featSet.add(name);
      for (const dep of FEATURE_SPECS[name].deps ?? []) {
        addFeature(dep);
      }
    };
    for (const raw of table.features) {
      if (!CANONICAL_FEATURE_SET.has(raw)) {
        throw new Error(
          `snice plugin: unknown table.features entry "${raw}". ` +
          `Valid feature names: ${CANONICAL_TABLE_FEATURES.join(', ')}.`
        );
      }
      addFeature(raw as CanonicalTableFeature);
    }
    features = [...featSet];
  }

  const siblingSet = new Set<string>();
  for (const feat of features) {
    for (const sib of FEATURE_SPECS[feat].siblings ?? []) {
      siblingSet.add(sib);
    }
  }

  return {
    cells,
    features,
    siblings: [...siblingSet],
  };
}

export function isSniceTableEntrySpecifier(source: string): boolean {
  const clean = source.split('?')[0].replace(/\\/g, '/');
  return (
    clean === 'snice/components/table/snice-table' ||
    clean === 'snice/components/table/snice-table.js' ||
    /(?:^|\/)components\/table\/snice-table(?:\.[jt]s)?$/.test(clean)
  );
}

/**
 * Generate the synthetic modular `snice-table` entry that registers ONLY the
 * requested cells, optional features, and required sibling components BEFORE
 * `snice-table-core` defines `<snice-table>` (zero upgrade race).
 */
export function generateModularTableEntry(config: ResolvedTableStripConfig): string {
  const lines: string[] = [];

  for (const sib of config.siblings) {
    lines.push(`import ${JSON.stringify(sib)};`);
  }

  // Core 'text' cell is already bundled by snice-table-core
  for (const cell of config.cells) {
    if (cell === 'text') continue;
    lines.push(`import 'snice/components/table/snice-cell-${cell}';`);
  }

  if (config.features.length > 0) {
    lines.push(`import { registerTableFeatures } from 'snice/components/table/table-registry';`);
    const regEntries: string[] = [];
    for (const feat of config.features) {
      const spec = FEATURE_SPECS[feat];
      lines.push(`import { ${spec.exportName} } from ${JSON.stringify(spec.module)};`);
      regEntries.push(`  ${feat}: ${spec.exportName}`);
    }
    lines.push(`registerTableFeatures({\n${regEntries.join(',\n')}\n});`);
  }

  lines.push(`export * from 'snice/components/table/snice-table-core';`);
  return lines.join('\n') + '\n';
}
