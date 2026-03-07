
# Data Grid - Scrolling
This section presents how to programmatically control the scroll.


	
		
	
	
		Create a website that turns your practice into profit. Start your free trial.
	

ads via Carbon

## Scrolling to specific cells
You can scroll to a specific cell by calling apiRef.current.scrollToIndexes().
The only argument that must be passed is an object containing the row index and the column index of the cell to scroll.
If the row or column index is not present, the Data Grid will not do any movement in the missing axis.
The following demo explores the usage of this API:

## Scroll restoration
You can restore scroll to a previous position by defining initialState.scroll values { top: number, left: number }. The Data Grid will mount at the specified scroll offset in pixels.
The following demo explores the usage of scroll restoration:

## apiRef
The Data Grid exposes a set of methods via the apiRef object that are used internally in the implementation of scrolling feature.
The reference below describes the relevant functions.
See API object for more details.
This API should only be used as a last resort when the Data Grid's built-in props aren't sufficient for your specific use case.

### getScrollPosition()Returns the current scroll position.
getScrollPosition()
Returns the current scroll position.

### scroll()Triggers the viewport to scroll to the given positions (in pixels).
scroll()
Triggers the viewport to scroll to the given positions (in pixels).

### scrollToIndexes()Triggers the viewport to scroll to the cell at indexes given by params. Returns true if the grid had to scroll to reach the target.
scrollToIndexes()
Triggers the viewport to scroll to the cell at indexes given by params. Returns true if the grid had to scroll to reach the target.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Scrolling to specific cells
- Scroll restoration
- apiRef
- API
