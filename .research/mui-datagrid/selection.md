
# Data Grid - Row selection
Row selection lets users select and highlight a single row or multiple rows that they can then take action on.


	
		
	
	
		Enterprise apps built on your data, in your cloud, secure by default. All on Retool.
	

ads via Carbon

## Single row selection
Single row selection comes enabled by default for the MIT Data Grid component.
You can select a row by clicking it, or using the keyboard shortcuts.
To unselect a row, click on it again.
Rows per page:
1–10 of 10

## Multiple row selection
On the Data Grid Pro and Data Grid Premium components, you can select multiple rows in two ways:
- To select multiple independent rows, hold the Ctrl (Cmd on MacOS) key while selecting rows.
- To select a range of rows, hold the Shift key while selecting rows.
- To disable multiple row selection, use disableMultipleRowSelection={true}.
Unselect one of the selected rows by holding the Ctrl (Cmd on MacOS) key and clicking on the selected row.
1–10 of 100

## Disable row selection on click
You might have interactive content in the cells and need to disable the selection of the row on click. Use the disableRowSelectionOnClick prop in this case.
Rows per page:
1–10 of 10

## Disable selection on certain rows
Use the isRowSelectable prop to indicate if a row can be selected.
It's called with a GridRowParams object and should return a boolean value.
If not specified, all rows are selectable.
In the demo below only rows with quantity above 50,000 can be selected:
Rows per page:
1–100 of 100

## Row selection with filtering
By default, when the rows are filtered the selection is cleared from the rows that don't meet the filter criteria.
To keep those rows selected even when they're not visible, set the keepNonExistentRowsSelected prop.
Rows per page:
1–10 of 10

## Controlled row selection
Use the rowSelectionModel prop to control the selection.
Each time this prop changes, the onRowSelectionModelChange callback is called with the new selection value.
The row selection model has the following structure:
The model can be either:
- type: 'include': Only the rows with IDs in the ids set are selected
- type: 'exclude': All rows are selected except those with IDs in the ids set
Rows per page:
1–10 of 10

### Opting out of exclude model optimization
To opt out of the exclude model and always use include model and a predictable behavior with explicit row IDs, pass disableRowSelectionExcludeModel prop to the Data Grid.
By default, the Data Grid uses an exclude model optimization when selecting all rows (for example, via "Select all" checkbox) for better performance with large datasets.

## Checkbox selection
To activate checkbox selection set checkboxSelection={true}.
Rows per page:
1–10 of 10

### Custom checkbox column
If you provide a custom checkbox column to the Data Grid with the GRID_CHECKBOX_SELECTION_FIELD field, the Data Grid will not add its own.
We strongly recommend to use the GRID_CHECKBOX_SELECTION_COL_DEF variable instead of re-defining all the custom properties yourself.
In the following demo, the checkbox column has been moved to the right and its width has been increased to 100px.
Rows per page:
1–10 of 10
Always set the checkboxSelection prop to true even when providing a custom checkbox column.
Otherwise, the Data Grid might remove your column.

### Visible rows selection
By default, when you click the "Select All" checkbox, all rows in the Data Grid are selected.
If you want to change this behavior and only select the rows that are currently visible on the page, you can use the checkboxSelectionVisibleOnly prop.
Rows per page:
1–50 of 300

## Usage with server-side pagination
Using the controlled selection with paginationMode="server" may result in selected rows being lost when the page is changed.
This happens because the Data Grid cross-checks with the rows prop and only calls onRowSelectionModelChange with existing row IDs.
Depending on your server-side implementation, when the page changes and the new value for the rows prop does not include previously selected rows, the Data Grid will call onRowSelectionModelChange with an empty value.
To prevent this, enable the keepNonExistentRowsSelected prop to keep the rows selected even if they do not exist.
By using this approach, clicking in the Select All checkbox may still leave some rows selected.
It is up to you to clean the selection model, using the rowSelectionModel prop.
The following demo shows the prop in action:
1–5 of 100

## apiRef
The Data Grid exposes a set of methods via the apiRef object that are used internally in the implementation of the row selection feature.
The reference below describes the relevant functions.
See API object for more details.
This API should only be used as a last resort when the Data Grid's built-in props aren't sufficient for your specific use case.

### getSelectedRows()Returns an array of the selected rows.
getSelectedRows()
Returns an array of the selected rows.

### isRowSelectable()Determines if a row can be selected or not.
isRowSelectable()
Determines if a row can be selected or not.

### isRowSelected()Determines if a row is selected or not.
isRowSelected()
Determines if a row is selected or not.

### selectRow()Change the selection state of a row.
selectRow()
Change the selection state of a row.

### setRowSelectionModel()Sets the new row selection model.⚠️ Caution: setRowSelectionModel doesn't apply the selection propagation automatically. Pass model returned by API method getPropagatedRowSelectionModel instead to apply the selection propagation.
setRowSelectionModel()
Sets the new row selection model.⚠️ Caution: setRowSelectionModel doesn't apply the selection propagation automatically. Pass model returned by API method getPropagatedRowSelectionModel instead to apply the selection propagation.

### getPropagatedRowSelectionModel()Returns the modified selection model after applying row selection propagation.Use this to achieve proper rowSelectionPropagation behavior when setting the selection model using setRowSelectionModel.
getPropagatedRowSelectionModel()
Returns the modified selection model after applying row selection propagation.Use this to achieve proper rowSelectionPropagation behavior when setting the selection model using setRowSelectionModel.

### selectRowRange()Change the selection state of all the selectable rows in a range.
selectRowRange()
Change the selection state of all the selectable rows in a range.

### selectRows()Change the selection state of multiple rows.
selectRows()
Change the selection state of multiple rows.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Single row selection
- Multiple row selection
- Disable row selection on click
- Disable selection on certain rows
- Row selection with filtering
- Controlled row selectionOpting out of exclude model optimization
- Opting out of exclude model optimization
- Checkbox selectionCustom checkbox columnVisible rows selection
- Custom checkbox column
- Visible rows selection
- Usage with server-side pagination
- apiRef
- API
