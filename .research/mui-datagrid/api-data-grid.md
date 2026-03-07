
# DataGrid API
API reference docs for the React DataGrid component. Learn about the props, CSS, and other APIs of this exported module.


	
		
	
	
		Careers in tech are changing rapidly. Check out the latest AI job postings on Authentic Jobs!
	

ads via Carbon

## Demos
For examples and details on the usage of this React component, visit the component demo pages:
              DataGrid
DataGridPro
DataGridPremium
For examples and details on the usage of this React component, visit the component demo pages:
- DataGrid
- DataGridPro
- DataGridPremium

## Import
Learn about the difference by reading this guide on minimizing bundle size.

## Props
Set of columns of type GridColDef[].
Type:Array<object>
The ref object that allows Data Grid manipulation. Can be instantiated with useGridApiRef().
Type:{ current?: object }
The aria-label of the Data Grid.
Type:string
The id of the element containing a label for the Data Grid.
Type:string
If true, the Data Grid height is dynamic and follows the number of rows in the Data Grid.
Type:bool
Default:false
Deprecated－Use flex parent container instead: https://mui.com/x/react-data-grid/layout/#flex-parent-container
If true, the pageSize is calculated according to the container size and the max number of rows to avoid rendering a vertical scroll bar.
Type:bool
Default:false
If true, columns are autosized after the datagrid is mounted.
Type:bool
Default:false
The options for autosize when user-initiated.
Type:{ columns?: Array<string>, disableColumnVirtualization?: bool, expand?: bool, includeHeaders?: bool, includeOutliers?: bool, outliersFactor?: number }
Controls the modes of the cells.
Type:object
If true, the Data Grid will display an extra column with checkboxes for selecting rows.
Type:bool
Default:false
Override or extend the styles applied to the component.
See CSS classes API below for more details.
Type:object
The character used to separate cell values when copying to the clipboard.
Type:string
Default:'\t'
Column region in pixels to render before/after the viewport
Type:number
Default:150
The milliseconds delay to wait after a keystroke before triggering filtering in the columns menu.
Type:number
Default:150
Sets the height in pixels of the column group headers in the Data Grid. Inherits the columnHeaderHeight value if not set.
Type:number
Sets the height in pixel of the column headers in the Data Grid.
Type:number
Default:56
Set the column visibility model of the Data Grid. If defined, the Data Grid will ignore the hide property in GridColDef.
Type:object
The data source object.
Type:{ getRows: func, updateRow?: func }
Data source cache object.
Type:{ clear: func, get: func, set: func }
If positive, the Data Grid will periodically revalidate data source rows by re-fetching them from the server when the cache entry has expired. Set to 0 to disable polling.
Type:number
Default:0
Set the density of the Data Grid.
Type:'comfortable'| 'compact'| 'standard'
Default:"standard"
If true, column autosizing on header separator double-click is disabled.
Type:bool
Default:false
If true, column filters are disabled.
Type:bool
Default:false
If true, the column menu is disabled.
Type:bool
Default:false
If true, resizing columns is disabled.
Type:bool
Default:false
If true, hiding/showing columns is disabled.
Type:bool
Default:false
If true, the column sorting feature will be disabled.
Type:bool
Default:false
If true, the density selector is disabled.
Type:bool
Default:false
If true, eval() is not used for performance optimization.
Type:bool
Default:false
If true, multiple selection using the Ctrl/CMD or Shift key is disabled. The MIT DataGrid will ignore this prop, unless checkboxSelection is enabled.
Type:bool
Default:false (`!props.checkboxSelection` for MIT Data Grid)
If true, the Data Grid will not use the exclude model optimization when selecting all rows.
Type:bool
Default:false
If true, the selection on click on a row or cell is disabled.
Type:bool
Default:false
If true, the virtualization is disabled.
Type:bool
Default:false
Controls whether to use the cell or row editing.
Type:'cell'| 'row'
Default:"cell"
Use if the actual rowCount is not known upfront, but an estimation is available. If some rows have children (for instance in the tree data), this number represents the amount of top level rows. Applicable only with paginationMode="server" and when rowCount="-1"
Type:number
Unstable features, breaking changes might be introduced. For each feature, if the flag is not explicitly set to true, the feature will be fully disabled and any property / method call will not have any effect.
Type:{ warnIfFocusStateIsNotSynced?: bool }
The milliseconds delay to wait after a keystroke before triggering filtering.
Type:number
Default:150
Filtering can be processed on the server or client-side. Set it to 'server' if you would like to handle filtering on the server-side.
Type:'client'| 'server'
Default:"client"
Set the filter model of the Data Grid.
Type:{ items: Array<{ field: string, id?: number| string, operator: string, value?: any }>, logicOperator?: 'and'| 'or', quickFilterExcludeHiddenColumns?: bool, quickFilterLogicOperator?: 'and'| 'or', quickFilterValues?: array }
Function that applies CSS classes dynamically on cells.
Type:func
- params With all properties from GridCellParams.
Function that returns the element to render in row detail.
Type:func
- params With all properties from GridRowParams.
Function that returns the estimated height for a row. Only works if dynamic row height is used. Once the row height is measured this value is discarded.
Type:func
- params With all properties from GridRowHeightParams.
Function that applies CSS classes dynamically on rows.
Type:func
- params With all properties from GridRowClassNameParams.
Function that sets the row height per row.
Type:func
- params With all properties from GridRowHeightParams.
Return the id of a given GridRowModel. Ensure the reference of this prop is stable to avoid performance implications. It could be done by either defining the prop outside of the component or by memoizing it.
Type:func
Function that allows to specify the spacing between rows.
Type:func
- params With all properties from GridRowSpacingParams.
If true, the footer component is hidden.
Type:bool
Default:false
If true, the pagination component in the footer is hidden.
Type:bool
Default:false
If true, the selected row count in the footer is hidden.
Type:bool
Default:false
If true, the diacritics (accents) are ignored when filtering or quick filtering. E.g. when filter value is cafe, the rows with café will be visible.
Type:bool
Default:false
If true, the Data Grid will not use valueFormatter when exporting to CSV or copying to clipboard. If an object is provided, you can choose to ignore the valueFormatter for CSV export or clipboard export.
Type:{ clipboardExport?: bool, csvExport?: bool }| bool
Default:false
The initial state of the DataGrid. The data in it will be set in the state on initialization but will not be controlled. If one of the data in initialState is also being controlled, then the control state wins.
Type:object
Callback fired when a cell is rendered, returns true if the cell is editable.
Type:func
- params With all properties from GridCellParams.
Determines if a row can be selected.
Type:func
- params With all properties from GridRowParams.
If true, the selection model will retain selected rows that do not exist. Useful when using server side pagination and row selections need to be retained when changing pages.
Type:bool
Default:false
The label of the Data Grid. If the showToolbar prop is true, the label will be displayed in the toolbar and applied to the aria-label attribute of the grid. If the showToolbar prop is false, the label will not be visible but will be applied to the aria-label attribute of the grid.
Type:string
If true, a loading overlay is displayed.
Type:bool
Default:false
Set the locale text of the Data Grid. You can find all the translation keys supported in the source in the GitHub repository.
Type:object
Pass a custom logger in the components that implements the Logger interface.
Type:{ debug: func, error: func, info: func, warn: func }
Default:console
Allows to pass the logging level or false to turn off logging.
Type:'debug'| 'error'| 'info'| 'warn'| false
Default:"error" ("warn" in dev mode)
Nonce of the inline styles for Content Security Policy.
Type:string
Callback fired when any cell is clicked.
Type:func
- params With all properties from GridCellParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a double click event comes from a cell element.
Type:func
- params With all properties from GridCellParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the cell turns to edit mode.
Type:func
- params With all properties from GridCellParams.
- event The event that caused this prop to be called.
Callback fired when the cell turns to view mode.
Type:func
- params With all properties from GridCellParams.
- event The event that caused this prop to be called.
Callback fired when a keydown event comes from a cell element.
Type:func
- params With all properties from GridCellParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the cellModesModel prop changes.
Type:func
- cellModesModel Object containing which cells are in "edit" mode.
- details Additional details for this callback.
Callback called when the data is copied to the clipboard.
Type:func
- data The data copied to the clipboard.
Callback fired when a click event comes from a column header element.
Type:func
- params With all properties from GridColumnHeaderParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a contextmenu event comes from a column header element.
Type:func
- params With all properties from GridColumnHeaderParams.
- event The event object.
Callback fired when a double click event comes from a column header element.
Type:func
- params With all properties from GridColumnHeaderParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a mouse enter event comes from a column header element.
Type:func
- params With all properties from GridColumnHeaderParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a mouse leave event comes from a column header element.
Type:func
- params With all properties from GridColumnHeaderParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a mouseout event comes from a column header element.
Type:func
- params With all properties from GridColumnHeaderParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a mouseover event comes from a column header element.
Type:func
- params With all properties from GridColumnHeaderParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a column is reordered.
Type:func
- params With all properties from GridColumnOrderChangeParams.
- event The event object.
- details Additional details for this callback.
Callback fired while a column is being resized.
Type:func
- params With all properties from GridColumnResizeParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the column visibility model changes.
Type:func
- model The new model.
- details Additional details for this callback.
Callback fired when the width of a column is changed.
Type:func
- params With all properties from GridColumnResizeParams.
- event The event object.
- details Additional details for this callback.
Callback fired when a data source request fails.
Type:func
- error The data source error object.
Callback fired when the density changes.
Type:func
- density New density value.
Callback fired when the Filter model changes before the filters are applied.
Type:func
- model With all properties from GridFilterModel.
- details Additional details for this callback.
Callback fired when the menu is closed.
Type:func
- params With all properties from GridMenuParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the menu is opened.
Type:func
- params With all properties from GridMenuParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the pagination meta has changed.
Type:func
- paginationMeta Updated pagination meta.
Callback fired when the pagination model has changed.
Type:func
- model Updated pagination model.
- details Additional details for this callback.
Callback fired when the preferences panel is closed.
Type:func
- params With all properties from GridPreferencePanelParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the preferences panel is opened.
Type:func
- params With all properties from GridPreferencePanelParams.
- event The event object.
- details Additional details for this callback.
Callback called when processRowUpdate() throws an error or rejects.
Type:func
- error The error thrown.
Callback fired when the Data Grid is resized.
Type:func
- containerSize With all properties from ElementSize.
- event The event object.
- details Additional details for this callback.
Callback fired when a row is clicked. Not called if the target clicked is an interactive element added by the built-in columns.
Type:func
- params With all properties from GridRowParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the row count has changed.
Type:func
- count Updated row count.
Callback fired when a double click event comes from a row container element.
Type:func
- params With all properties from RowParams.
- event The event object.
- details Additional details for this callback.
Callback fired when the row turns to edit mode.
Type:func
- params With all properties from GridRowParams.
- event The event that caused this prop to be called.
Callback fired when the row turns to view mode.
Type:func
- params With all properties from GridRowParams.
- event The event that caused this prop to be called.
Callback fired when the rowModesModel prop changes.
Type:func
- rowModesModel Object containing which rows are in "edit" mode.
- details Additional details for this callback.
Callback fired when the selection state of one or multiple rows changes.
Type:func
- rowSelectionModel With all the row ids GridSelectionModel.
- details Additional details for this callback.
Callback fired when the sort model changes before a column is sorted.
Type:func
- model With all properties from GridSortModel.
- details Additional details for this callback.
Select the pageSize dynamically using the component UI.
Type:Array<number| { label: string, value: number }>
Default:[25, 50, 100]
The extra information about the pagination state of the Data Grid. Only applicable with paginationMode="server".
Type:{ hasNextPage?: bool }
Pagination can be processed on the server or client-side. Set it to 'client' if you would like to handle the pagination on the client-side. Set it to 'server' if you would like to handle the pagination on the server-side.
Type:'client'| 'server'
Default:"client"
The pagination model of type GridPaginationModel which refers to current page and pageSize.
Type:{ page: number, pageSize: number }
Callback called before updating a row with new values in the row and cell editing.
Type:func
- newRow Row object with the new values.
- oldRow Row object with the old values.
- params Additional parameters.
The milliseconds throttle delay for resizing the grid.
Type:number
Default:60
Row region in pixels to render before/after the viewport
Type:number
Default:150
Set the total number of rows, if it is different from the length of the value rows prop. If some rows have children (for instance in the tree data), this number represents the amount of top level rows. Only works with paginationMode="server", ignored when paginationMode="client".
Type:number
Sets the height in pixel of a row in the Data Grid.
Type:number
Default:52
Controls the modes of the rows.
Type:object
Set of rows of type GridRowsProp.
Type:Array<object>
Default:[]
If false, the row selection mode is disabled.
Type:bool
Default:true
Sets the row selection model of the Data Grid.
Type:{ ids: Set, type: 'exclude'| 'include' }
Sets the type of space between rows added by getRowSpacing.
Type:'border'| 'margin'
Default:"margin"
If true, the Data Grid will auto span the cells over the rows having the same value.
Type:bool
Default:false
Override the height/width of the Data Grid inner scrollbar.
Type:number
If true, vertical borders will be displayed between cells.
Type:bool
Default:false
If true, vertical borders will be displayed between column header items.
Type:bool
Default:false
If true, the toolbar is displayed.
Type:bool
Default:false
Overridable components props dynamically passed to the component at rendering.
Type:object
Overridable components.
See Slots API below for more details.
Type:object
Sorting can be processed on the server or client-side. Set it to 'client' if you would like to handle sorting on the client-side. Set it to 'server' if you would like to handle sorting on the server-side.
Type:'client'| 'server'
Default:"client"
The order of the sorting sequence.
Type:Array<'asc'| 'desc'>
Default:['asc', 'desc', null]
Set the sort model of the Data Grid.
Type:Array<{ field: string, sort?: 'asc'| 'desc' }>
The system prop that allows defining system overrides as well as additional CSS styles.
See the `sx` page for more details.
Type:Array<func| object| bool>| func| object
If true, the Data Grid enables column virtualization when getRowHeight is set to () => 'auto'. By default, column virtualization is disabled when dynamic row height is enabled to measure the row height correctly. For datasets with a large number of columns, this can cause performance issues. The downside of enabling this prop is that the row height will be estimated based the cells that are currently rendered, which can cause row height change when scrolling horizontally.
Type:bool
Default:false

## Slots
Component rendered for the bottom container.
Default component: GridBottomContainer
Component rendered for each cell.
Class name: .MuiDataGrid-cell
Default component: GridCell
Component rendered for each skeleton cell.
Default component: GridSkeletonCell
Filter icon component rendered in each column header.
Default component: GridColumnHeaderFilterIconButton
Sort icon component rendered in each column header.
Default component: GridColumnHeaderSortIcon
Column menu component rendered by clicking on the 3 dots "kebab" icon in column headers.
Default component: GridColumnMenu
Component responsible for rendering the column headers.
Class name: .MuiDataGrid-columnHeaders
Default component: GridColumnHeaders
Component responsible for rendering the detail panels.
Default component: GridDetailPanels
Footer component rendered at the bottom of the grid viewport.
Default component: GridFooter
Row count component rendered in the footer
Default component: GridRowCount
Toolbar component rendered in the grid header.
Class name: .MuiDataGrid-toolbar
Loading overlay component rendered when the grid is in a loading state.
Default component: GridLoadingOverlay
No results overlay component rendered when the grid has no results after filtering.
Default component: GridNoResultsOverlay
No rows overlay component rendered when the grid has no rows.
Default component: GridNoRowsOverlay
No columns overlay component rendered when the grid has no columns.
Default component: GridNoColumnsOverlay
Pagination component rendered in the grid footer by default.
Default component: Pagination
Filter panel component rendered when clicking the filter button.
Default component: GridFilterPanel
GridColumns panel component rendered when clicking the columns button.
Default component: GridColumnsPanel
Component used inside Grid Columns panel to manage columns.
Class name: .MuiDataGrid-columnsManagement
Default component: GridColumnsManagement
Panel component wrapping the filters and columns panels.
Class name: .MuiDataGrid-panel
Default component: GridPanel
Component rendered for each row.
Class name: .MuiDataGrid-row
Default component: GridRow
The custom Autocomplete component used in the grid for both header and cells.
Default component: Autocomplete
The custom Badge component used in the grid for both header and cells.
Default component: Badge
The custom Checkbox component used in the grid for both header and cells.
Default component: Checkbox
The custom Chip component used in the grid.
Default component: Chip
The custom CircularProgress component used in the grid.
Default component: CircularProgress
The custom Divider component used in the grid.
Default component: Divider
The custom LinearProgress component used in the grid.
Default component: LinearProgress
The custom MenuList component used in the grid.
Default component: MenuList
The custom MenuItem component used in the grid.
Default component: MenuItem
The custom TextField component used in the grid.
Default component: TextField
The custom Select component used in the grid.
Default component: Select
The custom Button component used in the grid.
Default component: Button
The custom IconButton component used in the grid.
Default component: IconButton
The custom Input component used in the grid.
Default component: Input
The custom Textarea component used in the grid for multiline text editing.
Default component: InputBase with multiline
The custom ToggleButton component used in the grid.
Default component: ToggleButton
The custom Tooltip component used in the grid.
Default component: Tooltip
The custom Pagination component used in the grid.
Default component: Pagination
The custom Popper component used in the grid.
Default component: Popper
The custom SelectOption component used in the grid.
Default component: SelectOption
The custom Skeleton component used in the grid.
Default component: Skeleton
The custom Switch component used in the grid.
Default component: Switch
The custom Tabs component used in the grid.
Default component: Tabs
Icon displayed on the boolean cell to represent the true value.
Default component: GridCheckIcon
Icon displayed on the boolean cell to represent the false value.
Default component: GridCloseIcon
Icon displayed on the undo button in the toolbar.
Default component: GridUndoIcon
Icon displayed on the redo button in the toolbar.
Default component: GridRedoIcon
Icon displayed on the side of the column header title to display the filter input component.
Default component: GridTripleDotsVerticalIcon
Icon displayed on the open filter button present in the toolbar by default.
Default component: GridFilterListIcon
Icon displayed on the column header menu to show that a filter has been applied to the column.
Default component: GridFilterAltIcon
Icon displayed on the column menu selector tab.
Default component: GridColumnIcon
Icon displayed on the side of the column header title when unsorted.
Default component: GridColumnUnsortedIcon
Icon displayed on the side of the column header title when sorted in ascending order.
Default component: GridArrowUpwardIcon
Icon displayed on the side of the column header title when sorted in descending order.
Default component: GridArrowDownwardIcon
Icon displayed in between two column headers that allows to resize the column header.
Default component: GridSeparatorIcon
Icon displayed on the compact density option in the toolbar.
Default component: GridViewHeadlineIcon
Icon displayed on the standard density option in the toolbar.
Default component: GridTableRowsIcon
Icon displayed on the "comfortable" density option in the toolbar.
Default component: GridViewStreamIcon
Icon displayed on the open export button present in the toolbar by default.
Default component: GridDownloadIcon
Icon displayed on the actions column type to open the menu.
Default component: GridMoreVertIcon
Icon displayed on the tree data toggling column when the children are collapsed
Default component: GridKeyboardArrowRight
Icon displayed on the tree data toggling column when the children are expanded
Default component: GridExpandMoreIcon
Icon displayed on the grouping column when the children are collapsed
Default component: GridKeyboardArrowRight
Icon displayed on the grouping column when the children are expanded
Default component: GridExpandMoreIcon
Icon displayed on the detail panel toggle column when collapsed.
Default component: GridAddIcon
Icon displayed on the detail panel toggle column when expanded.
Default component: GridRemoveIcon
Icon displayed for deleting the filter from filter panel.
Default component: GridAddIcon
Icon displayed for deleting the filter from filter panel.
Default component: GridDeleteIcon
Icon displayed for deleting all the active filters from filter panel.
Default component: GridDeleteForeverIcon
Icon displayed on the reorder column type to reorder a row.
Class name: .MuiDataGrid-rowReorderIcon
Default component: GridDragIcon
Icon displayed on the quick filter input.
Default component: GridSearchIcon
Icon displayed on the quick filter reset input.
Default component: GridCloseIcon
Icon displayed in column menu for hiding column
Default component: GridVisibilityOffIcon
Icon displayed in column menu for ascending sort
Default component: GridArrowUpwardIcon
Icon displayed in column menu for descending sort
Default component: GridArrowDownwardIcon
Icon displayed in column menu for unsort
Default component: null
Icon displayed in column menu for filter
Default component: GridFilterAltIcon
Icon displayed in column menu for showing all columns
Default component: GridViewColumnIcon
Icon displayed in column menu for clearing values
Default component: GridClearIcon
Icon displayed on the input while processing.
Default component: GridLoadIcon
Icon displayed on the column reorder button.
Default component: GridDragIcon
Icon displayed to indicate that a menu item is selected.
Default component: GridCheckIcon
Icon displayed on the long text cell to expand the content.
Default component: GridLongTextCellExpandIcon
Icon displayed on the long text cell popup to collapse the content.
Default component: GridLongTextCellCollapseIcon

## CSS classes
These class names are useful for styling with CSS. They are applied to the component's slots when specific states are triggered.
Styles applied to the root element of the cell with type="actions".
Rule name:actionsCell
Styles applied to the root element of the column header when aggregated.
Rule name:aggregationColumnHeader
Styles applied to the root element of the header when aggregation if headerAlign="center".
Rule name:aggregationColumnHeader--alignCenter
Styles applied to the root element of the header when aggregation if headerAlign="left".
Rule name:aggregationColumnHeader--alignLeft
Styles applied to the root element of the header when aggregation if headerAlign="right".
Rule name:aggregationColumnHeader--alignRight
Styles applied to the aggregation label in the column header when aggregated.
Rule name:aggregationColumnHeaderLabel
Styles applied to the aggregation row overlay wrapper.
Rule name:aggregationRowOverlayWrapper
Styles applied to the root element of the AI assistant panel.
Rule name:aiAssistantPanel
Styles applied to the AI assistant panel body.
Rule name:aiAssistantPanelBody
Styles applied to the AI assistant panel conversation.
Rule name:aiAssistantPanelConversation
Styles applied to the AI assistant panel conversation list.
Rule name:aiAssistantPanelConversationList
Styles applied to the AI assistant panel conversation title.
Rule name:aiAssistantPanelConversationTitle
Styles applied to the AI assistant panel empty text.
Rule name:aiAssistantPanelEmptyText
Styles applied to the AI assistant panel footer.
Rule name:aiAssistantPanelFooter
Styles applied to the AI assistant panel header.
Rule name:aiAssistantPanelHeader
Styles applied to the AI assistant panel suggestions.
Rule name:aiAssistantPanelSuggestions
Styles applied to the AI assistant panel suggestions item.
Rule name:aiAssistantPanelSuggestionsItem
Styles applied to the AI assistant panel suggestions label.
Rule name:aiAssistantPanelSuggestionsLabel
Styles applied to the AI assistant panel suggestions list.
Rule name:aiAssistantPanelSuggestionsList
Styles applied to the AI assistant panel title.
Rule name:aiAssistantPanelTitle
Styles applied to the AI assistant panel title container.
Rule name:aiAssistantPanelTitleContainer
Styles applied to the root element if autoHeight={true}.
Rule name:autoHeight
Styles applied to the root element while it is being autosized.
Rule name:autosizing
Styles applied to the icon of the boolean cell.
Rule name:booleanCell
Styles applied to the cell element if the cell is editable.
Rule name:cell--editable
Styles applied to the cell element if the cell is in edit mode.
Rule name:cell--editing
Styles applied to the cell element in flex display mode.
Rule name:cell--flex
Styles applied to the cell element if it is pinned to the left.
Rule name:cell--pinnedLeft
Styles applied to the cell element if it is pinned to the right.
Rule name:cell--pinnedRight
Styles applied to the cell element if it is at the bottom edge of a cell selection range.
Rule name:cell--rangeBottom
Styles applied to the cell element if it is at the left edge of a cell selection range.
Rule name:cell--rangeLeft
Styles applied to the cell element if it is at the right edge of a cell selection range.
Rule name:cell--rangeRight
Styles applied to the cell element if it is at the top edge of a cell selection range.
Rule name:cell--rangeTop
Styles applied to the cell element if it is in a cell selection range.
Rule name:cell--selectionMode
Styles applied to the cell element if align="center".
Rule name:cell--textCenter
Styles applied to the cell element if align="left".
Rule name:cell--textLeft
Styles applied to the cell element if align="right".
Rule name:cell--textRight
Styles applied the cell if showColumnVerticalBorder={true}.
Rule name:cell--withLeftBorder
Styles applied the cell if showColumnVerticalBorder={true}.
Rule name:cell--withRightBorder
Styles applied to the cell checkbox element.
Rule name:cellCheckbox
Styles applied to the empty cell element.
Rule name:cellEmpty
Styles applied to the skeleton cell element.
Rule name:cellSkeleton
Styles applied to the selection checkbox element.
Rule name:checkboxInput
Styles applied to the collapsible element.
Rule name:collapsible
Styles applied to the collapsible icon element.
Rule name:collapsibleIcon
Styles applied to the collapsible panel element.
Rule name:collapsiblePanel
Styles applied to the collapsible trigger element.
Rule name:collapsibleTrigger
Styles applied to the column header element.
Rule name:columnHeader
Styles applied to the column header if headerAlign="center".
Rule name:columnHeader--alignCenter
Styles applied to the column header if headerAlign="left".
Rule name:columnHeader--alignLeft
Styles applied to the column header if headerAlign="right".
Rule name:columnHeader--alignRight
Styles applied to the floating column header element when it is dragged.
Rule name:columnHeader--dragging
Styles applied to the empty column group header cell.
Rule name:columnHeader--emptyGroup
Styles applied to the column group header cell if not empty.
Rule name:columnHeader--filledGroup
Styles applied to the header filter cell.
Rule name:columnHeader--filter
Styles applied to the column header if the column has a filter applied to it.
Rule name:columnHeader--filtered
Styles applied to the last column header element.
Rule name:columnHeader--last
Styles applied to the column header if it is being dragged.
Rule name:columnHeader--moving
Styles applied to the column header if the type of the column is number.
Rule name:columnHeader--numeric
Rule name:columnHeader--pinnedLeft
Rule name:columnHeader--pinnedRight
Styles applied to the column header if the column is sortable.
Rule name:columnHeader--sortable
Styles applied to the column header if the column is sorted.
Rule name:columnHeader--sorted
Rule name:columnHeader--withLeftBorder
Styles applied the column header if showColumnVerticalBorder={true}.
Rule name:columnHeader--withRightBorder
Styles applied to the header checkbox cell element.
Rule name:columnHeaderCheckbox
Styles applied to the column header's draggable container element.
Rule name:columnHeaderDraggableContainer
Styles applied to the header filter input element.
Rule name:columnHeaderFilterInput
Styles applied to the header filter operator label element.
Rule name:columnHeaderFilterOperatorLabel
Styles applied to the column header's title element;
Rule name:columnHeaderTitle
Styles applied to the column header's title container element.
Rule name:columnHeaderTitleContainer
Styles applied to the column header's title excepted buttons.
Rule name:columnHeaderTitleContainerContent
Styles applied to the column header separator element.
Rule name:columnSeparator
Styles applied to the column header separator if the column is resizable.
Rule name:columnSeparator--resizable
Styles applied to the column header separator if the column is being resized.
Rule name:columnSeparator--resizing
Styles applied to the column header separator if the side is "left".
Rule name:columnSeparator--sideLeft
Styles applied to the column header separator if the side is "right".
Rule name:columnSeparator--sideRight
Styles applied to the columns management empty text element.
Rule name:columnsManagementEmptyText
Styles applied to the columns management footer element.
Rule name:columnsManagementFooter
Styles applied to the columns management header element.
Rule name:columnsManagementHeader
Styles applied to the columns management row element.
Rule name:columnsManagementRow
Styles applied to the columns management scroll area element.
Rule name:columnsManagementScrollArea
Styles applied to the columns management search input element.
Rule name:columnsManagementSearchInput
Styles applied to the bottom container.
Rule name:container--bottom
Styles applied to the top container.
Rule name:container--top
Styles applied to the detail panel element.
Rule name:detailPanel
Styles applied to the detail panel toggle cell element.
Rule name:detailPanelToggleCell
Styles applied to the detail panel toggle cell element if expanded.
Rule name:detailPanelToggleCell--expanded
Styles applied to root of the boolean edit component.
Rule name:editBooleanCell
Styles applied to the root of the input component.
Rule name:editInputCell
Styles applied to the edit long text cell root element.
Rule name:editLongTextCell
Styles applied to the edit long text cell popper content.
Rule name:editLongTextCellPopperContent
Styles applied to the edit long text cell popup.
Rule name:editLongTextCellPopup
Styles applied to the edit long text cell textarea.
Rule name:editLongTextCellTextarea
Styles applied to the edit long text cell value element.
Rule name:editLongTextCellValue
Styles applied to the root of the filter form component.
Rule name:filterForm
Styles applied to the column input of the filter form component.
Rule name:filterFormColumnInput
Styles applied to the delete icon of the filter form component.
Rule name:filterFormDeleteIcon
Styles applied to the link operator input of the filter form component.
Rule name:filterFormLogicOperatorInput
Styles applied to the operator input of the filter form component.
Rule name:filterFormOperatorInput
Styles applied to the value input of the filter form component.
Rule name:filterFormValueInput
Styles applied to the filter icon element.
Rule name:filterIcon
Styles applied to the root element of the cell inside a footer row.
Rule name:footerCell
Styles applied to the footer container element.
Rule name:footerContainer
Styles applied to the root element of the grouping criteria cell
Rule name:groupingCriteriaCell
Styles applied to the toggle of the grouping criteria cell
Rule name:groupingCriteriaCellToggle
Styles applied to the column header filter row.
Rule name:headerFilterRow
Styles applied to the column header icon's container.
Rule name:iconButtonContainer
Styles applied to the column header separator icon element.
Rule name:iconSeparator
Styles applied to the long text cell root element.
Rule name:longTextCell
Styles applied to the long text cell collapse button.
Rule name:longTextCellCollapseButton
Styles applied to the long text cell content element.
Rule name:longTextCellContent
Styles applied to the long text cell expand button.
Rule name:longTextCellExpandButton
Styles applied to the long text cell popper content.
Rule name:longTextCellPopperContent
Styles applied to the long text cell popup.
Rule name:longTextCellPopup
Styles applied to the main container element.
Rule name:main
Styles applied to the main container element when it has right pinned columns.
Rule name:main--hasPinnedRight
Rule name:mainContent
Styles applied to the menu element.
Rule name:menu
Styles applied to the menu icon element.
Rule name:menuIcon
Styles applied to the menu icon button element.
Rule name:menuIconButton
Styles applied to the menu list element.
Rule name:menuList
Styles applied to the menu icon element if the menu is open.
Rule name:menuOpen
Styles applied to the overlay element.
Rule name:overlay
Styles applied to the overlay wrapper element.
Rule name:overlayWrapper
Styles applied to the overlay wrapper inner element.
Rule name:overlayWrapperInner
Styles applied to the panel content element.
Rule name:panelContent
Styles applied to the panel footer element.
Rule name:panelFooter
Styles applied to the panel header element.
Rule name:panelHeader
Styles applied to the panel wrapper element.
Rule name:panelWrapper
Styles applied to the paper element.
Rule name:paper
Styles applied to the pinned rows container.
Rule name:pinnedRows
Styles applied to the bottom pinned rows container.
Rule name:pinnedRows--bottom
Styles applied to the top pinned rows container.
Rule name:pinnedRows--top
Styles applied to the pivot panel available fields.
Rule name:pivotPanelAvailableFields
Styles applied to the pivot panel body.
Rule name:pivotPanelBody
Styles applied to the pivot panel field.
Rule name:pivotPanelField
Styles applied to the pivot panel field when sorted.
Rule name:pivotPanelField--sorted
Styles applied to the pivot panel field action container.
Rule name:pivotPanelFieldActionContainer
Styles applied to the pivot panel field checkbox.
Rule name:pivotPanelFieldCheckbox
Styles applied to the pivot panel field drag icon.
Rule name:pivotPanelFieldDragIcon
Styles applied to the pivot panel field list.
Rule name:pivotPanelFieldList
Styles applied to the pivot panel field name.
Rule name:pivotPanelFieldName
Styles applied to the pivot panel header.
Rule name:pivotPanelHeader
Styles applied to the pivot panel placeholder.
Rule name:pivotPanelPlaceholder
Styles applied to the pivot panel scroll area.
Rule name:pivotPanelScrollArea
Styles applied to the pivot panel search container.
Rule name:pivotPanelSearchContainer
Styles applied to the pivot panel section.
Rule name:pivotPanelSection
Styles applied to the pivot panel sections.
Rule name:pivotPanelSections
Styles applied to the pivot panel section title.
Rule name:pivotPanelSectionTitle
Styles applied to the pivot panel switch.
Rule name:pivotPanelSwitch
Styles applied to the pivot panel switch label.
Rule name:pivotPanelSwitchLabel
Styles applied to the prompt root element.
Rule name:prompt
Styles applied to the prompt action element.
Rule name:promptAction
Styles applied to the prompt change list element.
Rule name:promptChangeList
Styles applied to the prompt changes toggle element.
Rule name:promptChangesToggle
Styles applied to the prompt changes toggle icon element.
Rule name:promptChangesToggleIcon
Styles applied to the prompt content element.
Rule name:promptContent
Styles applied to the prompt error element.
Rule name:promptError
Styles applied to the prompt feedback element.
Rule name:promptFeedback
Styles applied to the prompt icon element.
Rule name:promptIcon
Styles applied to the prompt icon element.
Rule name:promptIconContainer
Styles applied to the prompt text element.
Rule name:promptText
Styles applied to resizable panel handles.
Rule name:resizablePanelHandle
Styles applied to horizontal resizable panel handles.
Rule name:resizablePanelHandle--horizontal
Styles applied to vertical resizable panel handles.
Rule name:resizablePanelHandle--vertical
Styles applied to the root element.
Rule name:root
Styles applied to the root element if density is "comfortable".
Rule name:root--densityComfortable
Styles applied to the root element if density is "compact".
Rule name:root--densityCompact
Styles applied to the root element if density is "standard" (default).
Rule name:root--densityStandard
Styles applied to the root element when user selection is disabled.
Rule name:root--disableUserSelection
Styles applied to the row element when it is being dragged (entire row).
Rule name:row--beingDragged
Styles applied to the row if its detail panel is open.
Rule name:row--detailPanelExpanded
Styles applied to the floating special row reorder cell element when it is dragged.
Rule name:row--dragging
Styles applied to the row if it has dynamic row height.
Rule name:row--dynamicHeight
Styles applied to the row element if the row is editable.
Rule name:row--editable
Styles applied to the row element if the row is in edit mode.
Rule name:row--editing
Styles applied to the first visible row element on every page of the grid.
Rule name:row--firstVisible
Styles applied to the last visible row element on every page of the grid.
Rule name:row--lastVisible
Styles applied to the footer row count element to show the total number of rows. Only works when pagination is disabled.
Rule name:rowCount
Styles applied to the root element of the row reorder cell
Rule name:rowReorderCell
Styles applied to the root element of the row reorder cell when dragging is allowed
Rule name:rowReorderCell--draggable
Styles applied to the row reorder cell container element.
Rule name:rowReorderCellContainer
Styles applied to the row's draggable placeholder element inside the special row reorder cell.
Rule name:rowReorderCellPlaceholder
Styles applied to the skeleton row element.
Rule name:rowSkeleton
Styles applied to both scroll area elements.
Rule name:scrollArea
Styles applied to the bottom scroll area element.
Rule name:scrollArea--down
Styles applied to the left scroll area element.
Rule name:scrollArea--left
Styles applied to the right scroll area element.
Rule name:scrollArea--right
Styles applied to the top scroll area element.
Rule name:scrollArea--up
Styles applied to the scrollbars.
Rule name:scrollbar
Styles applied to the horizontal scrollbar.
Rule name:scrollbar--horizontal
Styles applied to the horizontal scrollbar.
Rule name:scrollbar--vertical
Styles applied to the scroll shadow element.
Rule name:scrollShadow
Styles applied to the horizontal scroll shadow element.
Rule name:scrollShadow--horizontal
Styles applied to the vertical scroll shadow element.
Rule name:scrollShadow--vertical
Styles applied to the footer selected row count element.
Rule name:selectedRowCount
Styles applied to the sidebar element.
Rule name:sidebar
Styles applied to the sidebar header element.
Rule name:sidebarHeader
Styles applied to the sort button element.
Rule name:sortButton
Styles applied to the sort button icon element.
Rule name:sortIcon
Styles applied to the toolbar container element.
Rule name:toolbarContainer
Styles applied to the toolbar divider element.
Rule name:toolbarDivider
Styles applied to the toolbar filter list element.
Rule name:toolbarFilterList
Styles applied to the toolbar label element.
Rule name:toolbarLabel
Styles applied to the toolbar quick filter root element.
Rule name:toolbarQuickFilter
Styles applied to the toolbar quick filter control element.
Rule name:toolbarQuickFilterControl
Styles applied to the toolbar quick filter trigger element.
Rule name:toolbarQuickFilterTrigger
Styles applied to the root of the grouping column of the tree data.
Rule name:treeDataGroupingCell
Styles applied to the toggle of the grouping cell of the tree data.
Rule name:treeDataGroupingCellToggle
Styles applied to the virtualization container.
Rule name:virtualScroller
Styles applied to the virtualization content.
Rule name:virtualScrollerContent
Styles applied to the virtualization content when its height is bigger than the virtualization container.
Rule name:virtualScrollerContent--overflowed
Styles applied to the virtualization render zone.
Rule name:virtualScrollerRenderZone
Styles applied to cells, column header and other elements that have border. Sets border color only.
Rule name:withBorderColor
Rule name:withSidePanel
Styles applied the grid if showColumnVerticalBorder={true}.
Rule name:withVerticalBorder
You can override the style of the component using one of these customization options:
- With a global class name.
- With a rule name as part of the component's styleOverrides property in a custom theme.

## Source code
If you did not find the information in this page, consider having a look at the implementation of the component for more detail.
Was this page helpful?
•
•
Contents
- Demos
- Import
- PropscolumnsapiRefaria-labelaria-labelledbyautoHeightautoPageSizeautosizeOnMountautosizeOptionscellModesModelcheckboxSelectionclassesclipboardCopyCellDelimitercolumnBufferPxcolumnFilterDebounceMscolumnGroupHeaderHeightcolumnHeaderHeightcolumnVisibilityModeldataSourcedataSourceCachedataSourceRevalidateMsdensitydisableAutosizedisableColumnFilterdisableColumnMenudisableColumnResizedisableColumnSelectordisableColumnSortingdisableDensitySelectordisableEvaldisableMultipleRowSelectiondisableRowSelectionExcludeModeldisableRowSelectionOnClickdisableVirtualizationeditModeestimatedRowCountexperimentalFeaturesfilterDebounceMsfilterModefilterModelgetCellClassNamegetDetailPanelContentgetEstimatedRowHeightgetRowClassNamegetRowHeightgetRowIdgetRowSpacinghideFooterhideFooterPaginationhideFooterSelectedRowCountignoreDiacriticsignoreValueFormatterDuringExportinitialStateisCellEditableisRowSelectablekeepNonExistentRowsSelectedlabelloadinglocaleTextloggerlogLevelnonceonCellClickonCellDoubleClickonCellEditStartonCellEditStoponCellKeyDownonCellModesModelChangeonClipboardCopyonColumnHeaderClickonColumnHeaderContextMenuonColumnHeaderDoubleClickonColumnHeaderEnteronColumnHeaderLeaveonColumnHeaderOutonColumnHeaderOveronColumnOrderChangeonColumnResizeonColumnVisibilityModelChangeonColumnWidthChangeonDataSourceErroronDensityChangeonFilterModelChangeonMenuCloseonMenuOpenonPaginationMetaChangeonPaginationModelChangeonPreferencePanelCloseonPreferencePanelOpenonProcessRowUpdateErroronResizeonRowClickonRowCountChangeonRowDoubleClickonRowEditStartonRowEditStoponRowModesModelChangeonRowSelectionModelChangeonSortModelChangepageSizeOptionspaginationMetapaginationModepaginationModelprocessRowUpdateresizeThrottleMsrowBufferPxrowCountrowHeightrowModesModelrowsrowSelectionrowSelectionModelrowSpacingTyperowSpanningscrollbarSizeshowCellVerticalBordershowColumnVerticalBordershowToolbarslotPropsslotssortingModesortingOrdersortModelsxvirtualizeColumnsWithAutoRowHeight
- columns
- apiRef
- aria-label
- aria-labelledby
- autoHeight
- autoPageSize
- autosizeOnMount
- autosizeOptions
- cellModesModel
- checkboxSelection
- classes
- clipboardCopyCellDelimiter
- columnBufferPx
- columnFilterDebounceMs
- columnGroupHeaderHeight
- columnHeaderHeight
- columnVisibilityModel
- dataSource
- dataSourceCache
- dataSourceRevalidateMs
- density
- disableAutosize
- disableColumnFilter
- disableColumnMenu
- disableColumnResize
- disableColumnSelector
- disableColumnSorting
- disableDensitySelector
- disableEval
- disableMultipleRowSelection
- disableRowSelectionExcludeModel
- disableRowSelectionOnClick
- disableVirtualization
- editMode
- estimatedRowCount
- experimentalFeatures
- filterDebounceMs
- filterMode
- filterModel
- getCellClassName
- getDetailPanelContent
- getEstimatedRowHeight
- getRowClassName
- getRowHeight
- getRowId
- getRowSpacing
- hideFooter
- hideFooterPagination
- hideFooterSelectedRowCount
- ignoreDiacritics
- ignoreValueFormatterDuringExport
- initialState
- isCellEditable
- isRowSelectable
- keepNonExistentRowsSelected
- label
- loading
- localeText
- logger
- logLevel
- nonce
- onCellClick
- onCellDoubleClick
- onCellEditStart
- onCellEditStop
- onCellKeyDown
- onCellModesModelChange
- onClipboardCopy
- onColumnHeaderClick
- onColumnHeaderContextMenu
- onColumnHeaderDoubleClick
- onColumnHeaderEnter
- onColumnHeaderLeave
- onColumnHeaderOut
- onColumnHeaderOver
- onColumnOrderChange
- onColumnResize
- onColumnVisibilityModelChange
- onColumnWidthChange
- onDataSourceError
- onDensityChange
- onFilterModelChange
- onMenuClose
- onMenuOpen
- onPaginationMetaChange
- onPaginationModelChange
- onPreferencePanelClose
- onPreferencePanelOpen
- onProcessRowUpdateError
- onResize
- onRowClick
- onRowCountChange
- onRowDoubleClick
- onRowEditStart
- onRowEditStop
- onRowModesModelChange
- onRowSelectionModelChange
- onSortModelChange
- pageSizeOptions
- paginationMeta
- paginationMode
- paginationModel
- processRowUpdate
- resizeThrottleMs
- rowBufferPx
- rowCount
- rowHeight
- rowModesModel
- rows
- rowSelection
- rowSelectionModel
- rowSpacingType
- rowSpanning
- scrollbarSize
- showCellVerticalBorder
- showColumnVerticalBorder
- showToolbar
- slotProps
- slots
- sortingMode
- sortingOrder
- sortModel
- sx
- virtualizeColumnsWithAutoRowHeight
- SlotsbottomContainercellskeletonCellcolumnHeaderFilterIconButtoncolumnHeaderSortIconcolumnMenucolumnHeadersdetailPanelsfooterfooterRowCounttoolbarloadingOverlaynoResultsOverlaynoRowsOverlaynoColumnsOverlaypaginationfilterPanelcolumnsPanelcolumnsManagementpanelrowbaseAutocompletebaseBadgebaseCheckboxbaseChipbaseCircularProgressbaseDividerbaseLinearProgressbaseMenuListbaseMenuItembaseTextFieldbaseSelectbaseButtonbaseIconButtonbaseInputbaseTextareabaseToggleButtonbaseTooltipbasePaginationbasePopperbaseSelectOptionbaseSkeletonbaseSwitchbaseTabsbooleanCellTrueIconbooleanCellFalseIconundoIconredoIconcolumnMenuIconopenFilterButtonIconcolumnFilteredIconcolumnSelectorIconcolumnUnsortedIconcolumnSortedAscendingIconcolumnSortedDescendingIconcolumnResizeIcondensityCompactIcondensityStandardIcondensityComfortableIconexportIconmoreActionsIcontreeDataExpandIcontreeDataCollapseIcongroupingCriteriaExpandIcongroupingCriteriaCollapseIcondetailPanelExpandIcondetailPanelCollapseIconfilterPanelAddIconfilterPanelDeleteIconfilterPanelRemoveAllIconrowReorderIconquickFilterIconquickFilterClearIconcolumnMenuHideIconcolumnMenuSortAscendingIconcolumnMenuSortDescendingIconcolumnMenuUnsortIconcolumnMenuFilterIconcolumnMenuManageColumnsIconcolumnMenuClearIconloadIconcolumnReorderIconmenuItemCheckIconlongTextCellExpandIconlongTextCellCollapseIcon
- bottomContainer
- cell
- skeletonCell
- columnHeaderFilterIconButton
- columnHeaderSortIcon
- columnMenu
- columnHeaders
- detailPanels
- footer
- footerRowCount
- toolbar
- loadingOverlay
- noResultsOverlay
- noRowsOverlay
- noColumnsOverlay
- pagination
- filterPanel
- columnsPanel
- columnsManagement
- panel
- row
- baseAutocomplete
- baseBadge
- baseCheckbox
- baseChip
- baseCircularProgress
- baseDivider
- baseLinearProgress
- baseMenuList
- baseMenuItem
- baseTextField
- baseSelect
- baseButton
- baseIconButton
- baseInput
- baseTextarea
- baseToggleButton
- baseTooltip
- basePagination
- basePopper
- baseSelectOption
- baseSkeleton
- baseSwitch
- baseTabs
- booleanCellTrueIcon
- booleanCellFalseIcon
- undoIcon
- redoIcon
- columnMenuIcon
- openFilterButtonIcon
- columnFilteredIcon
- columnSelectorIcon
- columnUnsortedIcon
- columnSortedAscendingIcon
- columnSortedDescendingIcon
- columnResizeIcon
- densityCompactIcon
- densityStandardIcon
- densityComfortableIcon
- exportIcon
- moreActionsIcon
- treeDataExpandIcon
- treeDataCollapseIcon
- groupingCriteriaExpandIcon
- groupingCriteriaCollapseIcon
- detailPanelExpandIcon
- detailPanelCollapseIcon
- filterPanelAddIcon
- filterPanelDeleteIcon
- filterPanelRemoveAllIcon
- rowReorderIcon
- quickFilterIcon
- quickFilterClearIcon
- columnMenuHideIcon
- columnMenuSortAscendingIcon
- columnMenuSortDescendingIcon
- columnMenuUnsortIcon
- columnMenuFilterIcon
- columnMenuManageColumnsIcon
- columnMenuClearIcon
- loadIcon
- columnReorderIcon
- menuItemCheckIcon
- longTextCellExpandIcon
- longTextCellCollapseIcon
- CSS classesactionsCellaggregationColumnHeaderaggregationColumnHeader--alignCenteraggregationColumnHeader--alignLeftaggregationColumnHeader--alignRightaggregationColumnHeaderLabelaggregationRowOverlayWrapperaiAssistantPanelaiAssistantPanelBodyaiAssistantPanelConversationaiAssistantPanelConversationListaiAssistantPanelConversationTitleaiAssistantPanelEmptyTextaiAssistantPanelFooteraiAssistantPanelHeaderaiAssistantPanelSuggestionsaiAssistantPanelSuggestionsItemaiAssistantPanelSuggestionsLabelaiAssistantPanelSuggestionsListaiAssistantPanelTitleaiAssistantPanelTitleContainerautoHeightautosizingbooleanCellcell--editablecell--editingcell--flexcell--pinnedLeftcell--pinnedRightcell--rangeBottomcell--rangeLeftcell--rangeRightcell--rangeTopcell--selectionModecell--textCentercell--textLeftcell--textRightcell--withLeftBordercell--withRightBordercellCheckboxcellEmptycellSkeletoncheckboxInputcollapsiblecollapsibleIconcollapsiblePanelcollapsibleTriggercolumnHeadercolumnHeader--alignCentercolumnHeader--alignLeftcolumnHeader--alignRightcolumnHeader--draggingcolumnHeader--emptyGroupcolumnHeader--filledGroupcolumnHeader--filtercolumnHeader--filteredcolumnHeader--lastcolumnHeader--movingcolumnHeader--numericcolumnHeader--pinnedLeftcolumnHeader--pinnedRightcolumnHeader--sortablecolumnHeader--sortedcolumnHeader--withLeftBordercolumnHeader--withRightBordercolumnHeaderCheckboxcolumnHeaderDraggableContainercolumnHeaderFilterInputcolumnHeaderFilterOperatorLabelcolumnHeaderTitlecolumnHeaderTitleContainercolumnHeaderTitleContainerContentcolumnSeparatorcolumnSeparator--resizablecolumnSeparator--resizingcolumnSeparator--sideLeftcolumnSeparator--sideRightcolumnsManagementEmptyTextcolumnsManagementFootercolumnsManagementHeadercolumnsManagementRowcolumnsManagementScrollAreacolumnsManagementSearchInputcontainer--bottomcontainer--topdetailPaneldetailPanelToggleCelldetailPanelToggleCell--expandededitBooleanCelleditInputCelleditLongTextCelleditLongTextCellPopperContenteditLongTextCellPopupeditLongTextCellTextareaeditLongTextCellValuefilterFormfilterFormColumnInputfilterFormDeleteIconfilterFormLogicOperatorInputfilterFormOperatorInputfilterFormValueInputfilterIconfooterCellfooterContainergroupingCriteriaCellgroupingCriteriaCellToggleheaderFilterRowiconButtonContainericonSeparatorlongTextCelllongTextCellCollapseButtonlongTextCellContentlongTextCellExpandButtonlongTextCellPopperContentlongTextCellPopupmainmain--hasPinnedRightmainContentmenumenuIconmenuIconButtonmenuListmenuOpenoverlayoverlayWrapperoverlayWrapperInnerpanelContentpanelFooterpanelHeaderpanelWrapperpaperpinnedRowspinnedRows--bottompinnedRows--toppivotPanelAvailableFieldspivotPanelBodypivotPanelFieldpivotPanelField--sortedpivotPanelFieldActionContainerpivotPanelFieldCheckboxpivotPanelFieldDragIconpivotPanelFieldListpivotPanelFieldNamepivotPanelHeaderpivotPanelPlaceholderpivotPanelScrollAreapivotPanelSearchContainerpivotPanelSectionpivotPanelSectionspivotPanelSectionTitlepivotPanelSwitchpivotPanelSwitchLabelpromptpromptActionpromptChangeListpromptChangesTogglepromptChangesToggleIconpromptContentpromptErrorpromptFeedbackpromptIconpromptIconContainerpromptTextresizablePanelHandleresizablePanelHandle--horizontalresizablePanelHandle--verticalrootroot--densityComfortableroot--densityCompactroot--densityStandardroot--disableUserSelectionrow--beingDraggedrow--detailPanelExpandedrow--draggingrow--dynamicHeightrow--editablerow--editingrow--firstVisiblerow--lastVisiblerowCountrowReorderCellrowReorderCell--draggablerowReorderCellContainerrowReorderCellPlaceholderrowSkeletonscrollAreascrollArea--downscrollArea--leftscrollArea--rightscrollArea--upscrollbarscrollbar--horizontalscrollbar--verticalscrollShadowscrollShadow--horizontalscrollShadow--verticalselectedRowCountsidebarsidebarHeadersortButtonsortIcontoolbarContainertoolbarDividertoolbarFilterListtoolbarLabeltoolbarQuickFiltertoolbarQuickFilterControltoolbarQuickFilterTriggertreeDataGroupingCelltreeDataGroupingCellTogglevirtualScrollervirtualScrollerContentvirtualScrollerContent--overflowedvirtualScrollerRenderZonewithBorderColorwithSidePanelwithVerticalBorder
- actionsCell
- aggregationColumnHeader
- aggregationColumnHeader--alignCenter
- aggregationColumnHeader--alignLeft
- aggregationColumnHeader--alignRight
- aggregationColumnHeaderLabel
- aggregationRowOverlayWrapper
- aiAssistantPanel
- aiAssistantPanelBody
- aiAssistantPanelConversation
- aiAssistantPanelConversationList
- aiAssistantPanelConversationTitle
- aiAssistantPanelEmptyText
- aiAssistantPanelFooter
- aiAssistantPanelHeader
- aiAssistantPanelSuggestions
- aiAssistantPanelSuggestionsItem
- aiAssistantPanelSuggestionsLabel
- aiAssistantPanelSuggestionsList
- aiAssistantPanelTitle
- aiAssistantPanelTitleContainer
- autoHeight
- autosizing
- booleanCell
- cell--editable
- cell--editing
- cell--flex
- cell--pinnedLeft
- cell--pinnedRight
- cell--rangeBottom
- cell--rangeLeft
- cell--rangeRight
- cell--rangeTop
- cell--selectionMode
- cell--textCenter
- cell--textLeft
- cell--textRight
- cell--withLeftBorder
- cell--withRightBorder
- cellCheckbox
- cellEmpty
- cellSkeleton
- checkboxInput
- collapsible
- collapsibleIcon
- collapsiblePanel
- collapsibleTrigger
- columnHeader
- columnHeader--alignCenter
- columnHeader--alignLeft
- columnHeader--alignRight
- columnHeader--dragging
- columnHeader--emptyGroup
- columnHeader--filledGroup
- columnHeader--filter
- columnHeader--filtered
- columnHeader--last
- columnHeader--moving
- columnHeader--numeric
- columnHeader--pinnedLeft
- columnHeader--pinnedRight
- columnHeader--sortable
- columnHeader--sorted
- columnHeader--withLeftBorder
- columnHeader--withRightBorder
- columnHeaderCheckbox
- columnHeaderDraggableContainer
- columnHeaderFilterInput
- columnHeaderFilterOperatorLabel
- columnHeaderTitle
- columnHeaderTitleContainer
- columnHeaderTitleContainerContent
- columnSeparator
- columnSeparator--resizable
- columnSeparator--resizing
- columnSeparator--sideLeft
- columnSeparator--sideRight
- columnsManagementEmptyText
- columnsManagementFooter
- columnsManagementHeader
- columnsManagementRow
- columnsManagementScrollArea
- columnsManagementSearchInput
- container--bottom
- container--top
- detailPanel
- detailPanelToggleCell
- detailPanelToggleCell--expanded
- editBooleanCell
- editInputCell
- editLongTextCell
- editLongTextCellPopperContent
- editLongTextCellPopup
- editLongTextCellTextarea
- editLongTextCellValue
- filterForm
- filterFormColumnInput
- filterFormDeleteIcon
- filterFormLogicOperatorInput
- filterFormOperatorInput
- filterFormValueInput
- filterIcon
- footerCell
- footerContainer
- groupingCriteriaCell
- groupingCriteriaCellToggle
- headerFilterRow
- iconButtonContainer
- iconSeparator
- longTextCell
- longTextCellCollapseButton
- longTextCellContent
- longTextCellExpandButton
- longTextCellPopperContent
- longTextCellPopup
- main
- main--hasPinnedRight
- mainContent
- menu
- menuIcon
- menuIconButton
- menuList
- menuOpen
- overlay
- overlayWrapper
- overlayWrapperInner
- panelContent
- panelFooter
- panelHeader
- panelWrapper
- paper
- pinnedRows
- pinnedRows--bottom
- pinnedRows--top
- pivotPanelAvailableFields
- pivotPanelBody
- pivotPanelField
- pivotPanelField--sorted
- pivotPanelFieldActionContainer
- pivotPanelFieldCheckbox
- pivotPanelFieldDragIcon
- pivotPanelFieldList
- pivotPanelFieldName
- pivotPanelHeader
- pivotPanelPlaceholder
- pivotPanelScrollArea
- pivotPanelSearchContainer
- pivotPanelSection
- pivotPanelSections
- pivotPanelSectionTitle
- pivotPanelSwitch
- pivotPanelSwitchLabel
- prompt
- promptAction
- promptChangeList
- promptChangesToggle
- promptChangesToggleIcon
- promptContent
- promptError
- promptFeedback
- promptIcon
- promptIconContainer
- promptText
- resizablePanelHandle
- resizablePanelHandle--horizontal
- resizablePanelHandle--vertical
- root
- root--densityComfortable
- root--densityCompact
- root--densityStandard
- root--disableUserSelection
- row--beingDragged
- row--detailPanelExpanded
- row--dragging
- row--dynamicHeight
- row--editable
- row--editing
- row--firstVisible
- row--lastVisible
- rowCount
- rowReorderCell
- rowReorderCell--draggable
- rowReorderCellContainer
- rowReorderCellPlaceholder
- rowSkeleton
- scrollArea
- scrollArea--down
- scrollArea--left
- scrollArea--right
- scrollArea--up
- scrollbar
- scrollbar--horizontal
- scrollbar--vertical
- scrollShadow
- scrollShadow--horizontal
- scrollShadow--vertical
- selectedRowCount
- sidebar
- sidebarHeader
- sortButton
- sortIcon
- toolbarContainer
- toolbarDivider
- toolbarFilterList
- toolbarLabel
- toolbarQuickFilter
- toolbarQuickFilterControl
- toolbarQuickFilterTrigger
- treeDataGroupingCell
- treeDataGroupingCellToggle
- virtualScroller
- virtualScrollerContent
- virtualScrollerContent--overflowed
- virtualScrollerRenderZone
- withBorderColor
- withSidePanel
- withVerticalBorder
- Source code
