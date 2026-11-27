import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { parse } from '@babel/parser';
import type { SniceTableOption, SniceTableOptions } from './types';

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
export function resolveTableStripConfig(table?: SniceTableOption): ResolvedTableStripConfig | null {
  if (!table || table === 'auto') return null;

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

// ─── Conservative Static Auto-Analyzer (`table: 'auto'`) ─────────────────────

export interface TableAutoAnalysisResult {
  /** True only when all table columns & features were statically proven; false means fall back to full snice-table. */
  safe: boolean;
  /** Human-readable bail-out reason when safe === false. */
  reason?: string;
  /** Detected cell types (always includes 'text' when safe). */
  cells: CanonicalTableCell[];
  /** Detected optional features (including transitive deps). */
  features: CanonicalTableFeature[];
}

type AstNode = Record<string, any>;

function isAstNode(v: unknown): v is AstNode {
  return typeof v === 'object' && v !== null && typeof (v as any).type === 'string';
}

function normalizeCellName(raw: string): CanonicalTableCell | null {
  const lower = raw.trim().toLowerCase();
  if (CANONICAL_CELL_SET.has(lower)) return lower as CanonicalTableCell;
  return TABLE_CELL_ALIASES[lower] ?? null;
}

const FEATURE_ATTR_TRIGGERS: Array<[RegExp, CanonicalTableFeature]> = [
  [/\b(?:virtualize|row-height|rowHeight|virtual-buffer|virtualBuffer)\b/, 'virtualizer'],
  [/\b(?:searchable|filterable|header-filters|headerFilters|quick-filter|quickFilter|filterModel|setFilter|addFilter|clearFilters)\b/, 'filter'],
  [/\b(?:editable|edit-mode|editMode|startEdit|commitEdit|cancelEdit)\b/, 'editor'],
  [/\b(?:exportable|exportCSV|exportJSON|exportData|downloadCSV|downloadJSON)\b/, 'export'],
  [/\b(?:master-detail|masterDetail|detail-panel|detailPanel|detailPanelOptions|toggleDetail)\b/, 'masterDetail'],
  [/\b(?:toolbar|toolbarOptions|show-toolbar|showToolbar)\b/, 'toolbar'],
  [/\b(?:tree-data|treeData|treeDataOptions|getTreePath|expandTree)\b/, 'treeData'],
  [/\b(?:groupable|group-by|groupBy|groupDefaults|aggregate)\b/, 'grouping'],
  [/\b(?:column-menu|columnMenu|pinColumn|hideColumn|autoSizeColumn)\b/, 'columnMenu'],
  [/\b(?:row-reorder|rowReorder|draggable|row-dnd)\b/, 'rowDnD'],
  [/\b(?:column-reorder|columnReorder|column-dnd)\b/, 'columnDnD'],
];

function extractStaticString(node: AstNode | null | undefined): string | null {
  if (!isAstNode(node)) return null;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions?.length === 0 && node.quasis?.length === 1) {
    return node.quasis[0].value?.cooked ?? null;
  }
  return null;
}

function getPropertyKeyName(prop: AstNode): string | null {
  if (prop.computed) {
    return extractStaticString(prop.key);
  }
  if (prop.key?.type === 'Identifier') return prop.key.name;
  if (prop.key?.type === 'StringLiteral') return prop.key.value;
  return null;
}

function collectStaticColumnTypes(
  expr: AstNode | null | undefined,
  varInits: Map<string, AstNode>,
  cells: Set<CanonicalTableCell>,
  features: Set<CanonicalTableFeature>,
  visitedVars = new Set<string>()
): { ok: boolean; reason?: string } {
  if (!isAstNode(expr)) return { ok: false, reason: 'missing columns expression' };

  // Unwrap TS type assertions (`as ...`, `satisfies ...`, non-null `!`)
  if (
    expr.type === 'TSAsExpression' ||
    expr.type === 'TSSatisfiesExpression' ||
    expr.type === 'TSTypeAssertion' ||
    expr.type === 'TSNonNullExpression' ||
    expr.type === 'ParenthesizedExpression'
  ) {
    return collectStaticColumnTypes(expr.expression, varInits, cells, features, visitedVars);
  }

  if (expr.type === 'Identifier') {
    const name = expr.name;
    if (visitedVars.has(name)) return { ok: false, reason: `cyclic columns reference "${name}"` };
    const init = varInits.get(name);
    if (!init) return { ok: false, reason: `non-local or dynamic columns identifier "${name}"` };
    visitedVars.add(name);
    return collectStaticColumnTypes(init, varInits, cells, features, visitedVars);
  }

  if (expr.type !== 'ArrayExpression') {
    return { ok: false, reason: `dynamic columns expression (${expr.type})` };
  }

  for (const el of expr.elements ?? []) {
    if (!isAstNode(el)) return { ok: false, reason: 'sparse columns array' };
    if (el.type === 'SpreadElement') {
      return { ok: false, reason: 'spread element inside columns array' };
    }
    if (el.type !== 'ObjectExpression') {
      return { ok: false, reason: `dynamic column item (${el.type})` };
    }
    let hasExplicitType = false;
    for (const prop of el.properties ?? []) {
      if (prop.type === 'SpreadElement') {
        return { ok: false, reason: 'object spread inside column definition' };
      }
      if (prop.type !== 'ObjectProperty') continue;
      const key = getPropertyKeyName(prop);
      if (!key) return { ok: false, reason: 'computed property key in column definition' };

      if (key === 'type') {
        hasExplicitType = true;
        const val = extractStaticString(prop.value);
        if (val === null) {
          return { ok: false, reason: `dynamic column type expression (${prop.value?.type})` };
        }
        const canonical = normalizeCellName(val);
        if (!canonical) {
          return { ok: false, reason: `unrecognized column type "${val}"` };
        }
        cells.add(canonical);
      } else if (key === 'editable') {
        if (!(prop.value?.type === 'BooleanLiteral' && prop.value.value === false)) {
          features.add('editor');
        }
      } else if (key === 'filterable' || key === 'filter' || key === 'filterOptions') {
        if (!(prop.value?.type === 'BooleanLiteral' && prop.value.value === false)) {
          features.add('filter');
        }
      } else if (key === 'aggregate' || key === 'groupable') {
        if (!(prop.value?.type === 'BooleanLiteral' && prop.value.value === false)) {
          features.add('grouping');
        }
      } else if (key === 'pinnable' || key === 'hideable' || key === 'menu') {
        if (!(prop.value?.type === 'BooleanLiteral' && prop.value.value === false)) {
          features.add('columnMenu');
        }
      }
    }
    if (!hasExplicitType) {
      cells.add('text');
    }
  }

  return { ok: true };
}

function scanMarkupForTable(
  markup: string,
  cells: Set<CanonicalTableCell>,
  features: Set<CanonicalTableFeature>
): { foundTable: boolean; bailReason?: string } {
  let foundTable = false;

  // Inspect every `<snice-table ...>` opening tag
  const tableTagRe = /<snice-table\b([^>]*)>/gi;
  let tm: RegExpExecArray | null;
  while ((tm = tableTagRe.exec(markup)) !== null) {
    foundTable = true;
    const attrs = tm[1] || '';
    if (/\.\.\.(?:props|properties|attrs|attributes)\s*=/.test(attrs) || /\{\s*\.\.\./.test(attrs)) {
      return { foundTable: true, bailReason: 'spread binding on <snice-table>' };
    }
    // Check standalone `tree` boolean attribute on <snice-table>
    if (/(?:^|\s)\??tree(?:\s|=|$|\/)/i.test(attrs)) {
      features.add('treeData');
    }
    for (const [re, feat] of FEATURE_ATTR_TRIGGERS) {
      if (re.test(attrs)) features.add(feat);
    }
  }

  // Inspect every `<snice-column ...>` opening tag
  const colTagRe = /<snice-column\b([^>]*)>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = colTagRe.exec(markup)) !== null) {
    foundTable = true;
    const attrs = cm[1] || '';
    if (/\.\.\.(?:props|properties|attrs|attributes)\s*=/.test(attrs) || /\{\s*\.\.\./.test(attrs)) {
      return { foundTable: true, bailReason: 'spread binding on <snice-column>' };
    }
    const dynType = /\btype\s*=\s*(?:["'][^"']*\$\{|\$\{|\{)/.test(attrs);
    if (dynType) {
      return { foundTable: true, bailReason: 'dynamic type attribute on <snice-column>' };
    }
    const staticType = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`\/]+))/i.exec(attrs);
    if (staticType) {
      const rawType = staticType[1] ?? staticType[2] ?? staticType[3] ?? '';
      const canonical = normalizeCellName(rawType);
      if (!canonical) {
        return { foundTable: true, bailReason: `unrecognized <snice-column type="${rawType}">` };
      }
      cells.add(canonical);
    } else {
      cells.add('text');
    }
    for (const [re, feat] of FEATURE_ATTR_TRIGGERS) {
      if (re.test(attrs)) features.add(feat);
    }
  }

  return { foundTable };
}

/**
 * Conservatively analyze application source files to determine which `snice-table`
 * cells and optional features are statically required.
 *
 * Strictly safe-by-default: ANY dynamic column definition, unknown spread,
 * computed cell type, or absence of static table usage returns `safe: false`
 * so the build falls back to full `snice-table` without risking runtime breakage.
 */
export function analyzeTableUsage(sources: ReadonlyArray<{ id: string; code: string }>): TableAutoAnalysisResult {
  const cells = new Set<CanonicalTableCell>(['text']);
  const features = new Set<CanonicalTableFeature>();
  let foundTableUsage = false;

  for (const { id, code } of sources) {
    const cleanId = id.split('?')[0];
    const lowerCode = code.toLowerCase();
    const mentionsTable =
      lowerCode.includes('snice-table') ||
      lowerCode.includes('snice-column') ||
      lowerCode.includes('snice-cell-') ||
      code.includes('<Table');
    if (!mentionsTable) continue;

    // Raw markup scan (handles .html files and html`` template bodies)
    const markupRes = scanMarkupForTable(code, cells, features);
    if (markupRes.foundTable) foundTableUsage = true;
    if (markupRes.bailReason) {
      return { safe: false, reason: `${cleanId}: ${markupRes.bailReason}`, cells: [...CANONICAL_TABLE_CELLS], features: [...CANONICAL_TABLE_FEATURES] };
    }

    if (cleanId.endsWith('.html') || cleanId.endsWith('.htm')) {
      continue;
    }

    // Dynamic createElement('snice-column' | 'snice-cell-*') -> bail out
    if (/createElement\s*\(\s*['"`]snice-(?:column|cell-)/.test(code)) {
      return {
        safe: false,
        reason: `${cleanId}: dynamic createElement for snice-column/snice-cell`,
        cells: [...CANONICAL_TABLE_CELLS],
        features: [...CANONICAL_TABLE_FEATURES],
      };
    }

    // Scan JS/TS AST for columns assignments, bindings, JSX props, and feature calls
    const isTs = /\.[cm]?tsx?$/.test(cleanId);
    const isJsx = /\.[cm]?[jt]sx$/.test(cleanId);
    let ast: AstNode;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'decorators',
          ...(isTs ? (['typescript'] as const) : []),
          ...(isJsx ? (['jsx'] as const) : []),
        ],
      }) as AstNode;
    } catch {
      return {
        safe: false,
        reason: `${cleanId}: failed to parse JS/TS source`,
        cells: [...CANONICAL_TABLE_CELLS],
        features: [...CANONICAL_TABLE_FEATURES],
      };
    }

    // Collect local variable initializers for static `const cols = [...]` resolution
    const varInits = new Map<string, AstNode>();
    const collectVars = (node: AstNode | null | undefined) => {
      if (!isAstNode(node)) return;
      if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init) {
        if (!varInits.has(node.id.name)) {
          varInits.set(node.id.name, node.init);
        } else {
          // Multiple declarations with same name in file -> mark ambiguous
          varInits.delete(node.id.name);
        }
      }
      if (node.type === 'ClassProperty' && node.key?.type === 'Identifier' && node.value) {
        varInits.set(`this.${node.key.name}`, node.value);
      }
      for (const k of Object.keys(node)) {
        if (k === 'type' || k === 'start' || k === 'end' || k === 'loc') continue;
        const v = node[k];
        if (Array.isArray(v)) v.forEach(item => isAstNode(item) && collectVars(item));
        else if (isAstNode(v)) collectVars(v);
      }
    };
    collectVars(ast.program);

    // Check feature method/property triggers across the table-using module
    for (const [re, feat] of FEATURE_ATTR_TRIGGERS) {
      if (re.test(code)) features.add(feat);
    }

    let bailReason: string | null = null;

    const visit = (node: AstNode | null | undefined) => {
      if (!isAstNode(node) || bailReason) return;

      // 1. `.columns = expr` or `table.setColumns(expr)`
      if (
        node.type === 'AssignmentExpression' &&
        node.left?.type === 'MemberExpression' &&
        !node.left.computed &&
        node.left.property?.type === 'Identifier' &&
        node.left.property.name === 'columns'
      ) {
        const res = collectStaticColumnTypes(node.right, varInits, cells, features);
        if (!res.ok) {
          bailReason = `${cleanId}: ${res.reason}`;
          return;
        }
      }

      if (
        node.type === 'CallExpression' &&
        node.callee?.type === 'MemberExpression' &&
        !node.callee.computed &&
        node.callee.property?.type === 'Identifier' &&
        node.callee.property.name === 'setColumns' &&
        node.arguments?.length > 0
      ) {
        const res = collectStaticColumnTypes(node.arguments[0], varInits, cells, features);
        if (!res.ok) {
          bailReason = `${cleanId}: ${res.reason}`;
          return;
        }
      }

      // 2. TaggedTemplateExpression (`html`<snice-table .columns=${expr}>``)
      if (node.type === 'TaggedTemplateExpression' && node.quasi?.quasis) {
        const quasis: AstNode[] = node.quasi.quasis;
        const exprs: AstNode[] = node.quasi.expressions ?? [];
        for (let i = 0; i < exprs.length; i++) {
          const prevText = quasis[i]?.value?.cooked ?? '';
          // Look for `.columns=` binding right before this expression inside a <snice-table> tag
          const lastOpen = prevText.lastIndexOf('<snice-table');
          const lastClose = prevText.lastIndexOf('>');
          if (lastOpen > lastClose && /\.columns\s*=\s*$/.test(prevText)) {
            let targetExpr = exprs[i];
            if (
              targetExpr?.type === 'MemberExpression' &&
              targetExpr.object?.type === 'ThisExpression' &&
              targetExpr.property?.type === 'Identifier'
            ) {
              const propInit = varInits.get(`this.${targetExpr.property.name}`);
              if (propInit) targetExpr = propInit;
            }
            const res = collectStaticColumnTypes(targetExpr, varInits, cells, features);
            if (!res.ok) {
              bailReason = `${cleanId}: ${res.reason}`;
              return;
            }
          }
        }
      }

      // 3. JSX `<snice-table ...>` or `<Table ...>`
      if (node.type === 'JSXOpeningElement') {
        const tagName =
          node.name?.type === 'JSXIdentifier' ? node.name.name : '';
        if (tagName === 'snice-table' || tagName === 'Table') {
          foundTableUsage = true;
          for (const attr of node.attributes ?? []) {
            if (attr.type === 'JSXSpreadAttribute') {
              bailReason = `${cleanId}: JSX spread attribute on <${tagName}>`;
              return;
            }
            if (attr.type !== 'JSXAttribute' || attr.name?.type !== 'JSXIdentifier') continue;
            const attrName = attr.name.name;
            if (attrName === 'columns') {
              const colExpr = attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : null;
              const res = collectStaticColumnTypes(colExpr, varInits, cells, features);
              if (!res.ok) {
                bailReason = `${cleanId}: ${res.reason}`;
                return;
              }
            } else {
              if (attrName === 'tree') features.add('treeData');
              for (const [re, feat] of FEATURE_ATTR_TRIGGERS) {
                if (re.test(attrName)) features.add(feat);
              }
            }
          }
        } else if (tagName === 'snice-column') {
          foundTableUsage = true;
          let hasType = false;
          for (const attr of node.attributes ?? []) {
            if (attr.type === 'JSXSpreadAttribute') {
              bailReason = `${cleanId}: JSX spread attribute on <snice-column>`;
              return;
            }
            if (attr.type !== 'JSXAttribute' || attr.name?.type !== 'JSXIdentifier') continue;
            if (attr.name.name === 'type') {
              hasType = true;
              const val =
                attr.value?.type === 'StringLiteral'
                  ? attr.value.value
                  : attr.value?.type === 'JSXExpressionContainer'
                    ? extractStaticString(attr.value.expression)
                    : null;
              if (val === null) {
                bailReason = `${cleanId}: dynamic type prop on JSX <snice-column>`;
                return;
              }
              const canonical = normalizeCellName(val);
              if (!canonical) {
                bailReason = `${cleanId}: unrecognized JSX <snice-column type="${val}">`;
                return;
              }
              cells.add(canonical);
            }
          }
          if (!hasType) cells.add('text');
        }
      }

      for (const k of Object.keys(node)) {
        if (k === 'type' || k === 'start' || k === 'end' || k === 'loc') continue;
        const v = node[k];
        if (Array.isArray(v)) v.forEach(item => isAstNode(item) && visit(item));
        else if (isAstNode(v)) visit(v);
      }
    };
    visit(ast.program);

    if (bailReason) {
      return {
        safe: false,
        reason: bailReason,
        cells: [...CANONICAL_TABLE_CELLS],
        features: [...CANONICAL_TABLE_FEATURES],
      };
    }
  }

  if (!foundTableUsage) {
    return {
      safe: false,
      reason: 'no static <snice-table> usage found in project sources',
      cells: [...CANONICAL_TABLE_CELLS],
      features: [...CANONICAL_TABLE_FEATURES],
    };
  }

  const resolved = resolveTableStripConfig({
    cells: [...cells],
    features: [...features],
  })!;

  return {
    safe: true,
    cells: resolved.cells,
    features: resolved.features,
  };
}

const AUTO_SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.html', '.htm']);
const AUTO_SCAN_SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '.debug', '.local', 'build', 'out']);

export function collectProjectSourcesForTableAuto(rootDir: string): Array<{ id: string; code: string }> {
  const results: Array<{ id: string; code: string }> = [];
  if (!rootDir || !existsSync(rootDir)) return results;

  const walk = (dir: string) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (AUTO_SCAN_SKIP_DIRS.has(entry.name)) continue;
        walk(join(dir, entry.name));
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (!AUTO_SCAN_EXTENSIONS.has(ext)) continue;
        if (entry.name.endsWith('.d.ts') || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) continue;
        const full = join(dir, entry.name);
        try {
          results.push({ id: full, code: readFileSync(full, 'utf8') });
        } catch {
          // ignore unreadable files
        }
      }
    }
  };

  walk(rootDir);
  return results;
}

export function resolveAutoTableStripConfig(rootDir: string): ResolvedTableStripConfig | null {
  const sources = collectProjectSourcesForTableAuto(rootDir);
  const analysis = analyzeTableUsage(sources);
  if (!analysis.safe) return null;
  return resolveTableStripConfig({
    cells: analysis.cells,
    features: analysis.features,
  });
}
