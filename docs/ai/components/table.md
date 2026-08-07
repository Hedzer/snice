# snice-table

Local/remote data grid with rich cells, sorting, filters, selection, editing, pagination, virtualization, grouping/aggregation, tree/detail rows, layout tools, DnD, pinning, and export.

## Components

- `<snice-table>` - Host/data API; `<snice-column slot="columns">` - declarative column; `<snice-row slot="rows">` - declarative row; imported `<snice-cell-*>` elements - standalone rich cells

## Properties

```typescript
// <snice-table>; boolean attributes unless noted
striped:boolean=false; searchable:boolean=false; filterable:boolean=false; sortable:boolean=false; selectable:boolean=false;
hoverable:boolean=true; clickable:boolean=false; list:boolean=false; loading:boolean=false; pagination:boolean=false; virtualize:boolean=false; editable:boolean=false; columnResize:boolean=false; headerFilters:boolean=false; // attrs column-resize/header-filters
quickFilter:boolean=false; rowReorder:boolean=false; columnReorder:boolean=false; columnMenu:boolean=false; lazyLoad:boolean=false; // attrs quick-filter/row-reorder/column-reorder/column-menu/lazy-load
mode: 'local'|'remote' = 'local';
columns:ColumnDefinition[]=[]; data:any[]=[]; currentSort:{column:string;direction:'asc'|'desc'}[]=[]; selectedRows:number[]=[]; // JS-only; selectedRows are raw-data indices
listRenderer:((row,index)=>string|HTMLElement)|null=null; // JS-only; full-width custom rows in list mode
searchText:string=''; searchDebounce:number=500; // searchText JS-only; attr search-debounce
selectionMode:'none'|'single'|'multiple'='multiple'; selector:string=''; selectorOptions:{value:string;label:string}[]=[]; // attr selection-mode; options JS-only
groupBy:string|string[]=''; groupDefaults:{expanded?:boolean}={}; // JS-only
paginationMode:'client'|'server'='client'; pageSize:number=10; currentPage:number=1; totalItems:number=0; pageSizes:number[]=[10,25,50,100]; // attrs pagination-mode/page-size/current-page/total-items; pageSizes JS-only
rowHeight:number=48; virtualBuffer:number=200; editMode:'cell'|'row'='cell'; density:'compact'|'standard'|'comfortable'='standard'; // attrs row-height/virtual-buffer/edit-mode
lazyLoadThreshold:number=200; // lazy-load-threshold, px
// <snice-column>; camelCase properties reflect to matching kebab-case attributes unless marked JS-only
key:string=''; label:string=''; type:ColumnType='text'; align:'left'|'center'|'right'='left'; width:string=''; aggregate?:Aggregator; // custom function JS-only
sortable:boolean=true; filterable:boolean=true; wrap:boolean=false; ellipsis:boolean=true; tooltip:boolean=false;
decimals?:number; thousandsSeparator?:boolean; numberPrefix?:string; numberSuffix?:string; negativeStyle?:'parentheses'|'red'|'minus'; dateFormat?:'short'|'medium'|'long'|'full'|'custom'; customDateFormat?:string; dateLocale?:string;
trueValue?:string; falseValue?:string; useSymbols?:boolean; trueSymbol?:string; falseSymbol?:string; ratingMax?:number; ratingSymbol?:string; ratingEmptySymbol?:string; ratingColor?:string;
progressMax?:number; showPercentage?:boolean; progressColor?:string; progressBgColor?:string; progressHeight?:string; sparklineType?:'line'|'bar'|'area'; sparklineColor?:string; sparklineWidth?:number; sparklineHeight?:number;
cellBgColor?:string; cellColor?:string; cellFontWeight?:'normal'|'bold'|'lighter'; cellFontStyle?:'normal'|'italic'; cellFontSize?:string; cellTextDecoration?:'none'|'underline'|'line-through';
// <snice-row>; data/columns/selectionDisabled are JS-only (selectionDisabled is table-owned)
selected:boolean=false; hoverable:boolean=true; clickable:boolean=false; selectable:boolean=false; selectionDisabled:boolean=false;
data:any={}; index:number=0; columns:ColumnDefinition[]=[];
// Standalone cells; column/rowData JS-only. Align: right number/currency/percentage/duration/filesize, center boolean/rating/image, left otherwise. Value: false boolean, 0 rating/progress/duration/filesize, null JSON, '' otherwise. Column: matching definition on generic/core cells, null on runtime-only cells.
interface CellProps {value:any;align:'left'|'center'|'right';type:string;column:ColumnDefinition|null;rowData:any}
class TextCell {multiline:boolean=false;maxLines?:number} // max-lines
class NumberCell {decimals:number=0;thousandsSeparator:boolean=false;prefix:string='';suffix:string='';negativeStyle:'parentheses'|'red'|'minus'='minus';highlight:boolean=false} // thousands-separator, negative-style
class CurrencyCell {decimals:number=2;thousandsSeparator:boolean=true;currency:string='USD';currencyDisplay:'symbol'|'code'|'name'='symbol';locale:string='en-US';negativeStyle:'parentheses'|'red'|'minus'='red';highlight:boolean=false} // thousands-separator, currencydisplay, negative-style
class DateCell {dateFormat:'short'|'medium'|'long'|'full'|'custom'='short';customFormat?:string;locale:string='en-US';relativeTime:boolean=false;showTime:boolean=false} // date-format, custom-format, relative-time, show-time
class BooleanCell {trueValue:string='true';falseValue:string='false';useSymbols:boolean=true;trueSymbol:string='svg';falseSymbol:string='svg'} // true-value, false-value, use-symbols, true-symbol, false-symbol
class PercentageCell {decimals:number=2;showTrend:boolean=false;trendValue:number|null=null;colorize:boolean=true} // attrs showtrend/trendvalue (no hyphens)
class SparklineCell {chartType:'line'|'bar'|'area'='line';color:string='var(--snice-color-primary)';width:number=80;height:number=24;showDots:boolean=false;showBaseline:boolean=false;strokeWidth:number=1.5;minValue?:number;maxValue?:number;data:number[]=[]} // assign data in JS; color/width/height attrs unchanged; other camel names use explicit kebab attrs
class TagCell {tags:string[]=[];variant:string='default'} class StatusCell {status:string='';label:string='';showDot:boolean=true;variant:'online'|'offline'|'busy'|'away'|'custom'='custom'} class ActionsCell {actions:ActionButton[]=[]} // tags/actions JS-only; attr showdot
class LinkCell {href:string='';target:string='_self';external:boolean=false;icon:string='';text:string=''} class EmailCell {email:string='';displayText:string='';showIcon:boolean=true} class PhoneCell {phone:string='';displayText:string='';showIcon:boolean=true;format:boolean=true;country:string='US'} // attrs displaytext/showicon
class ColorCell {color:string='';showSwatch:boolean=true;showHex:boolean=true;showRgb:boolean=false;swatchSize:'small'|'medium'|'large'='medium'} // attrs showswatch/showhex/showrgb/swatchsize
class ImageCell {src:string='';alt:string='';fallback:string='';variant:'rounded'|'square'|'circle'='rounded';size:'small'|'medium'|'large'='medium';lazy:boolean=true;imageError:boolean=false} // attr imageerror
class LocationCell {address:string='';latitude:string='';longitude:string='';showMapLink:boolean=true;mapProvider:'google'|'openstreetmap'|'apple'='google';showIcon:boolean=true} class JsonCell {collapsed:boolean=true;maxDepth:number=3;showToggle:boolean=true} // attrs showmaplink/mapprovider/showicon/maxdepth/showtoggle
// Rating/progress/duration/filesize add no direct format props; rating/progress use JS-only column.ratingFormat/progressFormat.
type ColumnType = 'text'|'number'|'date'|'boolean'|'currency'|'percent'|'percentage'|'rating'|'progress'|'sparkline'|'accounting'|'scientific'|'fraction'|'duration'|'filesize'|'tag'|'status'|'actions'|'link'|'email'|'phone'|'color'|'image'|'location'|'json'|'custom';
interface ColumnDefinition {
  key:string; label:string; type?:ColumnType; align?:'left'|'center'|'right'; width?:string; flex?:number; minWidth?:number; maxWidth?:number;
  sortable?:boolean; filterable?:boolean; resizable?:boolean; reorderable?:boolean; hideable?:boolean; pinnable?:boolean; pinned?:'left'|'right'|false;
  editable?:boolean; exportable?:boolean; editorType?:'text'|'number'|'date'|'boolean'|'select'; selectOptions?:{value:string;label:string}[];
  formatter?:(value:any,row?:any)=>string; valueGetter?:(value:any,row:any)=>any; valueFormatter?:(value:any,row:any)=>string;
  valueParser?:(value:string,row:any)=>any; valueSetter?:(value:any,row:any)=>any; sortComparator?:(a:any,b:any,direction:'asc'|'desc')=>number;
  colSpan?:number|((value:any,row:any)=>number); aggregate?:Aggregator; renderCell?:(value:any,row:any,column:ColumnDefinition)=>HTMLElement|string;
  renderEditor?:(value:any,row:any,column:ColumnDefinition,commit:(v:any)=>void,cancel:()=>void)=>HTMLElement;
  numberFormat?:NumberFormat; dateFormat?:DateFormat; booleanFormat?:BooleanFormat; ratingFormat?:RatingFormat; progressFormat?:ProgressFormat; sparklineFormat?:SparklineFormat;
  percentageFormat?:PercentageFormat; phoneFormat?:PhoneFormat; statusFormat?:StatusFormat; tagFormat?:TagFormat; actionsFormat?:ActionsFormat; linkFormat?:LinkFormat;
  colorFormat?:ColorFormat; currencyFormat?:CurrencyFormat; emailFormat?:EmailFormat; imageFormat?:ImageFormat; jsonFormat?:JsonFormat; locationFormat?:LocationFormat;
  style?:CellStyle; conditionalFormats?:ConditionalFormat[]; wrap?:boolean; ellipsis?:boolean; tooltip?:boolean|((value:any,row?:any)=>string);
}
type Aggregator='sum'|'avg'|'min'|'max'|'count'|((values:any[],rows:any[])=>any);
type NumberFormat={decimals?:number;thousandsSeparator?:boolean;prefix?:string;suffix?:string;negativeStyle?:'parentheses'|'red'|'minus'}; type DateFormat={format?:'short'|'medium'|'long'|'full'|'custom';customFormat?:string;locale?:string};
type BooleanFormat={trueValue?:string;falseValue?:string;useSymbols?:boolean;trueSymbol?:string;falseSymbol?:string}; type RatingFormat={max?:number;symbol?:string;emptySymbol?:string;color?:string};
type ProgressFormat={max?:number;showPercentage?:boolean;color?:string;colorize?:boolean;backgroundColor?:string;height?:string}; type SparklineFormat={type?:'line'|'bar'|'area';color?:string;width?:number;height?:number;showDots?:boolean;showBaseline?:boolean;strokeWidth?:number;minValue?:number;maxValue?:number};
type PercentageFormat={decimals?:number;showTrend?:boolean;trendValue?:number|null;colorize?:boolean}; type PhoneFormat={phone?:string;displayText?:string;showIcon?:boolean;format?:boolean;country?:string};
type StatusFormat={status?:string;label?:string;showDot?:boolean;variant?:'online'|'offline'|'busy'|'away'|'custom'}; type TagFormat={variant?:string};
type ActionsFormat={actions:ActionButton[]}; type ActionButton={action:string;label?:string;icon?:string;variant?:'primary'|'secondary'|'danger'|'success';title?:string;disabled?:boolean};
type LinkFormat={href?:string;target?:string;external?:boolean;icon?:string;text?:string}; type EmailFormat={email?:string;showIcon?:boolean;displayText?:string};
type ColorFormat={color?:string;size?:'small'|'medium'|'large';displayFormat?:'hex'|'rgb'|'hsl'|'name';showSwatch?:boolean;showHex?:boolean;showRgb?:boolean;swatchSize?:'small'|'medium'|'large'};
type CurrencyFormat={currency?:string;locale?:string;display?:'symbol'|'code'|'name';currencyDisplay?:'symbol'|'code'|'name';decimals?:number;thousandsSeparator?:boolean;negativeStyle?:'parentheses'|'red'|'minus'};
type ImageFormat={src?:string;fallback?:string;shape?:'rounded'|'square'|'circle';variant?:'rounded'|'square'|'circle';size?:'small'|'medium'|'large';alt?:string;lazy?:boolean}; type JsonFormat={maxDepth?:number;expanded?:boolean;collapsed?:boolean;showToggle?:boolean};
type LocationFormat={address?:string;latitude?:string|number;longitude?:string|number;showMapLink?:boolean;mapProvider?:'google'|'openstreetmap'|'apple';showIcon?:boolean;lat?:number;lng?:number};
type CellStyle={backgroundColor?:string;color?:string;fontWeight?:'normal'|'bold'|'lighter';fontStyle?:'normal'|'italic';fontSize?:string;textDecoration?:'none'|'underline'|'line-through'}; type ConditionalFormat={condition:(value:any,row?:any)=>boolean;style?:CellStyle;className?:string};
```

- `table.columns =`/`table.data =` rerender; `setData()` is non-eager, so call `renderBody()` when unpaired.
- `searchable` filters locally or requests remotely; `quickFilter` shows a model-backed input; `filterable` is the legacy remote selector.
- Currency uses `snice-cell-currency`. Formatter/valueFormatter, tooltip, base/conditional styles, all declared format aliases, object progress/JSON/sparkline values, sparkline baselines, and already-percent semantics work across Table/declarative/standalone paths.
- `rowReorder`, `columnReorder`, `lazyLoad`, and its threshold are post-mount reactive. List renderers execute in list mode. Density emits `density-change`.
- Limits: pagination shows "Showing 1–25 of 60" or numbered `aria-label="Page N"` (no "Page X of Y"); remote has a 150ms debounce, re-requests only on `currentPage`/`currentSort`/`pageSize`, and keeps rows on a failed reload (⚠️ row + empty-state only with no data); local sort/search are client-side on `data` only.

## Methods

- `getTableConfig()` - Request/apply controller config; `getTableData()` - request/apply current rows; `setData(data)` - non-eager bulk load; `setColumns(columns)` - assign and schedule both renders
- `renderControls()` - Render legacy controls; `renderHeader()` - render headers/tools/filters; `renderSortableHeader(column)` - return sortable-header HTML; `renderBody()` - render display model; `renderPagination()` - render pager
- `createCellElement(column,value,row?)` - Build rendered cell; `getCellTagName(type)` - resolve runtime cell tag
- `getSelectedData()` - Resolve raw selected indices; `setSelectabilityCheck(fn)` - install row predicate; `updateRowSelectionState()` - sync rows; `updateSelectAllState()` - sync select-all
- `toggleSort(key,multi?)` - Cycle direction; `setSortComparator(key,fn)` - install comparator; `goToPage(page)` - clamp/navigate; `setPageSize(size)` - resize/reset page
- `setColumnFilter(column,operator,value)` - Set one filter; `removeColumnFilter(column)` - remove it; `setQuickFilter(text)` - global search; `setFilterModel(model)` - replace model; `getFilterModel()` - read model; `clearAllFilters()` - clear all
- Filter operators: text `contains/notContains/equals/notEquals/startsWith/endsWith/isEmpty/isNotEmpty`; number `eq/neq/gt/gte/lt/lte/isEmpty/isNotEmpty`; date `is/isNot/before/onOrBefore/after/onOrAfter/isEmpty/isNotEmpty`; boolean `isTrue/isFalse`
- `setColumnVisible(key,visible)` - Set visibility; `showAllColumns()` - show all; `hideAllColumns()` - hide hideable; `getColumnVisibility()` - read map; `pinColumn(key,side)` - pin; `unpinColumn(key)` - unpin
- `autoSizeColumn(key)` - Measure one; `autoSizeAllColumns()` - measure all; `moveColumn(key,index)` - move; `setColumnGroups(groups)` - add grouped headers
- `scrollToRow(index)` - Reveal data row; `scrollToColumn(key)` - reveal header; `getScrollPosition()` - read `{top,left}`; `setRowHeight(px)` - set fixed height; `setRowHeightCallback(fn)` - set rendered/virtual height
- `startEdit(row,key)` - Start cell/row edit; `commitEdit()` - validate/commit; `cancelEdit()` - cancel; `setCellEditableCheck(fn)` - install predicate. Parsers/setters receive the real row; setters may return a value or row
- `exportCSV(options?)` - Download filtered raw data; `printTable(options?)` - print visible text with toolbar/footer/checkbox options; `copyToClipboard(options?)` - copy formatted (default) or raw filtered data; `toggleFullscreen()` - toggle native/fallback fullscreen
- `setToolbar(options)` - Install search/sort/filter/export/fullscreen UI; `setListViewRenderer(fn)` - render full-width custom list rows
- `setDetailPanel(options)` - Configure content/height/lazy lifecycle/icons; `expandRow(i)` - expand; `collapseRow(i)` - collapse; `toggleRowExpansion(i)` - toggle; `expandAllRows()` - expand all; `collapseAllRows()` - collapse all
- `setTreeData(options)` - Configure path hierarchy; `expandTreeNode(key)` - expand; `collapseTreeNode(key)` - collapse; `toggleTreeNode(key)` - toggle; `expandAllTreeNodes()` - expand all; `collapseAllTreeNodes()` - collapse all
- `pinRowTop(row)` - Pin above; `pinRowBottom(row)` - pin below; `unpinRow(row)` - unpin same object; `clearPinnedRows()` - clear both areas
- `<snice-column>`: `setFormatter(fn)` - set formatter; `addConditionalFormat(rule)` - append; `removeConditionalFormat(i)` - remove; `clearConditionalFormats()` - clear; `getColumnDefinition()` - build definition
- `<snice-row>`: `select()` - select if allowed; `deselect()` - deselect; `focusRow()` - focus/scroll; `getCellValue(key)` - read; `setCellValue(key,value)` - update; `getCellElement(key)` - find cell; `updateCells()` - reconfigure cells; `highlight(ms?)` - temporary highlight
- Toolbar options: `{showSearch?,showSort?,showFilter?,showExport?,searchPlaceholder?}`; fullscreen always appears; sort/filter buttons edit the header/menu models.
- Remote `table/data` payload: `{search,sort,filter,selector,page?,pageSize?}`; response: `{data,totalItems?}`. Automatic initial request requires `mode="remote"`; page requests also require `pagination-mode="server"`.
- CSV/clipboard resolve raw selected identities before intersecting filters, so active filters cannot retarget selection.

## Events

- `row-clicked` → `{rowData,rowIndex}`
- `selection-changed` → `{selectedRows,rows}`; legacy `table-row-selection-changed` → `{selectedRows,rowIndex,selected}`; `table-select-all-changed` → `{selectedRows,allSelected}`
- `sort-change` → `{sort}`; `filter-change` → `{filters}`; `page-change` → `{page,pageSize,totalPages,totalItems}`
- `column-visibility-change` → `{key,visible,visibility}`; `column-pin-change` → `{key,pinned}`; `column-order-change` → `{key,toIndex}`
- `column-reorder` → `{fromKey,toKey}`; `column-resize`/`column-resize-end` → `{key,width}`; `row-reorder` → `{fromIndex,toIndex}`
- `cell-edit-commit` → `{rowIndex,columnKey,oldValue,newValue}`; `cell-edit-cancel` → `{rowIndex,columnKey}`
- `row-edit-commit` → `{rowIndex,oldRow,newRow}`; `row-edit-cancel` → `{rowIndex}`
- `row-expand`/`row-collapse` → `{rowIndex}`; `detail-toggle` → `{rowIndex,expanded}`; `tree-toggle` → `{key,expanded}`
- `group-toggle` → `{key,value,expanded}`; `<snice-cell-actions>` `cell-action` → `{action,rowData,column}` (bubbles/composed through a table); `lazy-load` → `{currentCount}`; `table-load-error` → `{error}`
- `<snice-column>` `column-changed` → `{column}`; `<snice-row>` `row-click` → `{data,index,element}`; `row-select` → `{selected,data,index,element}`; `row-hover` → `{data,index,element}`; table `density-change` → `{density}`.

## Slots

- `<snice-table>`: `columns`, `rows`, `header`, `empty-state` (cloned into the shadow body on EACH zero-row render — the slotted original is only a template); no default slot. `<snice-column>`: default inert content slot. Cells: no slots.
- CDN Table bundle includes column, row, and cell dependencies. Grouping/aggregation upgrades declarative rows to the native table model.

## CSS Parts

- `<snice-table>`: `body`, `superheader`, `controls`, `toolbar`, `pagination`, `loading-overlay` (refetch spinner while `loading` with rows present), `row` (each native body row), `cell` (each native body cell), `filter-button` (column filter trigger), `sort-indicator` (sort direction); `<snice-row>`: `container`, `checkbox-cell`, `cell`; cells: `content`; actions: `action-button`; JSON: `toggle`; tag: `tag`; link/email/phone/location: `link`

## CSS Custom Properties

- `--snice-table-body-bg`, `--snice-table-group-header-bg`, `--snice-table-group-header-color`, `--snice-table-group-count-bg`, `--snice-table-group-count-color`, `--snice-table-aggregate-bg`, `--snice-table-aggregate-border-color`, `--snice-table-aggregate-color`, `--snice-table-aggregate-label-color`, `--snice-table-cell-padding`, `--snice-table-cell-border` (vertical; `none` drops grid lines), `--snice-table-row-border` (horizontal)

## Basic Usage

```typescript
const table = document.querySelector('snice-table');
table.columns = [{key:'name',label:'Name',sortable:true},{key:'salary',label:'Salary',type:'currency',currencyFormat:{currency:'USD',decimals:0}}];
table.data = employees;
table.setToolbar({showSearch:true,showSort:true,showFilter:true,showExport:true});
```

## Keyboard Navigation

- Grid: arrows, Home/End, Page Up/Down; Enter edits; Space/Shift+Space toggles selection; Ctrl/Cmd+A selects filtered selectable rows. Group/tree/detail buttons: Tab then Enter/Space.

## Accessibility

- Native table uses ARIA grid roles, live counts, roving focus, `aria-sort`, and `aria-selected`; group/tree/detail controls expose labels/`aria-expanded`, and group selection supports mixed state.
