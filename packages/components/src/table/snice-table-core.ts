/**
 * Slim modular core entry for `<snice-table>` (`snice/components/table/snice-table-core`).
 *
 * Registers `<snice-table>`, `<snice-column>`, `<snice-row>`, `<snice-cell>`,
 * `<snice-cell-text>`, `TableColumnManager`, and `TableKeyboard` WITHOUT pulling
 * the 20 optional specialized cell components, 11 optional feature classes, or
 * unused sibling components.
 *
 * Note: During distribution builds (`rollup.config.js`), this entry compiles the
 * `SniceTable` class without `table-full-bundle.ts` so omitted cells, features,
 * and siblings are 100% excluded from the module graph while `dist/components/table/snice-table-core.d.ts`
 * exposes the exact `SniceTable` and registration APIs.
 */
export type { SniceTable } from './snice-table';
export type * from './snice-table.types';
export {
  registerTableFeatures,
  hasTableFeature,
  resolveCellTagName,
  getRegisteredCellTagName,
  TABLE_CELL_TAG_MAP,
  type TableFeatureName,
  type TableFeatureConstructors,
} from './table-registry';
