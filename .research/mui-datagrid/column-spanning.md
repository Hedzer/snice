
# Data Grid - Column spanning
Span cells across several columns.


	
		
	
	
		Create a website that reflects your personal brand with Squarespace. Start your free trial.
	

ads via Carbon
By default, each cell takes up the width of one column.
You can modify this behavior with column spanning, which makes it possible for cells to span multiple columns.
This is very close to the "column spanning" in an HTML <table>.
To change the number of columns a cell should span, use the colSpan property available in GridColDef:
When using colSpan, some other features may be pointless or may not work as expected (depending on the data model).
To avoid a confusing grid layout, consider disabling the following features for any columns that are affected by colSpan:
- sorting
- filtering
- column reorder
- hiding columns
- column pinning

## Number signature
The number signature sets all cells in the column to span a given number of columns.
Rows per page:
1–2 of 2

## Function signature
The function signature makes it possible to only span specific cells in the column.
The function receives GridCellParams as argument.
Function signature can also be useful to derive colSpan value from row data:

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Number signature
- Function signature
- API
