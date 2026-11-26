/**
 * Full-feature registration bundle for default `snice/components/table/snice-table`.
 * Imported BEFORE `@element('snice-table')` defines the custom element so any
 * pre-existing `<snice-table>` in the DOM upgrades with all 21 cells, all 11
 * optional features, and required sibling components already registered.
 */
import '../input/snice-input';
import '../select/snice-select';
import '../button/snice-button';
import '../checkbox/snice-checkbox';
import '../empty-state/snice-empty-state';
// The zero-row loading row and the loading overlay both emit <snice-progress>.
import '../progress/snice-progress';

import './snice-cell-number';
import './snice-cell-date';
import './snice-cell-boolean';
import './snice-cell-rating';
import './snice-cell-progress';
import './snice-cell-duration';
import './snice-cell-filesize';
import './snice-cell-sparkline';
import './snice-cell-percentage';
import './snice-cell-tag';
import './snice-cell-status';
import './snice-cell-actions';
import './snice-cell-link';
import './snice-cell-email';
import './snice-cell-phone';
import './snice-cell-color';
import './snice-cell-location';
import './snice-cell-json';
import './snice-cell-currency';
import './snice-cell-image';

import { TableVirtualizer } from './table-virtualizer';
import { TableFilterEngine } from './table-filter-engine';
import { TableEditor } from './table-editor';
import { TableExport } from './table-export';
import { TableMasterDetail } from './table-master-detail';
import { TableToolbar } from './table-toolbar';
import { TableTreeData } from './table-tree-data';
import { TableGrouping } from './table-grouping';
import { TableColumnMenu } from './table-column-menu';
import { TableRowDnD, TableColumnDnD } from './table-row-dnd';
import { registerTableFeatures } from './table-registry';

registerTableFeatures({
  virtualizer: TableVirtualizer,
  filter: TableFilterEngine,
  editor: TableEditor,
  export: TableExport,
  masterDetail: TableMasterDetail,
  toolbar: TableToolbar,
  treeData: TableTreeData,
  grouping: TableGrouping,
  columnMenu: TableColumnMenu,
  rowDnD: TableRowDnD,
  columnDnD: TableColumnDnD,
});
