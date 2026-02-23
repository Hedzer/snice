[//]: # (AI: For a low-token version of this doc, use docs/ai/components/spreadsheet.md instead)

# Spreadsheet Component

The spreadsheet component provides an Excel-like editable grid with formula support, cell selection, column sorting, copy/paste, and multiple cell types. It supports both reading and editing tabular data with keyboard-driven navigation.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Formula Support](#formula-support)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-spreadsheet></snice-spreadsheet>
```

```typescript
import 'snice/components/spreadsheet/snice-spreadsheet';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `any[][]` | `[]` | Two-dimensional array of cell values |
| `columns` | `SpreadsheetColumn[]` | `[]` | Column definitions with header, type, and width |
| `readonly` | `boolean` | `false` | Prevents cell editing when true |

### SpreadsheetColumn

```typescript
interface SpreadsheetColumn {
  header: string;               // Column header text
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select';  // Cell type
  width?: number;               // Column width in pixels
  options?: string[];           // Available options for 'select' type cells
}
```

### CellPosition

```typescript
interface CellPosition {
  row: number;
  col: number;
}
```

## Methods

#### `getCell(row: number, col: number): any`
Get the resolved value of a cell. For formula cells, returns the computed result.

```typescript
const value = spreadsheet.getCell(0, 1); // Get value at row 0, column 1
```

#### `setCell(row: number, col: number, value: any): void`
Set a cell value. Auto-expands the data grid if the position is beyond current bounds.

```typescript
spreadsheet.setCell(0, 1, 250);
spreadsheet.setCell(2, 0, '=SUM(B1:B2)');
```

#### `getData(): any[][]`
Get a copy of all current data.

```typescript
const allData = spreadsheet.getData();
console.log(allData);
```

#### `setData(data: any[][]): void`
Replace all data in the spreadsheet.

```typescript
spreadsheet.setData([
  ['Alice', 100],
  ['Bob', 200],
  ['Total', '=SUM(B1:B2)']
]);
```

## Events

### `cell-change`
Fired when a cell value is modified.

**Event Detail:**
```typescript
{
  row: number;
  col: number;
  value: any;
  oldValue: any;
}
```

### `cell-select`
Fired when a cell is selected.

**Event Detail:**
```typescript
{
  row: number;
  col: number;
}
```

### `row-select`
Fired when a row is selected (by clicking the row number).

**Event Detail:**
```typescript
{
  row: number;
}
```

### `column-sort`
Fired when a column header is clicked to sort.

**Event Detail:**
```typescript
{
  col: number;
  direction: 'asc' | 'desc';
}
```

## Formula Support

Cells starting with `=` are evaluated as formulas. Supported functions:

| Function | Description | Example |
|----------|-------------|---------|
| `SUM` | Sum of values in range | `=SUM(A1:A5)` |
| `AVG` / `AVERAGE` | Average of values in range | `=AVG(B1:B10)` |
| `COUNT` | Count of non-empty cells in range | `=COUNT(A1:A10)` |
| `MIN` | Minimum value in range | `=MIN(C1:C5)` |
| `MAX` | Maximum value in range | `=MAX(C1:C5)` |

Cell references use spreadsheet-style notation (A1, B2, etc.) where letters are columns and numbers are rows.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow keys | Navigate between cells |
| Enter / F2 | Edit selected cell |
| Tab | Move to next cell (commits edit) |
| Shift+Tab | Move to previous cell (commits edit) |
| Escape | Cancel current edit |
| Delete / Backspace | Clear selected cell |
| Ctrl+C | Copy selected cell(s) |
| Ctrl+V | Paste (supports tab-separated multi-cell paste) |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-border` | Cell border color | `rgb(226 226 226)` |
| `--snice-color-background` | Cell background color | `rgb(255 255 255)` |
| `--snice-color-background-element` | Header and row-number background | _(theme default)_ |
| `--snice-color-primary` | Selected cell outline color | `rgb(37 99 235)` |
| `--snice-color-primary-subtle` | Selected row highlight color | _(theme default)_ |
| `--snice-color-text` | Cell text color | _(theme default)_ |

## Examples

### Basic Spreadsheet with Column Types

Define columns with different cell types and populate with data.

```html
<snice-spreadsheet id="basic-sheet"></snice-spreadsheet>

<script type="module">
  import 'snice/components/spreadsheet/snice-spreadsheet';

  const sheet = document.getElementById('basic-sheet');
  sheet.columns = [
    { header: 'Name', type: 'text' },
    { header: 'Amount', type: 'number', width: 100 },
    { header: 'Status', type: 'select', options: ['Active', 'Pending', 'Done'] }
  ];
  sheet.data = [
    ['Alice', 100, 'Active'],
    ['Bob', 200, 'Pending'],
    ['Charlie', 150, 'Done']
  ];
</script>
```

### Spreadsheet with Formulas

Use formula cells to calculate totals and summaries.

```html
<snice-spreadsheet id="formula-sheet"></snice-spreadsheet>

<script type="module">
  const sheet = document.getElementById('formula-sheet');
  sheet.columns = [
    { header: 'Item', type: 'text', width: 150 },
    { header: 'Q1', type: 'number', width: 80 },
    { header: 'Q2', type: 'number', width: 80 },
    { header: 'Q3', type: 'number', width: 80 },
    { header: 'Q4', type: 'number', width: 80 }
  ];
  sheet.data = [
    ['Revenue', 1200, 1400, 1100, 1600],
    ['Expenses', 800, 900, 750, 1000],
    ['Profit', '=SUM(B1:B1)-SUM(B2:B2)', '=SUM(C1:C1)-SUM(C2:C2)', '=SUM(D1:D1)-SUM(D2:D2)', '=SUM(E1:E1)-SUM(E2:E2)'],
    ['Average', '=AVG(B1:B2)', '=AVG(C1:C2)', '=AVG(D1:D2)', '=AVG(E1:E2)']
  ];
</script>
```

### Read-Only Spreadsheet

Display tabular data in a non-editable spreadsheet.

```html
<snice-spreadsheet id="readonly-sheet" readonly></snice-spreadsheet>

<script type="module">
  const sheet = document.getElementById('readonly-sheet');
  sheet.columns = [
    { header: 'Employee', type: 'text', width: 150 },
    { header: 'Department', type: 'text', width: 120 },
    { header: 'Salary', type: 'number', width: 100 }
  ];
  sheet.data = [
    ['Jane Doe', 'Engineering', 95000],
    ['John Smith', 'Marketing', 78000],
    ['Lisa Chen', 'Engineering', 102000],
    ['Total', '', '=SUM(C1:C3)']
  ];
</script>
```

### Listening for Cell Changes

Track edits by listening for the `cell-change` event.

```html
<snice-spreadsheet id="tracked-sheet"></snice-spreadsheet>
<p id="change-log">Edit a cell to see changes here.</p>

<script type="module">
  import type { SniceSpreadsheetElement } from 'snice/components/spreadsheet/snice-spreadsheet.types';

  const sheet = document.getElementById('tracked-sheet') as SniceSpreadsheetElement;
  const log = document.getElementById('change-log');

  sheet.columns = [
    { header: 'Product', type: 'text' },
    { header: 'Price', type: 'number', width: 80 },
    { header: 'In Stock', type: 'boolean' }
  ];
  sheet.data = [
    ['Widget', 9.99, true],
    ['Gadget', 24.99, false],
    ['Gizmo', 14.99, true]
  ];

  sheet.addEventListener('cell-change', (e) => {
    log.textContent = `Cell [${e.detail.row}, ${e.detail.col}] changed from "${e.detail.oldValue}" to "${e.detail.value}"`;
  });
</script>
```

### Date and Boolean Columns

Use specialized cell types for dates and checkboxes.

```html
<snice-spreadsheet id="typed-sheet"></snice-spreadsheet>

<script type="module">
  const sheet = document.getElementById('typed-sheet');
  sheet.columns = [
    { header: 'Task', type: 'text', width: 200 },
    { header: 'Due Date', type: 'date', width: 120 },
    { header: 'Complete', type: 'boolean', width: 80 }
  ];
  sheet.data = [
    ['Design mockups', '2026-03-01', false],
    ['Write tests', '2026-03-05', true],
    ['Deploy to staging', '2026-03-10', false]
  ];
</script>
```

## Accessibility

- **Keyboard navigation**: Full keyboard support for navigating, editing, and selecting cells
- **ARIA roles**: Grid uses `role="grid"` with `role="row"` and `role="gridcell"` for proper screen reader support
- **Focus management**: Selected cell receives visible focus indicator
- **Column sorting**: Sort buttons in headers are keyboard accessible
- **Edit mode**: Enter/F2 activates cell editing, Escape cancels

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Define column types**: Setting `type` on columns enables appropriate editors (checkboxes for boolean, date pickers for date, dropdowns for select)
2. **Use formulas for computed cells**: Avoid duplicating logic in your application when the spreadsheet can calculate values
3. **Set column widths**: Explicit widths prevent layout shifts and improve readability
4. **Pass data as property**: Use `sheet.data = [...]` rather than setting via attribute
5. **Use readonly for display**: Set `readonly` when the spreadsheet is for viewing only
6. **Limit data size**: For very large datasets, consider pagination or virtual scrolling
