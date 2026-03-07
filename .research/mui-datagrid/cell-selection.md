
# Data Grid - Cell selection
Let users select individual cells or a range of cells.

## Enabling cell selection
By default, the Data Grid lets users select individual rows.
With the Data Grid Premium, you can apply the cellSelection prop to let users select individual cells or ranges of cells.

## Selecting cells
With the cellSelection prop applied, users can select a single cell by clicking on it, or by pressing Shift+Space when the cell is in focus.
Select multiple cells by holding Cmd (or Ctrl on Windows) while clicking on them.
Hold Cmd (or Ctrl on Windows) and click on a selected cell to deselect it.
To select a range of cells, users can:
- Click on a cell, drag the mouse over nearby cells, and then release.
- Click on a cell, then hold Shift and click on another cell. If a third cell is clicked then the selection will restart from the last clicked cell.
- Use the arrow keys to focus on a cell, then hold Shift and navigate to another cell—if Shift is released and pressed again then the selection will restart from the last focused cell.
Try out the various actions to select cells in the demo below—you can toggle row selection on and off to see how these two selection features can work in parallel.

## Controlling cell selection
You can control which cells are selected using the cellSelectionModel prop.
This prop accepts an object with keys corresponding to the row IDs that contain selected cells.
The value of each key is itself an object, which has a column field for a key and a boolean value for its selection state.
You can set this to true to select a cell or false to deselect it.
Removing the field from the object also deselects the cell.
When a new selection is made, the callback passed to the onCellSelectionModelChange prop is called with the updated model.
Use this value to update the current model.
The following demo shows how these props can be combined to create an Excel-like formula field—try updating multiple cells at once by selecting them and entering a new value in the field at the top.

## Customizing range styles
When multiple selected cells form a continuous range of any size, the following class names are applied to the cells at the edges:
- MuiDataGrid-cell--rangeTop: to all cells in the first row of the range
- MuiDataGrid-cell--rangeBottom: to all cells in the last row of the range
- MuiDataGrid-cell--rangeLeft: to all cells in the first column of the range
- MuiDataGrid-cell--rangeRight: to all cells in the last column of the range
When a single cell is selected, all classes above are applied to that element.
You can use these classes to create CSS selectors targeting specific corners of each range—for example, the demo below adds a border around the outside of the range.

## apiRef
The Data Grid exposes a set of methods via the apiRef object that are used internally in the implementation of the cell selection feature.
The reference below describes the relevant functions.
See API object for more details.
This API should only be used as a last resort when the Data Grid's built-in props aren't sufficient for your specific use case.

### getCellSelectionModel()Returns an object containing the selection state of the cells. The keys of the object correspond to the row IDs. The value of each key is also an object, which has a column field for a key and a boolean value for its selection state.
getCellSelectionModel()
Returns an object containing the selection state of the cells. The keys of the object correspond to the row IDs. The value of each key is also an object, which has a column field for a key and a boolean value for its selection state.

### getSelectedCellsAsArray()Returns an array containing only the selected cells. Each item is an object with the ID and field of the cell.
getSelectedCellsAsArray()
Returns an array containing only the selected cells. Each item is an object with the ID and field of the cell.

### isCellSelected()Determines if a cell is selected or not.
isCellSelected()
Determines if a cell is selected or not.

### selectCellRange()Selects all cells that are inside the range given by start and end coordinates.
selectCellRange()
Selects all cells that are inside the range given by start and end coordinates.

### setCellSelectionModel()Updates the cell selection model according to the value passed to the newModel argument. Any cell already selected will be unselected.
setCellSelectionModel()
Updates the cell selection model according to the value passed to the newModel argument. Any cell already selected will be unselected.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Enabling cell selection
- Selecting cells
- Controlling cell selection
- Customizing range styles
- apiRef
- API
