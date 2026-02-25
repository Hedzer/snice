[//]: # (AI: For a low-token version of this doc, use docs/ai/components/table.md instead)

# Table
`<snice-table>`

Displays tabular data with sorting, searching, filtering, row selection, and specialized column types.

## Basic Usage

```typescript
import 'snice/components/table/snice-table';
```

```html
<snice-table id="users"></snice-table>

<script>
  const table = document.querySelector('#users');
  table.setColumns([
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'age', label: 'Age', type: 'number', align: 'right' }
  ]);
  table.setData([
    { name: 'Alice Johnson', email: 'alice@example.com', age: 32 },
    { name: 'Bob Smith', email: 'bob@example.com', age: 28 }
  ]);
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/table/snice-table';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-table.min.js"></script>
```

## Examples

### Striped and Hoverable

Use the `striped` attribute for alternating row colors and `hoverable` for row highlight on hover.

```html
<snice-table striped hoverable></snice-table>
```

### List Mode

Use the `list` attribute to hide vertical cell borders for a cleaner list appearance.

```html
<snice-table list></snice-table>
```

### Sortable Columns

Set the `sortable` attribute to enable column sorting. Clicking a column header cycles through ascending, descending, and unsorted states. Multi-column sort is supported.

```html
<snice-table sortable></snice-table>

<script>
  const table = document.querySelector('snice-table');
  table.setColumns([
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', type: 'number', sortable: true },
    { key: 'role', label: 'Role', sortable: false }
  ]);
</script>
```

### Searchable

Set the `searchable` attribute to show a search input above the table.

```html
<snice-table searchable search-debounce="300"></snice-table>
```

### Row Selection

Set the `selectable` attribute to enable row selection with checkboxes and a select-all header checkbox.

```html
<snice-table selectable></snice-table>

<script>
  const table = document.querySelector('snice-table');
  table.addEventListener('table-row-selection-changed', (e) => {
    console.log('Selected rows:', e.detail.selectedRows);
  });
</script>
```

### Clickable Rows

Set the `clickable` attribute to emit events when rows are clicked.

```html
<snice-table clickable></snice-table>

<script>
  const table = document.querySelector('snice-table');
  table.addEventListener('row-clicked', (e) => {
    console.log('Clicked row:', e.detail.rowData);
  });
</script>
```

### Column Types

Use the `type` property on column definitions to apply specialized formatting.

```javascript
table.setColumns([
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'price', label: 'Price', type: 'number', decimals: 2, prefix: '$' },
  { key: 'created', label: 'Created', type: 'date', dateFormat: 'medium' },
  { key: 'active', label: 'Active', type: 'boolean', useSymbols: true },
  { key: 'rating', label: 'Rating', type: 'rating' },
  { key: 'progress', label: 'Progress', type: 'progress' },
  { key: 'trend', label: 'Trend', type: 'sparkline' },
  { key: 'elapsed', label: 'Elapsed', type: 'duration' },
  { key: 'size', label: 'Size', type: 'filesize' }
]);
```

### Loading State

Set the `loading` attribute to dim the table body and show a loading indicator.

```html
<snice-table loading></snice-table>
```

### Declarative Columns and Rows

Use `<snice-column>` and `<snice-row>` elements for a declarative table structure.

```html
<snice-table striped hoverable>
  <snice-column slot="columns" key="name" label="Name"></snice-column>
  <snice-column slot="columns" key="email" label="Email"></snice-column>

  <snice-row slot="rows" data='{"name":"Alice","email":"alice@example.com"}'></snice-row>
  <snice-row slot="rows" data='{"name":"Bob","email":"bob@example.com"}'></snice-row>
</snice-table>
```

### With Controller (Request/Respond)

Use the `@request`/`@respond` pattern to load data from an external source.

```html
<my-table-controller></my-table-controller>
<snice-table searchable sortable></snice-table>

<script type="module">
  import { element, respond } from 'snice';

  @element('my-table-controller')
  class MyTableController extends HTMLElement {
    @respond('table/config')
    getConfig() {
      return {
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status', type: 'boolean' }
        ]
      };
    }

    @respond('table/data')
    async getData(params) {
      const response = await fetch(`/api/users?search=${params.search}`);
      const data = await response.json();
      return { data };
    }
  }
</script>
```

## Slots

| Name | Description |
|------|-------------|
| `columns` | `<snice-column>` elements for declarative column definitions |
| `rows` | `<snice-row>` elements for declarative row data |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `striped` | `boolean` | `false` | Alternating row background colors |
| `searchable` | `boolean` | `false` | Show search input |
| `filterable` | `boolean` | `false` | Show filter dropdown |
| `sortable` | `boolean` | `false` | Enable column sorting |
| `selectable` | `boolean` | `false` | Enable row selection with checkboxes |
| `hoverable` | `boolean` | `true` | Highlight rows on hover |
| `clickable` | `boolean` | `false` | Emit events on row click |
| `list` | `boolean` | `false` | Hide vertical cell borders |
| `searchDebounce` (attr: `search-debounce`) | `number` | `500` | Search input debounce in milliseconds |
| `currentSort` (attr: `current-sort`) | `Array<{ column: string, direction: 'asc' \| 'desc' }>` | `[]` | Current sort state |
| `selector` | `string` | `''` | Current selector filter value |
| `selectorOptions` (attr: `selector-options`) | `Array<{ value: string, label: string }>` | `[]` | Dropdown filter options |
| `loading` | `boolean` | `false` | Show loading state |
| `selectedRows` (attr: `selected-rows`) | `number[]` | `[]` | Indices of selected rows |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `table-row-selection-changed` | `{ selectedRows: number[], rowIndex: number, selected: boolean }` | A row's selection state changed |
| `table-select-all-changed` | `{ selectedRows: number[], allSelected: boolean }` | Select-all checkbox toggled |
| `row-clicked` | `{ rowData: any, rowIndex: number }` | A row was clicked (requires `clickable`) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setData()` | `data: any[]` | Set table row data |
| `setColumns()` | `columns: ColumnDefinition[]` | Set column definitions |
| `renderHeader()` | -- | Re-render the table header |
| `renderBody()` | -- | Re-render the table body |
| `toggleSort()` | `columnKey: string, multiSort?: boolean` | Toggle sort on a column |

## Column Definition

```typescript
interface ColumnDefinition {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percent' |
         'rating' | 'progress' | 'sparkline' | 'accounting' | 'scientific' |
         'fraction' | 'duration' | 'filesize' | 'custom';
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: any, row?: any) => string;
  conditionalFormats?: ConditionalFormat[];
}
```
