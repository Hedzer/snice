
# Data Grid - Events
Subscribe to the events emitted by the Data Grid to trigger custom behavior.


	
		
	
	
		Start an annual website plan, and get a free domain name with Squarespace.
	

ads via Carbon

## Subscribing to events
You can subscribe to one of the events emitted by providing an event handler to the Data Grid.
The handler is a method that's called with three arguments:
- the parameters containing the information related to the event
- the MuiEvent containing the DOM event or the React synthetic event, when available
- the GridCallbackDetails containing the GridApi—only if Data Grid Pro or Data Grid Premium is being used
For example, here is an event handler for the rowClick event:
You can provide this event handler to the Data Grid in several ways:

### With the prop of the event
Not all events have a dedicated prop.
Check out the examples in the Catalog of events below to determine if a given event has a dedicated prop.
The following demo shows how to subscribe to the rowClick event using the onRowClick prop—try it out by clicking on any row:
Rows per page:
1–35 of 35

### With useGridEvent
This hook can only be used inside the scope of the Data Grid (that is inside component slots or cell renderers).
The following demo shows how to subscribe to the rowClick event using useGridEvent()—try it out by clicking on any row:
Rows per page:
1–35 of 35

### With apiRef.current.subscribeEvent
The following demo shows how to subscribe to the rowClick event using apiRef.current.subscribeEvent—try it out by clicking on any row:
The apiRef.current.subscribeEvent method returns a cleaning callback that unsubscribes the given handler when called.
For instance, when used inside a useEffect hook, you should always return the cleaning callback.
Otherwise, you will have multiple registrations of the same event handler.

## Disabling the default behavior
Depending on the use case, it might be necessary to disable the default action taken by an event.
The MuiEvent passed to the event handler has a defaultMuiPrevented property to control when the default behavior can be executed or not.
Set it to true to block the default handling of an event and implement your own.
Usually, double-clicking a cell will put it into edit mode.
The following example changes this behavior by also requiring the end user to press the Ctrl key:
Rows per page:
1–100 of 100

## Catalog of events
Expand the rows to see how to use each event.
Fired when the active chart id changes.
Fired when the aggregation model changes.
Fired when the AI Assistant active conversation index changes.
Fired when the AI Assistant conversation state changes.
Fired when a cell is clicked.
Fired when a cell is double-clicked.
Fired when the cell turns to edit mode.
Fired when the cell turns back to view mode.
Fired when a keydown event happens in a cell.
Fired when a keyup event happens in a cell.
Fired when the model that controls the cell modes changes.
Fired when a mousedown event happens in a cell.
Fired when a mouseover event happens in a cell.
Fired when a mouseup event happens in a cell.
Fired when the selection state of one or multiple cells change.
Fired when the chart synchronization state changes.
Fired when the data is copied to the clipboard.
Fired when the clipboard paste operation ends.
Fired when the clipboard paste operation starts.
Fired when a key is pressed in a column group header. It's mapped do the keydown DOM event.
Fired when a column header is clicked
Fired when the user attempts to open a context menu in the column header.
Fired when a column header is double-clicked.
Fired when a key is pressed in a column header. It's mapped do the keydown DOM event.
Fired when the user ends reordering a column.
Fired during the resizing of a column.
Fired when the user starts resizing a column.
Fired when the user stops resizing a column.
Fired when the columns state is changed.
Fired when the column visibility model changes.
Fired when the width of a column is changed.
Fired when the grid is resized with a debounced time of 60ms.
Fired when the density changes.
Fired when the state of the Excel export task changes
Fired when a new batch of rows is requested to be loaded. Called with a GridFetchRowsParams object. Used to trigger onFetchRows.
Fired when the filter model changes.
Fired when the value of the selection checkbox of the header is changed.
Fired when the grid menu is closed.
Fired when the menu is opened.
Fired when the pagination meta change.
Fired when the pagination model changes.
Fired when the pivot model changes.
Fired when the preference panel is closed.
Fired when the preference panel is opened.
Fired when a redo operation is executed.
Fired when the rendered rows index interval changes. Called with a GridRenderContext object.
Fired when the grid is resized.
Fired when rootElementRef.current becomes available.
Fired when a row is clicked. Not fired if the cell clicked is from an interactive column (actions, checkbox, etc).
Fired when the row count change.
Fired when a row is double-clicked.
Fired when the row turns to edit mode.
Fired when the row turns back to view mode.
Fired when the expansion of a row is changed. Called with a GridGroupNode object.
Fired when the row grouping model changes.
Fired when the model that controls the row modes changes.
Fired when the mouse enters the row. Called with a GridRowParams object.
Fired when the mouse leaves the row. Called with a GridRowParams object.
Fired when the user ends reordering a row.
Fired when the selection state of one or multiple rows changes.
Fired when the value of the selection checkbox of a row is changed.
Fired when scrolling to the bottom of the grid viewport.
Fired during the scroll of the grid viewport.
Fired when the sidebar is closed.
Fired when the sidebar is opened.
Fired when the sort model changes.
Fired when the state of the grid is updated.
Fired when an undo operation is executed.
Fired when the grid is unmounted.
Fired when the inner size of the viewport changes. Called with an ElementSize object.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Subscribing to eventsWith the prop of the eventWith useGridEventWith apiRef.current.subscribeEvent
- With the prop of the event
- With useGridEvent
- With apiRef.current.subscribeEvent
- Disabling the default behavior
- Catalog of events
- API
