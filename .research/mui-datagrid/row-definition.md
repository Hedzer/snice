
# Data Grid - Row definition
Define your rows.


	
		
	
	
		Frontend Masters - Your Path to Becoming a Career-Ready Web Developer!
	

ads via Carbon

## Feeding data
The rows can be defined with the rows prop, which expects an array of objects.
The rows prop should keep the same reference between two renders except when you want to apply new rows.
Otherwise, the Data Grid will re-apply heavy work like sorting and filtering.
Rows per page:
1–2 of 2

## Row identifier
Each row must have a unique identifier.
This identifier is used internally to identify the row in the various models—for instance, the row selection model—and to track the row across updates.
By default, the Data Grid looks for a property named id in the data set to get that identifier.
If the row's identifier is not called id, then you need to use the getRowId prop to tell the Data Grid where it's located.
The following demo shows how to use getRowId to grab the unique identifier from a property named internalId:
Rows per page:
1–2 of 2
If no such unique identifier exists in the data set, then you must create it by some other means, but this scenario should be avoided because it leads to issues with other features of the Data Grid.
Note that it is not necessary to create a column to display the unique identifier data.
The Data Grid pulls this information directly from the data set itself, not from anything displayed on the screen.
Just like the rows prop, the getRowId function should keep the same JavaScript reference between two renders.
Otherwise, the Data Grid will re-apply heavy work like sorting and filtering.
It could be achieved by either defining the prop outside the component scope or by memoizing using the React.useCallback hook if the function reuses something from the component scope.

## Selectors

### gridDataRowIdsSelector

### gridRowNodeSelector

### gridRowSelector

## Styling rows
You can check the styling rows section for more information.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Feeding data
- Row identifier
- Selectors
- Styling rows
- API
