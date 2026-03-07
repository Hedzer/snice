
# Data Grid - Drag-and-drop column reordering
The Data Grid Pro lets users drag and drop columns to reorder them.
Columns are organized according to the order in which they're provided in the columns array.
By default, the Data Grid Pro lets users reorder columns by dragging and dropping the header cells—give it a try in the demo below:

## Column reordering events
Column reordering emits the following events:
- columnHeaderDragStart: emitted when the user starts dragging the header cell.
- columnHeaderDragEnter: emitted when the cursor enters another header cell while dragging.
- columnHeaderDragOver: emitted when the user drags a header cell over another header cell.
- columnHeaderDragEnd: emitted when the user stops dragging the header cell.

## Disabling column reordering
Drag-and-drop column reordering is enabled by default on the Data Grid Pro, but you can disable it for some or all columns.

### For all columns
To disable reordering for all columns, set the disableColumnReorder prop to true:

### For specific columns
To disable reordering for a specific column, set the disableReorder property to true in the column's GridColDef, as shown below:

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Column reordering events
- Disabling column reorderingFor all columnsFor specific columns
- For all columns
- For specific columns
- API
