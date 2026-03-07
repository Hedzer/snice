
# Data Grid - Sorting
Easily sort your rows based on one or several criteria.


	
		
	
	
		Build in-app chat, video, feeds & moderation, faster. Start coding FREE. No CC required
	

ads via Carbon
Sorting is enabled by default to the Data Grid users and works out of the box without any explicit configuration.
Users can set a sorting rule simply by clicking on a column header.
Following clicks change the column's sorting direction. You can see the applied direction on the header's arrow indicator.
Rows per page:
1–100 of 100

## Single and multi-sorting
The Data Grid can only sort the rows according to one criterion at a time.
To use multi-sorting, you need to upgrade to Pro plan or above.

## Multi-sorting
The following demo lets you sort the rows according to several criteria at the same time.
By default, users need to hold down the Ctrl or Shift (use ⌘ Command on macOS) key while clicking the column header.
You can also enable multi-sorting without modifier keys by setting the multipleColumnsSortingMode prop to "always".
This lets users click on multiple column headers to add them as sorting criteria without needing to hold down modifier keys.

## Pass sorting rules to the Data Grid

### Structure of the model
The sort model is a list of sorting items.
Each item represents a sorting rule and is composed of several elements:
- sortingItem.field: the field on which the rule applies.
- sortingItem.sort: the direction of the sorting ('asc', 'desc', null or undefined). If null or undefined, the rule doesn't apply.

### Initialize the sort model
Sorting is enabled by default to the user.
But if you want to set an initial sorting order, simply provide the model to the initialState prop.
Rows per page:
1–100 of 100

### Controlled sort model
Use the sortModel prop to control the state of the sorting rules.
You can use the onSortModelChange prop to listen to changes in the sorting rules and update the prop accordingly.
Rows per page:
1–100 of 100

## Disable the sorting

### For all columns
Sorting is enabled by default, but you can easily disable this feature by setting the disableColumnSorting prop.
Rows per page:
1–100 of 100

### For some columns
By default, all columns are sortable.
To disable sorting on a column, set the sortable property of GridColDef to false.
In the following demo, the user cannot sort the rating column from the UI.
Rows per page:
1–100 of 100

### Sorting non-sortable columns programmatically
The columns with colDef.sortable set to false are not sortable from the grid UI but could still be sorted programmatically. To add a sort rule to such a column, you could initialize the sortModel, use the sortModel prop, or use the API methods sortColumn or setSortModel.
In the following demo, the firstName column is not sortable by the default grid UI, but it is sorted programmatically by a custom built UI.
Rows per page:
1–9 of 9

## Custom comparator
A comparator determines how two cell values should be sorted.
Each column type comes with a default comparator method.
You can re-use them by importing the following functions:
- gridStringOrNumberComparator (used by the string and singleSelect columns)
- gridNumberComparator (used by the number and boolean columns)
- gridDateComparator (used by the date and date-time columns)
To extend or modify this behavior in a specific column, you can pass in a custom comparator, and override the sortComparator property of the GridColDef interface.

### Create a comparator from scratch
In the following demo, the "Created on" column sorting is based on the day of the month of the createdOn field.
It is a fully custom sorting comparator.
Rows per page:
1–100 of 100

### Combine built-in comparators
In the following demo, the "Name" column combines the name and isAdmin fields.
The sorting is based on isAdmin and then on name, if necessary. It re-uses the built-in sorting comparator.
Rows per page:
1–100 of 100

### Asymmetric comparator
The Data Grid considers the sortComparator function symmetric, automatically reversing the return value for descending sorting by multiplying it by -1.
While this is sufficient for most use cases, it is possible to define an asymmetric comparator using the getSortComparator function – it receives the sorting direction as an argument and returns a comparator function.
In the demo below, the getSortComparator function is used in the "Quantity" column to keep the null values at the bottom when sorting is applied (regardless of the sorting direction):
Rows per page:
1–5 of 5

## Custom sort order
By default, the sort order cycles between these three different modes:
In practice, when you click a column that is not sorted, it will sort ascending (asc).
The next click will make it sort descending (desc). Another click will remove the sort (null), reverting to the order that the data was provided in.

### For all columns
The default sort order can be overridden for all columns with the sortingOrder prop.
In the following demo, columns are only sortable in descending or ascending order.
Rows per page:
1–100 of 100

### Per column
Sort order can be configured (and overridden) on a per-column basis by setting the sortingOrder property of the GridColDef interface:
Rows per page:
1–100 of 100

## Server-side sorting
Sorting can be run server-side by setting the sortingMode prop to server, and implementing the onSortModelChange handler.
Rows per page:
1–100 of 100
You can combine server-side sorting with server-side filtering and server-side pagination to avoid fetching more data than needed, since it's already processed outside of the Data Grid.

## apiRef
Only use this API as the last option. Give preference to the props to control the Data Grid.

### applySorting()Applies the current sort model to the rows.
applySorting()
Applies the current sort model to the rows.

### getRowIdFromRowIndex()Gets the GridRowId of a row at a specific index. The index is based on the sorted but unfiltered row list.
getRowIdFromRowIndex()
Gets the GridRowId of a row at a specific index. The index is based on the sorted but unfiltered row list.

### getSortedRowIds()Returns all row ids sorted according to the active sort model.
getSortedRowIds()
Returns all row ids sorted according to the active sort model.

### getSortedRows()Returns all rows sorted according to the active sort model.
getSortedRows()
Returns all rows sorted according to the active sort model.

### getSortModel()Returns the sort model currently applied to the grid.
getSortModel()
Returns the sort model currently applied to the grid.

### setSortModel()Updates the sort model and triggers the sorting of rows.
setSortModel()
Updates the sort model and triggers the sorting of rows.

### sortColumn()Sorts a column.
sortColumn()
Sorts a column.

## Selectors

### gridSortModelSelectorGet the current sorting model.

### gridSortedRowEntriesSelectorGet the id and the model of the rows after the sorting process.

### gridSortedRowIdsSelectorGet the id of the rows after the sorting process.
More information about the selectors and how to use them on the dedicated page

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Single and multi-sorting
- Multi-sorting
- Pass sorting rules to the Data GridStructure of the modelInitialize the sort modelControlled sort model
- Structure of the model
- Initialize the sort model
- Controlled sort model
- Disable the sortingFor all columnsFor some columnsSorting non-sortable columns programmatically
- For all columns
- For some columns
- Sorting non-sortable columns programmatically
- Custom comparatorCreate a comparator from scratchCombine built-in comparatorsAsymmetric comparator
- Create a comparator from scratch
- Combine built-in comparators
- Asymmetric comparator
- Custom sort orderFor all columnsPer column
- For all columns
- Per column
- Server-side sorting
- apiRef
- Selectors
- API
