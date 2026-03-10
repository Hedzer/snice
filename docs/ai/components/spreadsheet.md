# snice-spreadsheet

Excel-like spreadsheet with formulas, multi-cell selection, undo/redo, column resize, context menu, and auto-expanding grid.

## Properties

```typescript
data: any[][] = [];
columns: SpreadsheetColumn[] = [];
readonly: boolean = false;

interface SpreadsheetColumn {
  header: string;
  type?: 'text'|'number'|'date'|'boolean'|'select';
  width?: number;
  options?: string[];           // for 'select' type
}
```

## Methods

- `getCell(row, col)` → `any` - Get resolved cell value (formulas return computed result)
- `setCell(row, col, value)` - Set cell value (auto-expands, adds to undo stack)
- `getData()` → `any[][]` - Get copy of all data
- `setData(data)` - Replace all data

## Events

- `cell-change` → `{ row, col, value, oldValue }`
- `cell-select` → `{ row, col }`
- `row-select` → `{ row }`
- `column-sort` → `{ col, direction: 'asc'|'desc' }`

## CSS Parts

- `formula-bar` - Formula bar with cell reference and input
- `base` - Main spreadsheet grid area
- `status-bar` - Bottom status bar (selection stats)
- `context-menu` - Right-click context menu

## CSS Custom Properties

- `--snice-color-border` - Grid lines (`rgb(226 226 226)`)
- `--snice-color-background` - Cell background (`rgb(255 255 255)`)
- `--snice-color-background-element` - Header/row-number background
- `--snice-color-background-hover` - Row/header hover
- `--snice-color-primary` - Selected cell border (`rgb(37 99 235)`)
- `--snice-color-primary-subtle` - Range selection fill
- `--snice-color-text` - Cell text
- `--snice-color-text-secondary` - Formula bar cell ref
- `--snice-color-text-tertiary` - Row numbers, status bar labels

## Formula Support

Cells starting with `=` are evaluated: `SUM`, `AVG`/`AVERAGE`, `COUNT`, `MIN`, `MAX`. Cell refs use A1 notation.

## Basic Usage

```html
<snice-spreadsheet></snice-spreadsheet>
```

```typescript
sheet.columns = [
  { header: 'Name', type: 'text' },
  { header: 'Amount', type: 'number', width: 100 },
  { header: 'Status', type: 'select', options: ['Active', 'Pending', 'Done'] }
];
sheet.data = [
  ['Alice', 100, 'Active'],
  ['Bob', 200, 'Pending'],
  ['Total', '=SUM(B1:B2)', '']
];

sheet.addEventListener('cell-change', (e) => {
  console.log(`Cell [${e.detail.row},${e.detail.col}] changed to ${e.detail.value}`);
});
```

## Keyboard Navigation

- Arrow keys: navigate cells
- Shift+Arrow: extend selection range
- Enter/F2: edit cell; Escape: cancel
- Tab/Shift+Tab: next/prev cell (commits edit, auto-expands)
- Delete/Backspace: clear cell(s)
- Ctrl+C/V: copy/paste (tab-separated multi-cell)
- Ctrl+Z: undo; Ctrl+Y: redo (up to 100 entries)
- Any printable key: type-to-edit

## Accessibility

- Full keyboard navigation and editing
- Visible focus indicator on selected cell
- Frozen row numbers (sticky left) and column headers (sticky top)
- Context menu: Cut, Copy, Paste, Insert/Delete Row/Column, Clear
- Auto-expanding grid via "+" buttons and Tab/Enter at edges
