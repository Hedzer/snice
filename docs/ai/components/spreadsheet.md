# snice-spreadsheet

Excel-like spreadsheet with formula support, cell editing, sorting, and copy/paste.

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
```

## Methods

- `getCell(row: number, col: number)` - Get resolved cell value
- `setCell(row: number, col: number, value: any)` - Set cell value (auto-expands data)
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
- Enter/F2: Edit selected cell
- Tab/Shift+Tab: Move to next/previous cell (commits edit)
- Escape: Cancel edit
- Delete/Backspace: Clear cell
- Ctrl+C/Ctrl+V: Copy/paste (supports tab-separated multi-cell paste)

## CSS Custom Properties

- `--snice-color-border` - Cell borders (default: `rgb(226 226 226)`)
- `--snice-color-background` - Cell background (default: `rgb(255 255 255)`)
- `--snice-color-background-element` - Header/row-number background
- `--snice-color-primary` - Selected cell outline (default: `rgb(37 99 235)`)
- `--snice-color-primary-subtle` - Selected row highlight
- `--snice-color-text` - Cell text color

## Usage

```html
<snice-spreadsheet></snice-spreadsheet>
```

```js
const sheet = document.querySelector('snice-spreadsheet');
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
