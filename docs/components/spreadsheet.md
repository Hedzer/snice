<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/spreadsheet.md -->

# Spreadsheet

An Excel-like editable grid with formula support, multi-cell range selection, undo/redo, column resizing, context menus, copy/paste, and auto-expanding rows and columns.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `any[][]` | `[]` | Two-dimensional array of cell values |
| `columns` | `SpreadsheetColumn[]` | `[]` | Column definitions with header, type, and width |
| `readonly` | `boolean` | `false` | Prevents cell editing |

### SpreadsheetColumn

```typescript
interface SpreadsheetColumn {
  header: string;               // Column header text
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select';
  width?: number;               // Column width in pixels
  options?: string[];           // Options for 'select' type cells
}
```

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `getCell()` | `row: number, col: number` | `any` | Get resolved cell value (formulas return computed result) |
| `setCell()` | `row: number, col: number, value: any` | `void` | Set cell value (auto-expands grid, adds to undo stack) |
| `getData()` | -- | `any[][]` | Get a copy of all current data |
| `setData()` | `data: any[][]` | `void` | Replace all data |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `cell-change` | `{ row: number, col: number, value: any, oldValue: any }` | A cell value was modified |
| `cell-select` | `{ row: number, col: number }` | A cell was selected |
| `row-select` | `{ row: number }` | A row was selected (clicked row number) |
| `column-sort` | `{ col: number, direction: 'asc' \| 'desc' }` | A column header was clicked to sort |

## CSS Parts

| Part | Description |
|------|-------------|
| `formula-bar` | The formula bar with cell reference and input field |
| `base` | The main spreadsheet grid area |
| `status-bar` | The bottom status bar showing selection statistics |
| `context-menu` | The right-click context menu |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-border` | Grid lines and borders | `rgb(226 226 226)` |
| `--snice-color-background` | Cell background color | `rgb(255 255 255)` |
| `--snice-color-background-element` | Header and row-number background | _(theme default)_ |
| `--snice-color-background-hover` | Row hover and header hover | _(theme default)_ |
| `--snice-color-primary` | Selected cell border color | `rgb(37 99 235)` |
| `--snice-color-primary-subtle` | Range selection fill, header highlight | _(theme default)_ |
| `--snice-color-text` | Cell text color | _(theme default)_ |
| `--snice-color-text-secondary` | Formula bar cell reference text | _(theme default)_ |
| `--snice-color-text-tertiary` | Row numbers, status bar labels, add buttons | _(theme default)_ |

## Basic Usage

```typescript
import 'snice/components/spreadsheet/snice-spreadsheet';
```

```html
<snice-spreadsheet id="sheet"></snice-spreadsheet>

<script>
  const sheet = document.getElementById('sheet');
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

## Examples

### Formula Support

Cells starting with `=` are evaluated as formulas. Supported functions: `SUM`, `AVG`/`AVERAGE`, `COUNT`, `MIN`, `MAX`. Cell references use spreadsheet-style notation (A1, B2).

```typescript
sheet.data = [
  ['Revenue', 1200, 1400, 1100],
  ['Expenses', 800, 900, 750],
  ['Profit', '=B1-B2', '=C1-C2', '=D1-D2'],
  ['Total', '=SUM(B1:B2)', '=AVG(C1:C2)', '=MAX(D1:D2)']
];
```

### Read-Only

Set `readonly` to display data without editing.

```html
<snice-spreadsheet readonly></snice-spreadsheet>
```

### Date and Boolean Columns

Use specialized cell types for dates and checkboxes.

```typescript
sheet.columns = [
  { header: 'Task', type: 'text', width: 200 },
  { header: 'Due Date', type: 'date', width: 120 },
  { header: 'Complete', type: 'boolean', width: 80 }
];
sheet.data = [
  ['Design mockups', '2026-03-01', false],
  ['Write tests', '2026-03-05', true],
];
```

### Event Handling

```typescript
sheet.addEventListener('cell-change', (e) => {
  console.log(`Cell [${e.detail.row}, ${e.detail.col}]: ${e.detail.oldValue} -> ${e.detail.value}`);
});

sheet.addEventListener('column-sort', (e) => {
  console.log(`Column ${e.detail.col} sorted ${e.detail.direction}`);
});
```

### Multi-Cell Selection

- Click and drag to select a range
- Shift+Click to extend selection from the anchor cell
- Shift+Arrow keys to grow selection one cell at a time
- Status bar shows COUNT, SUM, and AVG of numeric cells in the selection

### Context Menu

Right-click any cell for options: Cut, Copy, Paste, Insert Row Above/Below, Delete Row, Insert Column Left/Right, Delete Column, Clear Cell(s).

### Auto-Expanding Grid

- "+" button row at bottom appends a new empty row
- "+" button at right of header appends a new empty column
- Tab at the last column auto-adds a new column
- Enter at the last row auto-adds a new row
- Empty state shows "Double-click or start typing to add data"

## Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| Arrow keys | Navigate between cells |
| Shift+Arrow keys | Extend selection range |
| Enter / F2 | Edit selected cell |
| Tab | Move to next cell (commits edit, auto-expands) |
| Shift+Tab | Move to previous cell (commits edit) |
| Escape | Cancel current edit |
| Delete / Backspace | Clear selected cell(s) |
| Ctrl+C | Copy selected cell(s) |
| Ctrl+V | Paste (supports tab-separated multi-cell paste) |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Any printable key | Start editing with that character |

## Accessibility

- Full keyboard navigation for cells, editing, and selection
- Visible focus indicator (2px blue border) on selected cell
- Column sort buttons are keyboard accessible
- Enter/F2 activates editing, Escape cancels
- Undo/redo history (up to 100 entries) via Ctrl+Z and Ctrl+Y
- Frozen row numbers (sticky left) and column headers (sticky top)
