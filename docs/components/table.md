<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/table.md -->

# Table

`<snice-table>` displays local or remote tabular data with rich cell renderers, sorting, filtering, selection, editing, pagination, virtualization, grouping and aggregation, tree data, master-detail rows, column tools, drag-and-drop, and export helpers. Declarative `<snice-column>` and `<snice-row>` elements are also available for static markup.

## Table of Contents

- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Components

| Element | Description |
|---------|-------------|
| `<snice-table>` | Table host and the primary data, state, and feature API |
| `<snice-column>` | Optional declarative column definition placed in the `columns` slot |
| `<snice-row>` | Optional declarative row placed in the `rows` slot |
| `<snice-cell>` / `<snice-cell-*>` | Generic and specialized standalone cells registered by the Table bundle |

The imperative `columns` and `data` properties are the most complete path. Declarative rows use a lighter layout until a model feature such as grouping or aggregation requires the native table renderer.

## Properties

### Table Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `striped` | `boolean` | `false` | Alternates data-row backgrounds |
| `searchable` | `boolean` | `false` | Shows the search control. Its debounced input applies the local quick filter in local mode and updates `searchText`/requests `table/data` in remote mode |
| `filterable` | `boolean` | `false` | Shows the legacy multi-select control backed by `selectorOptions`. Its value is sent as `selector` in data requests; it is separate from column filters |
| `sortable` | `boolean` | `false` | Enables sortable headers for columns whose `sortable` option is not `false` |
| `selectable` | `boolean` | `false` | Enables row selection when `selectionMode` is not `'none'` |
| `hoverable` | `boolean` | `true` | Highlights rows on hover |
| `clickable` | `boolean` | `false` | Emits `row-clicked` for non-interactive row clicks |
| `list` | `boolean` | `false` | Removes vertical cell borders and, when configured with `listRenderer` (or `setListViewRenderer()`), replaces normal data cells with one row-level rendered cell |
| `listRenderer` | `((row, index) => string \| HTMLElement) \| null` | `null` | JS-only row renderer for `list` mode; bind declaratively with `.listRenderer=${fn}` |
| `loading` | `boolean` | `false` | Fades existing rows and shows a spinner overlay (`loading-overlay` part), or an indeterminate progress indicator when no rows are present |
| `mode` | `'local' \| 'remote'` | `'local'` | In local mode, sorting and filtering use `data`. In remote mode, search, filter, sort, and server-page changes request `table/data` |
| `columns` | `ColumnDefinition[]` | `[]` | Reactive JS-only column definitions; assignment schedules header and body rendering |
| `data` | `any[]` | `[]` | Reactive JS-only rows; assignment schedules body rendering |
| `searchText` | `string` | `''` | Current legacy/controller search text. This is a plain JS field so typing does not rerender and steal focus |
| `searchDebounce` (attr: `search-debounce`) | `number` | `500` | Delay in milliseconds before the legacy search control requests data |
| `currentSort` | `Array<{ column: string; direction: 'asc' \| 'desc' }>` | `[]` | Reactive JS-only sort model. Assignment sorts locally or requests remote data |
| `selectedRows` | `number[]` | `[]` | Reactive JS-only indices into the raw `data` array, not indices into a filtered or sorted page |
| `selectionMode` (attr: `selection-mode`) | `'none' \| 'single' \| 'multiple'` | `'multiple'` | Selection model. `'none'` removes selection controls; `'single'` shows row checkboxes without select-all; `'multiple'` enables row, range, group, and select-all selection |
| `selector` | `string` | `''` | Comma-joined value from the legacy filter selector and the value sent in remote requests |
| `selectorOptions` | `Array<{ value: string; label: string }>` | `[]` | JS-only options for the legacy `filterable` selector |
| `groupBy` | `string \| string[]` | `''` | Reactive JS-only grouping key or ordered grouping keys. An empty value disables hierarchy grouping |
| `groupDefaults` | `{ expanded?: boolean }` | `{}` | JS-only initial group expansion policy. `{ expanded: false }` starts groups collapsed |
| `pagination` | `boolean` | `false` | Shows pagination controls |
| `paginationMode` (attr: `pagination-mode`) | `'client' \| 'server'` | `'client'` | Client mode slices the local display model. Server mode uses `totalItems` and, with `mode="remote"`, requests each page |
| `pageSize` (attr: `page-size`) | `number` | `10` | Rows or flattened display items per page |
| `currentPage` (attr: `current-page`) | `number` | `1` | One-based current page |
| `totalItems` (attr: `total-items`) | `number` | `0` | Total server-side result count. Remote responders return this as `totalItems` |
| `pageSizes` | `number[]` | `[10, 25, 50, 100]` | JS-only page-size choices; the current `pageSize` is added when absent |
| `virtualize` | `boolean` | `false` | Windows rendered rows inside the table frame for large datasets |
| `rowHeight` (attr: `row-height`) | `number` | `48` | Fixed row height in pixels and the virtualizer's row-height estimate |
| `virtualBuffer` (attr: `virtual-buffer`) | `number` | `200` | Extra virtualized pixels rendered above and below the viewport |
| `editable` | `boolean` | `false` | Enables the inline editing engine |
| `editMode` (attr: `edit-mode`) | `'cell' \| 'row'` | `'cell'` | Edits one cell or every editable cell in a row |
| `density` | `'compact' \| 'standard' \| 'comfortable'` | `'standard'` | Changes header and cell padding, rerenders rows, and emits `density-change` after post-mount assignment |
| `columnResize` (attr: `column-resize`) | `boolean` | `false` | Adds draggable resize handles to resizable columns |
| `headerFilters` (attr: `header-filters`) | `boolean` | `false` | Adds debounced contains inputs below filterable headers |
| `quickFilter` (attr: `quick-filter`) | `boolean` | `false` | Shows a debounced local/remote quick-filter input backed by the same model as `setQuickFilter(text)` |
| `rowReorder` (attr: `row-reorder`) | `boolean` | `false` | Adds row drag handles and mutates local row order on drop |
| `columnReorder` (attr: `column-reorder`) | `boolean` | `false` | Makes unpinned, reorderable headers draggable |
| `columnMenu` (attr: `column-menu`) | `boolean` | `false` | Enables the right-click header menu for sort, filter, visibility, pinning, and auto-size |
| `lazyLoad` (attr: `lazy-load`) | `boolean` | `false` | Emits `lazy-load` when the table frame nears its bottom |
| `lazyLoadThreshold` (attr: `lazy-load-threshold`) | `number` | `200` | Bottom distance in pixels that triggers `lazy-load` |

`rowReorder`, `columnReorder`, `lazyLoad`, and `lazyLoadThreshold` are reactive;
they may be changed before or after initialization.

### Column Definitions

Every imperative column requires `key` and `label`.

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: ColumnType;
  align?: 'left' | 'center' | 'right';
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
  exportable?: boolean;

  editorType?: 'text' | 'number' | 'date' | 'boolean' | 'select';
  selectOptions?: Array<{ value: string; label: string }>;
  renderCell?: (value, row, column) => HTMLElement | string;
  renderEditor?: (value, row, column, commit, cancel) => HTMLElement;

  formatter?: (value, row?) => string;
  valueGetter?: (value, row) => any;
  valueFormatter?: (value, row) => string;
  valueParser?: (value: string, row) => any;
  valueSetter?: (value, row) => any;
  sortComparator?: (a, b, direction: 'asc' | 'desc') => number;
  colSpan?: number | ((value, row) => number);
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count' |
    ((values: any[], rows: any[]) => any);

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

  wrap?: boolean;
  ellipsis?: boolean;
  tooltip?: boolean | ((value, row?) => string);
}
```

Column capability flags default to enabled unless explicitly set to `false` when the corresponding table feature is active. `renderCell()` bypasses the built-in renderer; string results are assigned through `textContent`, not parsed as HTML. `renderEditor()` bypasses the built-in editor and must call `commit(value)` or `cancel()`.

`formatter` is the row-aware display override for every built-in cell.
`valueFormatter` is the fallback display formatter and is also used by the
editing pipeline, aggregate output, and formatted clipboard export.
`valueGetter` participates in local sorting and aggregation. `valueParser` and
`valueSetter` run during editing; a setter may return either the final field
value or an updated row object.

The declared `ColumnType` union is:

```typescript
type ColumnType =
  | 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percent'
  | 'percentage' | 'rating' | 'progress' | 'sparkline' | 'accounting'
  | 'scientific' | 'fraction' | 'duration' | 'filesize' | 'tag' | 'status'
  | 'actions' | 'link' | 'email' | 'phone' | 'color' | 'image'
  | 'location' | 'json' | 'custom';
```

All listed strings are recognized by both the runtime table and the exported
TypeScript union. `currency` columns use `<snice-cell-currency>` and honor the
complete `currencyFormat` object.

The formatting option shapes are:

```typescript
interface NumberFormat {
  decimals?: number;
  thousandsSeparator?: boolean;
  prefix?: string;
  suffix?: string;
  negativeStyle?: 'parentheses' | 'red' | 'minus';
}

interface DateFormat {
  format?: 'short' | 'medium' | 'long' | 'full' | 'custom';
  customFormat?: string;
  locale?: string;
}

interface BooleanFormat {
  trueValue?: string;
  falseValue?: string;
  useSymbols?: boolean;
  trueSymbol?: string;
  falseSymbol?: string;
}

interface RatingFormat {
  max?: number;
  symbol?: string;
  emptySymbol?: string;
  color?: string;
}

interface ProgressFormat {
  max?: number;
  showPercentage?: boolean;
  color?: string;
  colorize?: boolean;
  backgroundColor?: string;
  height?: string;
}

interface SparklineFormat {
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

interface PercentageFormat {
  decimals?: number;
  showTrend?: boolean;
  trendValue?: number | null;
  colorize?: boolean;
}

interface CurrencyFormat {
  currency?: string;
  locale?: string;
  display?: 'symbol' | 'code' | 'name';
  currencyDisplay?: 'symbol' | 'code' | 'name';
  decimals?: number;
  thousandsSeparator?: boolean;
  negativeStyle?: 'parentheses' | 'red' | 'minus';
}

interface PhoneFormat {
  phone?: string;
  displayText?: string;
  showIcon?: boolean;
  format?: boolean;
  country?: string;
}

interface StatusFormat {
  status?: string;
  label?: string;
  showDot?: boolean;
  variant?: 'online' | 'offline' | 'busy' | 'away' | 'custom';
}

interface TagFormat { variant?: string }

interface ActionButton {
  action: string;
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  title?: string;
  disabled?: boolean;
}
interface ActionsFormat { actions: ActionButton[] }

interface LinkFormat {
  href?: string;
  target?: string;
  external?: boolean;
  icon?: string;
  text?: string;
}

interface ColorFormat {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  displayFormat?: 'hex' | 'rgb' | 'hsl' | 'name';
  showSwatch?: boolean;
  showHex?: boolean;
  showRgb?: boolean;
  swatchSize?: 'small' | 'medium' | 'large';
}

interface EmailFormat {
  email?: string;
  showIcon?: boolean;
  displayText?: string;
}

interface ImageFormat {
  src?: string;
  fallback?: string;
  shape?: 'rounded' | 'square' | 'circle';
  variant?: 'rounded' | 'square' | 'circle';
  size?: 'small' | 'medium' | 'large';
  alt?: string;
  lazy?: boolean;
}

interface JsonFormat {
  maxDepth?: number;
  expanded?: boolean;
  collapsed?: boolean;
  showToggle?: boolean;
}

interface LocationFormat {
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  showMapLink?: boolean;
  mapProvider?: 'google' | 'openstreetmap' | 'apple';
  showIcon?: boolean;
  lat?: number;
  lng?: number;
}

interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  fontStyle?: 'normal' | 'italic';
  fontSize?: string;
  textDecoration?: 'none' | 'underline' | 'line-through';
}

interface ConditionalFormat {
  condition: (value: any, row?: any) => boolean;
  style?: CellStyle;
  className?: string;
}
```

Compatibility aliases are fully consumed: `display`/`currencyDisplay`,
`size`/`swatchSize`, `shape`/`variant`, `expanded`/`collapsed`, and
`lat`/`latitude` plus `lng`/`longitude`. `tooltip`, base `style`, and the first
matching `conditionalFormats` rule apply consistently to Table cells,
declarative rows, and standalone specialized cells. `wrap` and `ellipsis`
remain text-layout options.

### Declarative Column Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | `string` | `''` | Row-object field |
| `label` | `string` | `''` | Header label |
| `type` | `ColumnType` | `'text'` | Cell type |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Cell alignment |
| `width` | `string` | `''` | CSS width |
| `sortable` | `boolean` | `true` | Allows sorting |
| `filterable` | `boolean` | `true` | Allows filtering |
| `wrap` | `boolean` | `false` | Wraps text content |
| `ellipsis` | `boolean` | `true` | Truncates overflowing text |
| `tooltip` | `boolean` | `false` | Enables a value tooltip |
| `aggregate` | built-in aggregator or function | — | Built-ins work through the `aggregate` attribute; custom reducers are property-only |
| `decimals` | `number` | — | Number decimal places |
| `thousandsSeparator` (attr: `thousands-separator`) | `boolean` | — | Adds digit grouping |
| `numberPrefix` (attr: `number-prefix`) | `string` | — | Number prefix |
| `numberSuffix` (attr: `number-suffix`) | `string` | — | Number suffix |
| `negativeStyle` (attr: `negative-style`) | `'parentheses' \| 'red' \| 'minus'` | — | Negative-number style |
| `dateFormat` (attr: `date-format`) | `'short' \| 'medium' \| 'long' \| 'full' \| 'custom'` | — | Date presentation |
| `customDateFormat` (attr: `custom-date-format`) | `string` | — | Custom date pattern |
| `dateLocale` (attr: `date-locale`) | `string` | — | Date locale |
| `trueValue` / `falseValue` (attrs: `true-value` / `false-value`) | `string` | — | Boolean labels |
| `useSymbols` (attr: `use-symbols`) | `boolean` | — | Uses symbols for booleans |
| `trueSymbol` / `falseSymbol` (attrs: `true-symbol` / `false-symbol`) | `string` | — | Boolean symbols |
| `ratingMax` (attr: `rating-max`) | `number` | — | Maximum rating |
| `ratingSymbol` / `ratingEmptySymbol` | `string` | — | Filled and empty rating symbols |
| `ratingColor` | `string` | — | Rating color |
| `progressMax` (attr: `progress-max`) | `number` | — | Progress maximum |
| `showPercentage` (attr: `show-percentage`) | `boolean` | — | Shows progress percentage |
| `progressColor` / `progressBgColor` | `string` | — | Progress foreground/background colors |
| `progressHeight` | `string` | — | Progress-bar height |
| `sparklineType` | `'line' \| 'bar' \| 'area'` | — | Sparkline form |
| `sparklineColor` | `string` | — | Sparkline color |
| `sparklineWidth` / `sparklineHeight` | `number` | — | Sparkline dimensions |
| `cellBgColor` / `cellColor` | `string` | — | Base cell colors |
| `cellFontWeight` | `'normal' \| 'bold' \| 'lighter'` | — | Cell font weight |
| `cellFontStyle` | `'normal' \| 'italic'` | — | Cell font style |
| `cellFontSize` | `string` | — | Cell font size |
| `cellTextDecoration` | `'none' \| 'underline' \| 'line-through'` | — | Cell decoration |

The camel-case properties in the last rows use their kebab-case attribute equivalents, such as `rating-color`, `progress-bg-color`, and `cell-font-weight`.

### Declarative Row Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selected` | `boolean` | `false` | Selected state |
| `hoverable` | `boolean` | `true` | Hover highlight |
| `clickable` | `boolean` | `false` | Emits `row-click` on activation |
| `selectable` | `boolean` | `false` | Enables the row checkbox and click selection |
| `data` | `any` | `{}` | JS-only row object. If empty, the row collects its `data-*` attributes |
| `index` | `number` | `0` | Row index reported in events |
| `columns` | `ColumnDefinition[]` | `[]` | JS-only definitions used to render cells |

`selectionDisabled` is managed internally by `<snice-table>` when `setSelectabilityCheck()` is used and is not an attribute.

### Standalone Cell Properties

The Table bundle registers `<snice-cell>` plus every `<snice-cell-*>` element
used by the showcase. These elements can be used directly without a table.

#### Common Cell Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `any` | `''` | Display value. Defaults are `false` for boolean, `0` for rating/progress/duration/filesize, and `null` for JSON |
| `align` | `'left' \| 'center' \| 'right'` | Varies | Right for number/currency/percentage/duration/filesize; center for boolean/rating/image; left otherwise |
| `type` | `string` | Tag-specific | Renderer type. Generic `<snice-cell>` defaults to `'text'` |
| `column` | `ColumnDefinition \| null` | Core definition or `null` | JS-only format/formatter configuration; generic/core cells start with a matching definition, runtime-only cells with `null` |
| `rowData` | `any` | `null` | JS-only row context for formatters and `cell-action` |

#### Specialized Cell Properties

When `@property` does not provide an explicit attribute name, Snice currently
lowercases camelCase without inserting hyphens. The actual attributes are
listed below; direct JS property assignment is clearer for names such as
`showMapLink`.

| Element / Property | Type | Default | Description |
|--------------------|------|---------|-------------|
| `<snice-cell-text>` `multiline` | `boolean` | `false` | Allows multiline content |
| `<snice-cell-text>` `maxLines` (attr: `max-lines`) | `number \| undefined` | — | Clamps visible lines |
| `<snice-cell-number>` `decimals` | `number` | `0` | Fraction digits |
| `<snice-cell-number>` `thousandsSeparator` (attr: `thousands-separator`) | `boolean` | `false` | Groups digits |
| `<snice-cell-number>` `prefix` / `suffix` | `string` | `''` | Text before/after the number |
| `<snice-cell-number>` `negativeStyle` (attr: `negative-style`) | `'parentheses' \| 'red' \| 'minus'` | `'minus'` | Negative presentation |
| `<snice-cell-number>` `highlight` | `boolean` | `false` | Highlight styling |
| `<snice-cell-currency>` `decimals` | `number` | `2` | Fraction digits |
| `<snice-cell-currency>` `thousandsSeparator` (attr: `thousands-separator`) | `boolean` | `true` | Public compatibility property; `Intl.NumberFormat` controls grouping |
| `<snice-cell-currency>` `currency` / `locale` | `string` | `'USD'` / `'en-US'` | Currency and locale |
| `<snice-cell-currency>` `currencyDisplay` (attr: `currencydisplay`) | `'symbol' \| 'code' \| 'name'` | `'symbol'` | Currency label style |
| `<snice-cell-currency>` `negativeStyle` (attr: `negative-style`) | `'parentheses' \| 'red' \| 'minus'` | `'red'` | Negative presentation |
| `<snice-cell-currency>` `highlight` | `boolean` | `false` | Highlight styling |
| `<snice-cell-date>` `dateFormat` (attr: `date-format`) | `'short' \| 'medium' \| 'long' \| 'full' \| 'custom'` | `'short'` | Date format |
| `<snice-cell-date>` `customFormat` (attr: `custom-format`) | `string \| undefined` | — | Custom date pattern |
| `<snice-cell-date>` `locale` | `string` | `'en-US'` | Date locale |
| `<snice-cell-date>` `relativeTime` (attr: `relative-time`) | `boolean` | `false` | Relative-time output |
| `<snice-cell-date>` `showTime` (attr: `show-time`) | `boolean` | `false` | Includes time |
| `<snice-cell-boolean>` `trueValue` / `falseValue` (attrs: `true-value` / `false-value`) | `string` | `'true'` / `'false'` | Text labels |
| `<snice-cell-boolean>` `useSymbols` (attr: `use-symbols`) | `boolean` | `true` | Uses symbols instead of labels |
| `<snice-cell-boolean>` `trueSymbol` / `falseSymbol` (attrs: `true-symbol` / `false-symbol`) | `string` | `'svg'` | Symbol values; `'svg'` uses built-in icons |
| `<snice-cell-percentage>` `decimals` | `number` | `2` | Fraction digits |
| `<snice-cell-percentage>` `showTrend` (attr: `showtrend`) | `boolean` | `false` | Shows an arrow when `trendValue` is set |
| `<snice-cell-percentage>` `trendValue` (attr: `trendvalue`) | `number \| null` | `null` | Arrow direction |
| `<snice-cell-percentage>` `colorize` | `boolean` | `true` | Colors positive/negative output |
| `<snice-cell-sparkline>` `chartType` (attr: `chart-type`) | `'line' \| 'bar' \| 'area'` | `'line'` | Chart form |
| `<snice-cell-sparkline>` `color` | `string` | `var(--snice-color-primary)` | Chart color |
| `<snice-cell-sparkline>` `width` / `height` | `number` | `80` / `24` | Rendered chart/image dimensions |
| `<snice-cell-sparkline>` `showDots` / `showBaseline` (attrs: `show-dots` / `show-baseline`) | `boolean` | `false` | Draw point markers and a zero/clamped baseline |
| `<snice-cell-sparkline>` `strokeWidth` (attr: `stroke-width`) | `number` | `1.5` | Line width |
| `<snice-cell-sparkline>` `minValue` / `maxValue` (attrs: `min-value` / `max-value`) | `number \| undefined` | — | Explicit domain |
| `<snice-cell-sparkline>` `data` | `number[]` | `[]` | Alternate series; assign in JS. `value` also accepts arrays, comma text, or JSON |
| `<snice-cell-tag>` `tags` | `string[]` | `[]` | JS-only tags; otherwise comma-separated `value` is parsed |
| `<snice-cell-tag>` `variant` | `string` | `'default'` | Tag style |
| `<snice-cell-status>` `status` / `label` | `string` | `''` | State and display label |
| `<snice-cell-status>` `showDot` (attr: `showdot`) | `boolean` | `true` | Shows the status dot |
| `<snice-cell-status>` `variant` | `'online' \| 'offline' \| 'busy' \| 'away' \| 'custom'` | `'custom'` | State style |
| `<snice-cell-actions>` `actions` | `ActionButton[]` | `[]` | JS-only buttons; may also come from `column.actionsFormat` |
| `<snice-cell-link>` `href` / `text` / `icon` | `string` | `''` | URL, label, and optional icon |
| `<snice-cell-link>` `target` | `string` | `'_self'` | Anchor target |
| `<snice-cell-link>` `external` | `boolean` | `false` | Marks an external link |
| `<snice-cell-email>` `email` / `displayText` (attr for latter: `displaytext`) | `string` | `''` | Address and label |
| `<snice-cell-email>` `showIcon` (attr: `showicon`) | `boolean` | `true` | Shows the email icon |
| `<snice-cell-phone>` `phone` / `displayText` (attr for latter: `displaytext`) | `string` | `''` | Number and label |
| `<snice-cell-phone>` `showIcon` (attr: `showicon`) / `format` | `boolean` | `true` | Icon and number formatting |
| `<snice-cell-phone>` `country` | `string` | `'US'` | Formatting country |
| `<snice-cell-color>` `color` | `string` | `''` | Overrides `value` |
| `<snice-cell-color>` `showSwatch` / `showHex` / `showRgb` (attrs: `showswatch` / `showhex` / `showrgb`) | `boolean` | `true` / `true` / `false` | Visible color representations |
| `<snice-cell-color>` `swatchSize` (attr: `swatchsize`) | `'small' \| 'medium' \| 'large'` | `'medium'` | Swatch size |
| `<snice-cell-image>` `src` / `alt` / `fallback` | `string` | `''` | Image source, alternative text, and fallback source |
| `<snice-cell-image>` `variant` | `'rounded' \| 'square' \| 'circle'` | `'rounded'` | Image shape |
| `<snice-cell-image>` `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Image size |
| `<snice-cell-image>` `lazy` | `boolean` | `true` | Native lazy loading |
| `<snice-cell-image>` `imageError` (attr: `imageerror`) | `boolean` | `false` | Public reflected error state managed after an image failure |
| `<snice-cell-location>` `address` / `latitude` / `longitude` | `string` | `''` | Address or coordinates |
| `<snice-cell-location>` `showMapLink` (attr: `showmaplink`) | `boolean` | `true` | Wraps the location in a map link |
| `<snice-cell-location>` `mapProvider` (attr: `mapprovider`) | `'google' \| 'openstreetmap' \| 'apple'` | `'google'` | Map URL provider |
| `<snice-cell-location>` `showIcon` (attr: `showicon`) | `boolean` | `true` | Shows the location icon |
| `<snice-cell-json>` `collapsed` | `boolean` | `true` | Collapsed state |
| `<snice-cell-json>` `maxDepth` (attr: `maxdepth`) | `number` | `3` | Expansion depth |
| `<snice-cell-json>` `showToggle` (attr: `showtoggle`) | `boolean` | `true` | Shows the toggle |

`<snice-cell-rating>` and `<snice-cell-progress>` have only the common direct
properties; configure their display through JS-only `column.ratingFormat` and
`column.progressFormat`. `<snice-cell-duration>` and `<snice-cell-filesize>`
also use only the common properties. Progress accepts either a number or
`{ value, color? }`; JSON accepts JSON text or a directly assigned object.

Standalone behavior boundaries:

- Generic `<snice-cell type="percent">`, `<snice-cell-percentage>`, and Table percent columns all use already-percent values (`12.5` → `12.50%`). Table uses specialized duration/filesize/rating/progress/sparkline elements.
- Sparkline input accepts arrays, comma/JSON text, `{ values, color }` JSON, or `data`; dots, baseline, stroke width, and explicit min/max values work through direct properties or `sparklineFormat`.
- Tags parse JSON arrays or comma text. Status recognizes common online/offline/busy/away synonyms. Phone formatting handles US 10/11-digit numbers.
- Links auto-open HTTP(S) values externally. Location builds Google, OpenStreetMap, or Apple URLs. JSON supports collapse, toggle, depth controls, JSON text, and direct object assignment.
- Date supports relative time, custom tokens, and optional time. Image supports fallback, `variant`, size, lazy loading, and a placeholder/error state.

## Methods

### Data, Requests, and Rendering

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setColumns()` | `columns: ColumnDefinition[]` | Reactive alias for assigning `columns`; schedules header and body rendering |
| `setData()` | `data: any[]` | Bulk-loads and indexes data without an eager paint. Follow it with `renderBody()`, or use reactive `table.data = rows` |
| `getTableConfig()` | — | Sends `@request/table/config`, then applies `columns` and `selectorOptions` from the response |
| `getTableData()` | — | Sends the current remote request, applies `{ data, totalItems? }`, suppresses stale responses, and renders loading/error states |
| `renderControls()` | — | Rebuilds legacy search/selector controls when needed |
| `renderHeader()` | — | Rebuilds column, group, tool, and header-filter rows |
| `renderSortableHeader()` | `column: ColumnDefinition` | Returns the table's sortable-header HTML string |
| `renderBody()` | — | Rebuilds or reconciles the active row display model |
| `renderPagination()` | — | Rebuilds pagination controls |
| `createCellElement()` | `column, value, row?` | Creates the current built-in or custom-rendered cell element |
| `getCellTagName()` | `type: string` | Returns the runtime cell tag used for a type |

### Selection, Sorting, Filtering, and Pagination

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getSelectedData()` | — | Returns row objects for the raw `selectedRows` indices |
| `setSelectabilityCheck()` | `(row, index) => boolean` | Disables selection for rows that fail the predicate and removes them from current, range, group, and select-all selections |
| `updateRowSelectionState()` | — | Synchronizes rendered rows from `selectedRows` |
| `updateSelectAllState()` | — | Synchronizes the multiple-mode select-all checkbox |
| `toggleSort()` | `columnKey: string, multiSort = false` | Cycles ascending → descending → none. `multiSort=false` replaces other sorts; header clicks pass `true` and therefore accumulate sorts |
| `setSortComparator()` | `columnKey, (a, b, direction) => number` | Installs a custom local comparator |
| `setColumnFilter()` | `column, operator, value` | Adds or replaces one column filter |
| `removeColumnFilter()` | `column: string` | Removes a column filter |
| `setQuickFilter()` | `text: string` | Searches all configured columns. Applies synchronously in local mode and requests data in remote mode |
| `setFilterModel()` | `model: FilterModel` | Replaces column and quick-filter state |
| `getFilterModel()` | — | Returns `{ filters, logic, quickFilter?, quickFilterLogic? }` |
| `clearAllFilters()` | — | Clears column, header, and quick filters |
| `goToPage()` | `page: number` | Clamps and navigates to a page, then emits `page-change` |
| `setPageSize()` | `size: number` | Changes page size, returns to page 1, and emits `page-change` |

Filter operators are type-specific:

- Text: `contains`, `notContains`, `equals`, `notEquals`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`
- Number-like: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `isEmpty`, `isNotEmpty`
- Date: `is`, `isNot`, `before`, `onOrBefore`, `after`, `onOrAfter`, `isEmpty`, `isNotEmpty`
- Boolean: `isTrue`, `isFalse`

### Columns, Layout, and Scrolling

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setColumnVisible()` | `key, visible: boolean` | Changes one hideable column and emits `column-visibility-change` |
| `showAllColumns()` | — | Shows every managed column |
| `hideAllColumns()` | — | Hides all hideable columns |
| `getColumnVisibility()` | — | Returns `{ [columnKey]: boolean }` |
| `pinColumn()` | `key, side: 'left' \| 'right'` | Pins a pinnable column to a physical edge |
| `unpinColumn()` | `key: string` | Removes a column pin |
| `autoSizeColumn()` | `key: string` | Measures the rendered header and body cells |
| `autoSizeAllColumns()` | — | Auto-sizes all managed columns |
| `moveColumn()` | `key, toIndex: number` | Moves an unpinned, reorderable column and emits `column-order-change` |
| `setColumnGroups()` | `Array<{ label, children, headerClass? }>` | Adds a multi-level header row. `children` contains column keys |
| `scrollToRow()` | `index: number` | Scrolls the virtualized display to a raw data row, translating grouped/tree positions when needed |
| `scrollToColumn()` | `columnKey: string` | Scrolls the rendered header into view |
| `getScrollPosition()` | — | Returns the virtualizer's `{ top, left }` position |
| `toggleFullscreen()` | — | Toggles native fullscreen with a CSS fallback |

### Editing and Export

| Method | Arguments | Description |
|--------|-----------|-------------|
| `startEdit()` | `rowIndex, columnKey` | Starts the configured cell or row edit when allowed |
| `commitEdit()` | — | Commits the active edit. Resolves to a cell error string, `'Validation errors'`, or `null` |
| `cancelEdit()` | — | Cancels the active cell or row edit |
| `setCellEditableCheck()` | `(row, columnKey) => boolean` | Adds a per-cell editability predicate on top of column `editable` state |
| `exportCSV()` | `options?: CSVExportOptions` | Downloads raw filtered data as CSV |
| `printTable()` | `options?: PrintOptions` | Opens a print window containing the rendered native table |
| `copyToClipboard()` | `options?: ClipboardOptions` | Copies formatted filtered rows by default, raw rows with `useFormatted: false`, and resolves to success |

```typescript
interface CSVExportOptions {
  delimiter?: string;          // ','
  filename?: string;           // 'export.csv'
  includeHeaders?: boolean;    // true
  selectedOnly?: boolean;      // false
  columns?: string[];
  utf8BOM?: boolean;           // true
}

interface PrintOptions {
  hideFooter?: boolean;
  hideToolbar?: boolean;
  includeCheckboxes?: boolean; // false
  pageStyles?: string;
}

interface ClipboardOptions {
  delimiter?: string;          // tab
  useFormatted?: boolean;      // true
}
```

Selection is resolved against raw `data` first and then intersected with the
filtered view, so selected-only CSV and clipboard output retain the correct row
identity while filters are active. Printing flattens shadow-cell content to
visible text and honors toolbar, footer, and checkbox options.

### Detail, Tree, Row, and List APIs

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setDetailPanel()` | `{ getDetailContent, detailHeight?, lazy?, expandIcon?, collapseIcon? }` | Enables master-detail rows with auto/fixed height, eager or per-expansion content lifecycle, and custom toggle icons |
| `expandRow()` / `collapseRow()` | `index: number` | Expands or collapses a detail row and emits `row-expand` / `row-collapse` |
| `toggleRowExpansion()` | `index: number` | Toggles one detail row |
| `expandAllRows()` / `collapseAllRows()` | — | Changes all detail expansion state without per-row events |
| `setTreeData()` | `{ getPath, groupColumn?, defaultExpansionDepth? }` | Enables path-based hierarchy. Set `data` reactively after this call or explicitly rerender after `setData()` |
| `expandTreeNode()` / `collapseTreeNode()` | `key: string` | Changes one opaque path key and rerenders |
| `toggleTreeNode()` | `key: string` | Toggles one tree key and rerenders |
| `expandAllTreeNodes()` / `collapseAllTreeNodes()` | — | Changes all tree expansion state |
| `pinRowTop()` / `pinRowBottom()` | `row: any` | Adds an independent pinned row above or below the main display model |
| `unpinRow()` | `row: any` | Removes the same row object from both pin areas |
| `clearPinnedRows()` | — | Clears top and bottom pinned rows |
| `setRowHeight()` | `height: number` | Updates the fixed row height and rerenders |
| `setRowHeightCallback()` | `(row, index) => number` | Computes rendered row height and participates in virtual spacer/scroll calculations |
| `setListViewRenderer()` | `(row, index) => string \| HTMLElement` | Renders one full-width list cell per data row while `list` is enabled; strings are assigned as text |

### Toolbar

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setToolbar()` | `ToolbarOptions` | Installs search, sort, filter, optional CSV export, fullscreen, and in-flow model panels |

```typescript
interface ToolbarOptions {
  showSearch?: boolean;       // defaults to true
  showExport?: boolean;       // defaults to false
  searchPlaceholder?: string;
  showSort?: boolean;         // defaults to false
  showFilter?: boolean;       // defaults to false
}
```

Fullscreen is always present. The toolbar search calls `setQuickFilter()` after
a 300 ms debounce. Optional Sort and Filter buttons edit the same multi-sort and
filter models as headers and the column menu; the column menu's **Filter...**
action opens the installed toolbar panel directly.

### Declarative Child Methods

| Element | Method | Description |
|---------|--------|-------------|
| `<snice-column>` | `setFormatter(fn)` | Sets a row-aware formatter and notifies its table |
| `<snice-column>` | `addConditionalFormat(rule)` | Appends a conditional format |
| `<snice-column>` | `removeConditionalFormat(index)` | Removes a conditional format |
| `<snice-column>` | `clearConditionalFormats()` | Clears conditional formats |
| `<snice-column>` | `getColumnDefinition()` | Returns the current imperative definition |
| `<snice-row>` | `select()` / `deselect()` | Changes selection and emits `row-select`; `select()` respects selectability |
| `<snice-row>` | `focusRow()` | Focuses and scrolls the row into view |
| `<snice-row>` | `getCellValue(key)` / `setCellValue(key, value)` | Reads or replaces one data field |
| `<snice-row>` | `getCellElement(key)` | Returns a rendered cell element or `null` |
| `<snice-row>` | `updateCells()` | Reconfigures rendered cells after `data` or `columns` changes |
| `<snice-row>` | `highlight(duration = 2000)` | Temporarily applies the highlight class |

## Events

### Table Events

| Event | Detail | Description |
|-------|--------|-------------|
| `row-clicked` | `{ rowData, rowIndex }` | Non-interactive row click when `clickable` is enabled |
| `selection-changed` | `{ selectedRows, rows }` | Unified user-driven row, range, group, and select-all selection event |
| `table-row-selection-changed` | `{ selectedRows, rowIndex, selected }` | Legacy event for an individual row interaction |
| `table-select-all-changed` | `{ selectedRows, allSelected }` | Legacy select-all event |
| `sort-change` | `{ sort }` | `toggleSort()` or sortable-header state changed |
| `filter-change` | `{ filters: FilterModel }` | A filter API, header input, or toolbar filter changed |
| `page-change` | `{ page, pageSize, totalPages, totalItems }` | `goToPage()` or `setPageSize()` changed pagination |
| `column-visibility-change` | `{ key, visible, visibility }` | `setColumnVisible()` changed visibility |
| `column-pin-change` | `{ key, pinned }` | `pinColumn()` or `unpinColumn()` changed a pin |
| `column-order-change` | `{ key, toIndex }` | `moveColumn()` moved a column programmatically |
| `column-resize` | `{ key, width }` | Live resize movement |
| `column-resize-end` | `{ key, width }` | Resize completed |
| `column-reorder` | `{ fromKey, toKey }` | Header drag-and-drop completed |
| `row-reorder` | `{ fromIndex, toIndex }` | Row drag-and-drop completed |
| `cell-edit-commit` | `{ rowIndex, columnKey, oldValue, newValue }` | Cell edit committed |
| `cell-edit-cancel` | `{ rowIndex, columnKey }` | Cell edit canceled |
| `row-edit-commit` | `{ rowIndex, oldRow, newRow }` | Row edit committed |
| `row-edit-cancel` | `{ rowIndex }` | Row edit canceled |
| `row-expand` | `{ rowIndex }` | Detail row expanded |
| `row-collapse` | `{ rowIndex }` | Detail row collapsed |
| `detail-toggle` | `{ rowIndex, expanded }` | Built-in detail toggle activated |
| `tree-toggle` | `{ key, expanded }` | Built-in tree toggle activated |
| `group-toggle` | `{ key, value, expanded }` | Group header expanded or collapsed. `key` is an opaque stable identity |
| `cell-action` | `{ action, rowData, column }` | Originates on `<snice-cell-actions>` and bubbles/composes through a containing table |
| `lazy-load` | `{ currentCount }` | Scrolled within `lazyLoadThreshold` of the bottom |
| `table-load-error` | `{ error }` | Latest remote data request failed |
| `density-change` | `{ density }` | Post-mount density assignment rerendered the table |

Direct property assignments update controlled state but do not generally emit
the corresponding user-action event; density is the explicit exception.

### Declarative Child Events

| Element | Event | Detail | Description |
|---------|-------|--------|-------------|
| `<snice-column>` | `column-changed` | `{ column }` | A declarative definition changed |
| `<snice-row>` | `row-click` | `{ data, index, element }` | Click/keyboard activation when `clickable` |
| `<snice-row>` | `row-select` | `{ selected, data, index, element }` | Selection changed |
| `<snice-row>` | `row-hover` | `{ data, index, element }` | Pointer entered the row |

## Slots

### `<snice-table>` Slots

| Name | Description |
|------|-------------|
| `columns` | Declarative `<snice-column>` definitions |
| `rows` | Declarative `<snice-row>` data |
| `header` | Super-header content above the native column headers |
| `empty-state` | Custom content cloned into the empty table body |

`<snice-table>` has no default slot.

### Declarative Child Slots

| Element | Name | Description |
|---------|------|-------------|
| `<snice-column>` | (default) | Optional inert metadata/content rendered by the column element itself |
| `<snice-row>` | (none) | Cells are generated from `data` and `columns` |
| `<snice-cell>` / `<snice-cell-*>` | (none) | Standalone cells expose properties and CSS parts, not slots |

## CSS Parts

| Element | Part | Description |
|---------|------|-------------|
| `filter-button` | Column filter trigger |
| `sort-indicator` | Column sort direction indicator |
| `<snice-table>` | `superheader` | Wrapper for the `header` slot in native-table mode |
| `<snice-table>` | `controls` | Legacy search/selector controls |
| `<snice-table>` | `toolbar` | Toolbar installed by `setToolbar()` |
| `<snice-table>` | `pagination` | Pagination wrapper |
| `<snice-table>` | `loading-overlay` | Refetch spinner overlay shown while `loading` with rows present |
| `<snice-row>` | `container` | Standalone declarative row wrapper |
| `<snice-row>` | `checkbox-cell` | Standalone row selection cell |
| `<snice-row>` | `cell` | Standalone row data cells |
| `<snice-table>` | `row` | Each native body row (`<tr>`) |
| `<snice-table>` | `cell` | Each native body cell (`<td>`) |
| Cell components | `content` | Inner content on standalone `snice-cell*` elements |
| `<snice-cell-actions>` | `action-button` | Each standalone action button |
| `<snice-cell-json>` | `toggle` | JSON expand/collapse button |
| `<snice-cell-tag>` | `tag` | Rendered tag badge |
| `<snice-cell-link>`, `<snice-cell-email>`, `<snice-cell-phone>`, `<snice-cell-location>` | `link` | Rendered anchor |

The internal native body exposes `row` and `cell` parts, so page CSS can style body rows and cells directly (e.g. `snice-table::part(cell) { ... }`). Standalone cell-component parts are not forwarded through `<snice-table>`.

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-table-body-bg` | Native table body background | `--snice-color-surface` |
| `--snice-table-group-header-bg` | Group-header background | `--snice-color-surface-container-low` |
| `--snice-table-group-header-color` | Group-header text | `--snice-color-text` |
| `--snice-table-group-count-bg` | Group count badge background | `--snice-color-surface-container-high` |
| `--snice-table-group-count-color` | Group count badge text | `--snice-color-text-secondary` |
| `--snice-table-aggregate-bg` | Aggregate-row background | `--snice-color-surface-container` |
| `--snice-table-aggregate-color` | Aggregate value text | `--snice-color-text` |
| `--snice-table-aggregate-label-color` | Aggregate label text | `--snice-color-text-secondary` |
| `--snice-table-aggregate-border-color` | Grand-total top border | `--snice-color-border` |
| `--snice-table-cell-padding` | Body/header cell padding | `--snice-spacing-xs` `--snice-spacing-sm` |
| `--snice-table-cell-border` | Vertical (right) cell border; set to `none` to drop grid lines | `1px solid --snice-color-border` |
| `--snice-table-row-border` | Horizontal (bottom) row border | `1px solid --snice-color-border` |

The component also consumes global Snice color, spacing, typography, radius, focus-ring, shadow, and transition tokens.

## Basic Usage

Import the table module, then assign `columns` and `data`. These property assignments are reactive and do not need manual rendering.

```typescript
import 'snice/components/table/snice-table';
```

```html
<snice-table id="employees" sortable striped hoverable></snice-table>

<script type="module">
  const table = document.querySelector('#employees');

  table.columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'age', label: 'Age', type: 'number', align: 'right' },
  ];

  table.data = [
    { name: 'Alice Johnson', email: 'alice@example.com', age: 32 },
    { name: 'Bob Smith', email: 'bob@example.com', age: 28 },
  ];
</script>
```

`setColumns()` is equally reactive. `setData()` is deliberately non-eager for bulk loading; pair it with an explicit `renderBody()` or prefer `table.data = rows`.

## Examples

### Density and List Styling

Use `density` and `list` for compact grids or lighter directory rows.

```html
<snice-table id="compact" density="compact" striped></snice-table>
<snice-table id="directory" density="comfortable" list hoverable></snice-table>
```

### Toolbar Search, Export, and Fullscreen

Use `setToolbar()` for local quick search, optional CSV export, and fullscreen.

```javascript
table.setToolbar({
  showSearch: true,
  showExport: true,
  searchPlaceholder: 'Search employees...',
});
```

Header clicks always use additive multi-sort: each new header joins the sort model, and repeated clicks cycle ascending → descending → none.

```html
<snice-table id="employees" sortable></snice-table>
```

To replace the whole sort model programmatically, assign `currentSort` or call `toggleSort(key, false)`.

### Header and Advanced Filters

Use `header-filters` for inline contains filters. Enable `column-menu` and install a toolbar to host the advanced filter panel opened by a header's **Filter...** menu item.

```html
<snice-table id="orders" header-filters column-menu></snice-table>

<script type="module">
  const table = document.querySelector('#orders');
  table.columns = [
    { key: 'customer', label: 'Customer', filterable: true },
    { key: 'total', label: 'Total', type: 'number', filterable: true },
  ];
  table.data = orders;
  table.setToolbar({ showSearch: true, showExport: false });
</script>
```

Use the filter model for deterministic programmatic filtering.

```javascript
table.setFilterModel({
  filters: [
    { column: 'customer', operator: 'contains', value: 'alice' },
    { column: 'total', operator: 'gte', value: 100 },
  ],
  logic: 'and',
  quickFilter: 'priority',
  quickFilterLogic: 'and',
});
```

### Selection Modes

Use `selectable` with `selection-mode`. In multiple mode, a plain click or Ctrl/Cmd-click toggles a row, Shift-click replaces the selection with a contiguous range in the filtered display order, and the header checkbox selects all currently filtered selectable rows.

```html
<snice-table id="approvals" selectable selection-mode="multiple"></snice-table>

<script type="module">
  const table = document.querySelector('#approvals');
  table.setSelectabilityCheck((row) => row.status !== 'Locked');

  table.addEventListener('selection-changed', (event) => {
    console.log(event.detail.selectedRows, event.detail.rows);
  });

  // Runtime mode changes rebuild the selection controls.
  table.selectionMode = 'single';
</script>
```

In single mode, selecting a row replaces the previous selection; its row checkbox can clear the selection. In none mode, selection controls and row-selection behavior are removed.

### Rich Cells and Currency-Looking Columns

Use specialized runtime types for status, progress, actions, and related cells. Use `numberFormat` for currency-looking values inside the table until the table routes `currency` through its dedicated currency cell.

```javascript
table.columns = [
  { key: 'account', label: 'Account', type: 'text' },
  {
    key: 'arr',
    label: 'ARR',
    type: 'number',
    numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 },
  },
  {
    key: 'usage',
    label: 'Usage',
    type: 'progress',
    progressFormat: { max: 100, showPercentage: true, colorize: true },
  },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    statusFormat: { showDot: true },
  },
  {
    key: 'actions',
    label: 'Actions',
    type: 'actions',
    actionsFormat: {
      actions: [{ action: 'inspect', label: 'Inspect', variant: 'primary' }],
    },
  },
];

table.addEventListener('cell-action', (event) => {
  console.log(event.detail.action, event.detail.rowData);
});
```

### Custom Cell and Editor Renderers

Use `renderCell` and `renderEditor` when a built-in type is not enough.

```javascript
const statusColumn = {
  key: 'status',
  label: 'Status',
  renderCell(value) {
    const badge = document.createElement('strong');
    badge.textContent = value;
    return badge;
  },
  renderEditor(value, row, column, commit, cancel) {
    const select = document.createElement('select');
    for (const label of ['Active', 'Paused']) {
      select.add(new Option(label, label, false, label === value));
    }
    select.addEventListener('change', () => commit(select.value));
    select.addEventListener('keydown', event => {
      if (event.key === 'Escape') cancel();
    });
    return select;
  },
};
```

### Cell and Row Editing

Use `editable`, `edit-mode`, editor options, and value pipelines for typed edits.

```html
<snice-table id="people" editable edit-mode="cell"></snice-table>

<script type="module">
  const table = document.querySelector('#people');
  table.columns = [
    { key: 'name', label: 'Name', type: 'text' },
    {
      key: 'role',
      label: 'Role',
      editorType: 'select',
      selectOptions: [
        { value: 'Engineer', label: 'Engineer' },
        { value: 'Manager', label: 'Manager' },
      ],
    },
    {
      key: 'salary',
      label: 'Salary',
      type: 'number',
      valueParser: value => Number(value),
    },
    { key: 'active', label: 'Active', type: 'boolean' },
  ];
  table.data = people;
  table.setCellEditableCheck((row, key) => !(row.locked && key === 'salary'));

  table.startEdit(0, 'role');
  table.addEventListener('cell-edit-commit', event => {
    console.log(event.detail.newValue);
  });
</script>
```

Double-clicking an editable cell or pressing Enter on the focused grid cell starts editing. Enter and blur commit built-in editors; Escape cancels. Set `table.editMode = 'row'` before `startEdit(rowIndex, anyColumnKey)` to edit a whole row.

### Row Grouping and Aggregation

Assign `groupBy` to one key or an ordered key array. Add `aggregate` to columns for per-group subtotals and a filtered grand total.

```javascript
table.columns = [
  { key: 'employee', label: 'Employee' },
  { key: 'department', label: 'Department' },
  { key: 'level', label: 'Level' },
  {
    key: 'salary',
    label: 'Salary',
    type: 'number',
    aggregate: 'sum',
    numberFormat: { prefix: '$', thousandsSeparator: true, decimals: 0 },
  },
  { key: 'headcount', label: 'Headcount', aggregate: 'count' },
];
table.groupBy = ['department', 'level'];
table.groupDefaults = { expanded: true };
table.data = employees;
```

Built-in aggregators are `sum`, `avg`, `min`, `max`, and `count`. Numeric reducers accept numeric strings and ignore null, blank, boolean, and non-numeric values. `count` counts rows. Custom reducers receive values after `valueGetter` and their matching raw rows.

```javascript
{
  key: 'weightedMargin',
  label: 'Weighted Margin',
  valueGetter: (_value, row) => row.revenue * row.marginRate,
  aggregate: (values, rows) => values.reduce((sum, value) => sum + value, 0),
}
```

Sorting runs within groups, filters remove empty groups, and aggregates use filtered rows. Client pagination and virtualization operate on the flattened group/header/data/aggregate sequence. In remote mode, aggregates cover only the currently loaded `data`. Row drops within grouped data can reorder within a group or reparent a row by updating its active grouping fields.

### Client Pagination

Use `pagination-mode="client"` to page the local filtered display model.

```html
<snice-table pagination pagination-mode="client" page-size="25"></snice-table>
```

When grouping or tree data is active, a client page contains flattened visible display items, including structural rows, rather than exactly `pageSize` raw data rows.

### Virtualization and Lazy Loading

Use `virtualize` on a fixed-height table and append data in response to `lazy-load`.

```html
<snice-table
  id="logs"
  style="height: 32rem"
  virtualize
  lazy-load
  row-height="40"
  lazy-load-threshold="240"
></snice-table>

<script type="module">
  const table = document.querySelector('#logs');
  table.columns = logColumns;
  table.data = firstPage;

  let loading = false;
  table.addEventListener('lazy-load', async () => {
    if (loading) return;
    loading = true;
    const next = await loadMore(table.data.length);
    table.data = [...table.data, ...next];
    loading = false;
  });
</script>
```

Guard the handler because continued scrolling can emit more than once.

### Master-Detail Rows

Use `setDetailPanel()` to add an expand control and render detail content below a row.

```javascript
table.setDetailPanel({
  getDetailContent(row) {
    const panel = document.createElement('div');
    panel.style.padding = '1rem';
    panel.textContent = `${row.name} — ${row.email}`;
    return panel;
  },
});
```

String detail content is parsed as HTML; use trusted strings or return an `HTMLElement` for untrusted data.

### Tree Data

Call `setTreeData()` before assigning `data` reactively. Each row's path identifies its place in the hierarchy; missing ancestors become generated gap nodes.

```javascript
const table = document.querySelector('#org-tree');

table.columns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
];

table.setTreeData({
  getPath: row => row.path,
  groupColumn: 'name',
  defaultExpansionDepth: 1,
});

table.data = [
  { name: 'Engineering', role: 'Department', path: ['Engineering'] },
  { name: 'Alice', role: 'Staff Engineer', path: ['Engineering', 'Alice'] },
  { name: 'Bob', role: 'Engineer', path: ['Engineering', 'Bob'] },
  { name: 'Design', role: 'Department', path: ['Design'] },
  { name: 'Diana', role: 'Designer', path: ['Design', 'Diana'] },
];
```

`defaultExpansionDepth: 0` starts collapsed; `1` expands root nodes; `Infinity` expands all levels. Tree node keys are slash-joined paths, such as `Engineering/Alice`.

### Column Groups and Layout Controls

Use `setColumnGroups()` for multi-level headers and column methods for layout state.

```javascript
table.setColumnGroups([
  { label: 'Personal', children: ['name', 'age'] },
  { label: 'Work', children: ['department', 'salary'] },
]);

table.pinColumn('name', 'left');
table.pinColumn('salary', 'right');
table.setColumnVisible('age', false);
table.autoSizeAllColumns();
table.moveColumn('department', 1);
```

Enable `column-resize`, `column-reorder`, and `column-menu` for equivalent pointer controls. Pinned headers stay at their physical edges and are not draggable.

### Row Reordering and Pinning

Use `row-reorder` for local drag-and-drop, and pin independent summary rows with the row-pinning methods.

```html
<snice-table id="priorities" row-reorder></snice-table>

<script type="module">
  table.pinRowTop({ task: 'Critical incident', owner: 'On-call' });
  table.pinRowBottom({ task: 'End of queue', owner: 'Unassigned' });

  table.addEventListener('row-reorder', event => {
    console.log(event.detail.fromIndex, event.detail.toIndex);
  });
</script>
```

Pinned rows are separate from `data`, use index `-1`, and remain outside sorting and filtering.

### List Renderer

`list` removes outer/vertical borders. Set the `listRenderer` property to
replace each row's normal data cells with one full-width custom row — in a
template, bind it with `.listRenderer=${fn}`. The imperative
`setListViewRenderer()` equivalent remains available. Tool cells such as
selection and detail toggles remain available.

```javascript
table.list = true;
table.listRenderer = (row) => {
  const card = document.createElement('article');
  card.textContent = `${row.name} · ${row.department}`;
  return card;
};
```

### Loading and Empty States

Use `loading` for progress and the `empty-state` slot for a custom zero-row message.

```html
<snice-table id="results" loading>
  <div slot="empty-state">No employees match this view.</div>
</snice-table>
```

The slotted empty content is **cloned** into the table body on each zero-row render — the light-DOM original is only a template, so event listeners or state on the slotted node do not carry over, and updating the slotted copy only takes effect on the next zero-row render. Remove `loading` after the request completes so the empty state can appear.

### Remote Data with Request/Response Events

Use `mode="remote"` with server pagination. The request payload contains `search`, `sort`, `filter`, and `selector`, plus `page` and `pageSize` when pagination is enabled. Resolve with `{ data, totalItems }`.

```html
<snice-table
  id="accounts"
  mode="remote"
  sortable
  pagination
  pagination-mode="server"
  page-size="25"
></snice-table>

<script type="module">
  const table = document.querySelector('#accounts');
  table.columns = accountColumns;
  table.setToolbar({ showSearch: true, showExport: false });

  table.addEventListener('@request/table/data', async (event) => {
    event.stopImmediatePropagation();
    const { payload, discovery, data: response } = event.detail;
    discovery.resolve();

    try {
      const result = await fetchAccounts(payload);
      response.resolve({ data: result.rows, totalItems: result.totalItems });
    } catch (error) {
      response.reject(error);
    }
  });

  table.getTableData();
</script>
```

Only the newest overlapping request may update the table. A rejected latest request emits `table-load-error` and renders its error message.

### Remote Data with a Controller

Set `mode="remote"` when a controller provides `table/config` and `table/data`; local-mode controller attachment intentionally does not fetch.

```html
<snice-table
  controller="user-table"
  mode="remote"
  sortable
  pagination
  pagination-mode="server"
></snice-table>
```

```typescript
import { controller, respond, IController } from 'snice';

@controller('user-table')
class UserTableController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach() {}

  @respond('table/config')
  async getTableConfig() {
    return {
      columns: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'active', label: 'Active', type: 'boolean' },
      ],
      selectorOptions: [
        { value: 'staff', label: 'Staff' },
        { value: 'contractor', label: 'Contractors' },
      ],
    };
  }

  @respond('table/data')
  async getTableData(params: {
    search: string;
    sort: Array<{ column: string; direction: 'asc' | 'desc' }>;
    filter: FilterModel;
    selector: string;
    page?: number;
    pageSize?: number;
  }) {
    const query = new URLSearchParams({
      search: params.search,
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 10),
    });
    const response = await fetch(`/api/users?${query}`);
    const json = await response.json();
    return { data: json.users, totalItems: json.totalItems };
  }
}
```

### Declarative Columns and Rows

Use slotted children for static markup. In HTML, individual `data-*` attributes
populate rows; the `data` object itself is a JS-only property.

```html
<snice-table striped hoverable selectable>
  <snice-column slot="columns" key="name" label="Name"></snice-column>
  <snice-column
    slot="columns"
    key="salary"
    label="Salary"
    type="number"
    aggregate="sum"
    number-prefix="$"
    thousands-separator
  ></snice-column>

  <snice-row
    slot="rows"
    data-name="Alice"
    data-salary="125000"
  ></snice-row>
  <snice-row
    slot="rows"
    data-name="Bob"
    data-salary="98000"
  ></snice-row>
</snice-table>
```

For JS row objects, custom aggregators, or formatters, assign the child
property/method after connection.

```javascript
const bob = table.querySelectorAll('snice-row')[1];
bob.data = { name: 'Bob', salary: 98000 };

const salary = table.querySelector('snice-column[key="salary"]');
salary.aggregate = values => values.reduce((sum, value) => sum + Number(value), 0);
salary.setFormatter(value => `$${Number(value).toLocaleString()}`);
```

### Export and Clipboard

Use export helpers on the current filtered data.

```javascript
table.exportCSV({
  filename: 'employees.csv',
  columns: ['name', 'department', 'salary'],
  selectedOnly: true,
});

const copied = await table.copyToClipboard({ delimiter: '\t' });
table.printTable({ pageStyles: '@page { size: landscape; }' });
```

CSV output uses raw row values and skips columns with `exportable: false`.
Clipboard output uses formatted values by default and copies every filtered row
when selection is empty. With a selection, both helpers intersect the correct
raw row identities with the filtered view.

## Limits Worth Knowing

Behaviors that are fixed by design and worth checking against your page's
contract before adopting the table:

- **Pagination labels.** The built-in `pagination` renders "Showing 1–25 of 60" with plain prev/next-style buttons; `snice-pagination` renders numbered `aria-label="Page N"` buttons. Neither produces a "Page X of Y" contract.
- **Remote-mode debounce.** `mode="remote"` requests are debounced by a hard-coded 150 ms.
- **Failed remote loads keep their rows.** With data present, a failed re-request leaves the previous rows on screen; the `⚠️` warning row and the `empty-state` slot only appear when there is no data at all.
- **Remote re-request triggers.** Remote mode re-requests only on `currentPage`, `currentSort`, and `pageSize` changes. A page that owns its own filter set must reset one of those (e.g. `currentPage`) to drive a refetch.
- **Local mode is client-side.** `sortable`/`searchable` in local mode sort and filter the rows already in `data` — on a server-paged list that is one page of results.

## Keyboard Navigation

- Arrow keys move between grid cells.
- Home and End move to the first and last cell in a row.
- Ctrl/Cmd+Home and Ctrl/Cmd+End move to the first and last grid cell.
- Page Up and Page Down move by the visible page size.
- Enter activates an editable focused cell.
- Space or Shift+Space toggles the focused row when selection is enabled.
- Ctrl/Cmd+A selects or clears all currently filtered selectable rows in multiple mode.
- Tab moves through grid cells because the table uses the keyboard module's `all` tab mode.
- Group, tree, and detail chevrons are native buttons; focus them with Tab and activate with Enter or Space.
- Escape cancels the active built-in editor and exits native fullscreen through browser behavior.

## Accessibility

- The native table is enhanced with `role="grid"`, `aria-rowcount`, and `aria-colcount`.
- Header and data cells receive `columnheader`/`gridcell` roles, one-based ARIA indices, and a roving `tabindex`.
- Sortable headers expose `aria-sort`; multi-sort order is also shown visually.
- Selected data rows expose `aria-selected="true"`.
- Single selection labels its selector column and omits the misleading select-all control.
- Conditional selectability disables row checkboxes and excludes those rows from range, group, and select-all operations.
- Group rows expose an accessible group label, descendant count, and `aria-expanded`; group selection uses checked, unchecked, and mixed states.
- Tree and detail toggles expose `aria-expanded` and action labels.
- Aggregate rows and grand totals have distinct accessible labels and are included in the visible row count.
- Virtualized rows retain logical ARIA row indices as the rendered window changes.
- Focus indicators use `:focus-visible` and inherited Snice focus-ring tokens.
