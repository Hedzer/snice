# snice-spreadsheet

Excel-like spreadsheet with formulas, multi-cell selection, undo/redo, column resize, context menu, and auto-expanding grid.

## Properties

```ts
data: any[][] = []
columns: SpreadsheetColumn[] = []
readonly: boolean = false

interface SpreadsheetColumn {
  header: string
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select'
  width?: number
  options?: string[]           // for 'select' type
}

interface CellPosition {
  row: number
  col: number
}

interface CellRange {
  start: CellPosition
  end: CellPosition
}

interface UndoEntry {
  row: number
  col: number
  oldValue: any
  newValue: any
}
```

## Methods

- `getCell(row: number, col: number)` - Get resolved cell value
- `setCell(row: number, col: number, value: any)` - Set cell value (auto-expands data, adds to undo stack)
- `getData()` - Get copy of all data
- `setData(data: any[][])` - Replace all data

## Events

- `cell-change` -> `{ row: number; col: number; value: any; oldValue: any }`
- `cell-select` -> `{ row: number; col: number }`
- `row-select` -> `{ row: number }`
- `column-sort` -> `{ col: number; direction: 'asc' | 'desc' }`

## Formula Support

Cells starting with `=` are evaluated. Supported functions:
- `=SUM(A1:B3)`, `=AVG(A1:A5)`, `=AVERAGE(A1:A5)`
- `=COUNT(A1:A10)`, `=MIN(A1:A5)`, `=MAX(A1:A5)`

## Keyboard Shortcuts

- Arrow keys: Navigate cells
- Shift+Arrow: Extend selection range
- Shift+Click: Extend selection to clicked cell
- Enter/F2: Edit selected cell
- Tab/Shift+Tab: Move to next/previous cell (commits edit, auto-expands grid)
- Escape: Cancel edit
- Delete/Backspace: Clear selected cell(s)
- Ctrl+C/Ctrl+V: Copy/paste (supports tab-separated multi-cell)
- Ctrl+Z: Undo (up to 100 entries)
- Ctrl+Y / Ctrl+Shift+Z: Redo
- Any printable key: Start editing with that character (type-to-edit)

## Multi-Cell Selection

- Click+drag to select range
- Shift+click extends from anchor
- Shift+arrow keys grow selection
- Selected range: light blue fill; anchor cell: 2px blue border
- Status bar shows COUNT, SUM, AVG of numeric cells in selection

## Column Resizing

- Drag right edge of column header to resize
- Min width: 40px
- Widths stored in internal map

## Context Menu (Right-Click)

Items: Cut, Copy, Paste, Insert Row Above/Below, Delete Row, Insert Column Left/Right, Delete Column, Clear Cell(s)

## Row/Column Add Buttons

- "+" row at bottom: appends empty row
- "+" column at right: appends empty column
- Auto-expand on Tab (last col) or Enter (last row)

## Empty State

When data is empty, shows "Double-click or start typing to add data"

## Frozen Headers

- Row numbers: sticky left (visible during horizontal scroll)
- Column headers: sticky top
- Corner cell (top-left): sticky both directions

**CSS Parts:**
- `formula-bar` - The formula bar with cell reference and input
- `base` - The main spreadsheet grid area
- `status-bar` - The bottom status bar showing selection stats
- `context-menu` - The right-click context menu

## CSS Custom Properties

- `--snice-color-border` - Grid lines (default: `rgb(226 226 226)`)
- `--snice-color-background` - Cell background (default: `rgb(255 255 255)`)
- `--snice-color-background-element` - Header/row-number background
- `--snice-color-primary` - Selected cell border (default: `rgb(37 99 235)`)
- `--snice-color-primary-subtle` - Range selection fill / header highlight
- `--snice-color-text` - Cell text color
- `--snice-color-text-secondary` - Formula bar cell ref
- `--snice-color-text-tertiary` - Row numbers, status bar labels

## Usage

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
