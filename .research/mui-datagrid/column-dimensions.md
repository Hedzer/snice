
# Data Grid - Column dimensions
Customize the dimensions and resizing behavior of your columns.


	
		
	
	
		Start an annual website plan, and get a free domain name with Squarespace.
	

ads via Carbon

## Column width
By default, the columns have a width of 100px.
This is an arbitrary, easy-to-remember value.
To change the width of a column, use the width property available in GridColDef.
Rows per page:
1–1 of 1

### Minimum width
By default, the columns have a minimum width of 50px.
This is an arbitrary, easy-to-remember value.
To change the minimum width of a column, use the minWidth property available in GridColDef.
Rows per page:
1–1 of 1

### Fluid width
Column fluidity or responsiveness can be achieved by setting the flex property in GridColDef.
The flex property accepts a value between 0 and ∞.
It works by dividing the remaining space in the Data Grid among all flex columns in proportion to their flex value.
For example, consider a grid with a total width of 500px that has three columns: the first with width: 200; the second with flex: 1; and the third with flex: 0.5.
The first column will be 200px wide, leaving 300px remaining. The column with flex: 1 is twice the size of flex: 0.5, which means that final sizes will be: 200px, 200px, 100px.
To set a minimum and maximum width for a flex column set the minWidth and the maxWidth property in GridColDef.
Before using fluid width, note that:
- flex doesn't work together with width. If you set both flex and width in GridColDef, flex will override width.
- flex doesn't work if the combined width of the columns that have width is more than the width of the Data Grid itself. If that is the case a scroll bar will be visible, and the columns that have flex will default back to their base value of 100px.
Rows per page:
1–1 of 1

## Resizing
By default, users can resize all columns in the Data Grid by dragging the right portion of the column separator.
To prevent the resizing of a column, set resizable: false in the GridColDef.
Alternatively, to disable all columns resize, set the prop disableColumnResize={true}.
To restrict resizing a column under a certain width set the minWidth property in GridColDef.
To restrict resizing a column above a certain width set the maxWidth property in GridColDef.
Rows per page:
1–1 of 1
To capture changes in the width of a column there are two callbacks that are called:
- onColumnResize: Called while a column is being resized.
- onColumnWidthChange: Called after the width of a column is changed, but not during resizing.

## Autosizing
Autosizing is the feature to adjust the width of a column to fit its content including the header and the outliers (cells with long content).
It respects the minWidth and maxWidth options defined in the columns definition prop.
To configure autosizing behavior, use the autosizeOptions with the following options:
- columns: An array of column field names to autosize. If not provided, all columns will be autosized.
- includeHeaders: A boolean to indicate whether to include the header content when autosizing. Default is true.
- includeOutliers: A boolean to indicate whether to include outlier cells when autosizing. Default is false.
- outliersFactor: A number representing the factor to determine outliers. Default is 1.5.
- expand: A boolean, if the total width is less than the available width, expand columns to fill it. Default is false.
- disableColumnVirtualization: A boolean to include virtualized columns (not rendered in the DOM) when autosizing. Default is true.
- includeHeaderFilters : A boolean to indicate whether to include the header filter content when autosizing. Default is false.
Rows per page:
1–100 of 100
The autosizeOptions only applies to the column header separator and the autosizeOnMount prop.
It does not apply to the autosizeColumns() method when you call it programmatically, you have to pass the options directly.

### Column header separator
Autosizing can be triggered by double-clicking the column header separator.
To disable this behavior, use the disableAutosize prop.
Note that for the separator double-click method, the autosizeOptions.columns will be replaced by the respective column user double-clicked on.

### Autosizing on mount
To automatically autosize columns when the Data Grid is mounted, use the autosizeOnMount prop.

### Autosizing programmatically
Use API method apiRef.current.autosizeColumns(autosizeOptions) to adjust the column size programmatically. Common usage could be to bind it with specified events, for example when receiving row data from the server.
This example uses ReactDOM.flushSync. If used incorrectly it can hurt the performance of your application. Please refer to the official React docs for further information.

### Autosizing virtualized columns
Use autoSizeColumns({ disableColumnVirtualization: true}) to include columns that are not visible in the DOM due to column virtualization.
The time to complete the autosizing operation exponentially depends on the number of virtualized columns.
Rows per page:
1–100 of 100

### Autosizing with dynamic row height
Column autosizing is compatible with the Dynamic row height feature.
Rows per page:
1–100 of 200
When autosizing columns with long content, consider setting the maxWidth for the column to avoid it becoming too wide.

### Autosizing header filters
To include the header filter content when autosizing columns, pass the includeHeaderFilters to the autosizeOptions.
or when calling the autosizeColumns() method programmatically:

### Autosizing with grouped rows
When using row grouping you can utilize the autosizeColumns method to adjust the column width of the expanded rows dynamically.
The demo below shows how you can subscribe to the rowExpansionChange event. The provided handler function then calls the autosizeColumns method from the gridApi.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Column widthMinimum widthFluid width
- Minimum width
- Fluid width
- Resizing
- AutosizingColumn header separatorAutosizing on mountAutosizing programmaticallyAutosizing virtualized columnsAutosizing with dynamic row heightAutosizing header filters Autosizing with grouped rows
- Column header separator
- Autosizing on mount
- Autosizing programmatically
- Autosizing virtualized columns
- Autosizing with dynamic row height
- Autosizing header filters
- Autosizing with grouped rows
- API
