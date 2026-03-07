
# Data Grid - Master-detail row panels
Implement master-detail row panels to let users view extended information without leaving the Data Grid.

## What is the master-detail pattern?
"Master-detail" is a design pattern for organizing information in which the "master" area lists the data and the "detail" sections provide further information about each item.
The Data Grid Pro provides the tools to implement master-detail row panels.
These are useful whenever you need to give end users additional information about row items without navigating away from the Grid.
A common example of this pattern is found in many email clients—users can click on an email from the master list to see its contents (details) as well as actions they can take such as replying, forwarding, and deleting.
To expand a row, click on the + icon or press Space when focused on a cell in the detail toggle column:

## Implementing master-detail row panels
To create master-detail row panels, pass a function to the getDetailPanelContent prop that returns the content to be rendered inside the panel.
You can use any valid React element—even another Data Grid.

### Detail panel height
By default, the detail panel height is 500px.
You can customize this by passing a function to the getDetailPanelHeight prop.
This function must return either a number or "auto":
- If it returns a number, then the panel will use that value (in pixels) for the height.
- If it returns "auto", then the height will be derived from the content.
The getDetailPanelContent and getDetailPanelHeight props are called with a GridRowParams object, which lets you return a different value for each row.
The demo below shows master-detail panels with heights derived from their contents:
Always memoize the function provided to getDetailPanelContent and getDetailPanelHeight.
The Data Grid depends on the referential value of these props to cache their values and optimize the rendering.

## Controlling expanded detail panels
To control which rows are expanded, pass a set of row IDs to the detailPanelExpandedRowIds prop.
You can pass a callback function to the onDetailPanelExpandedRowIds prop to detect when a row is expanded or collapsed.
To initialize the Data Grid with specific row panels expanded, use the initialState prop as shown below:
detailPanelExpandedRowIds: {}

## Lazy-loading detail panel content
You don't need to provide the content for detail panels upfront—instead, you can load it lazily when a row is expanded.
In the following example, the <DetailPanelContent /> component fetches data on mount.
This component is used by the getDetailPanelContent prop to render the detail panel content.
Lazy loading panels with auto height can lead to scrolling issues.
This happens because panels that are re-mounted briefly have a smaller height than they had when they were removed from the DOM by the virtualizer.
In that case, cache the last panel heights and provide those values from getDetailPanelHeight.
Check the Lazy loading detail panels with auto height recipe for implementation details.

## Using a detail panel as a form
As an alternative to the built-in row editing feature, you can render a form component inside the detail panel so users can edit the row values.
The demo below shows how to implement this behavior using react-hook-form, but other form libraries are also supported.

## Customizing the detail panel toggle
To change the icon used for the toggle, you can provide a different component for the icon slot as shown here:
You can also completely override the toggle component by adding another column to your set with field: GRID_DETAIL_PANEL_TOGGLE_FIELD.
This prevents the Data Grid from adding the default toggle column.
Then you can add a new toggle component using renderCell() as you would for any other column:
Because the field is the only property defined, it's up to you to configure any additional options (such as filtering, sorting, or disabling the column menu).
If you'd rather set up the toggle with basic options preconfigured, you can spread GRID_DETAIL_PANEL_TOGGLE_COL_DEF when defining the column, as shown below:
You can also use this approach to change the location of the toggle column, as shown in the demo below:
As with any other cell renderer, the value prop is also available, and it corresponds to the state of the row: it's set to true when expanded and false when collapsed.

## Customizing the detail panel column header
To render a custom header for the detail panel column, use the renderHeader property in the column definition.
This property receives a GridRenderHeaderParams object that contains colDef (the column definition) and field.
The snippet below shows how to do this:
For a more complex example of this use case, see the recipe for expanding or collapsing all detail panels.

## Disabling detail panel content scroll
By default, the detail panel's width is equal to the sum of the widths of all columns.
This means that when a horizontal scrollbar is present, scrolling it also scrolls the panel content.
To avoid this behavior, set the size of the detail panel to the outer size of the Data Grid.
Use apiRef.current.getRootDimensions() to get the latest dimension values.
And to prevent the panel from scrolling, set position: sticky and left: 0.
The following demo shows how to accomplish this—notice that the toggle column is pinned so it remains visible when the user scrolls horizontally:

## Master-detail row panel recipes
For more examples of how to customize master-detail row panels, check out the following recipes:
- One expanded detail panel at a time
- Expand or collapse all detail panels
- Toggling detail panels on row click
- Lazy loading detail panels with auto height

## apiRef
The Data Grid exposes a set of methods via the apiRef object that are used internally in the implementation of master-detail row panels.
The reference below describes the relevant functions.
See API object for more details.
This API should only be used as a last resort when the Data Grid's built-in props aren't sufficient for your specific use case.

### getExpandedDetailPanels()Returns the rows whose detail panel is open.
getExpandedDetailPanels()
Returns the rows whose detail panel is open.

### setExpandedDetailPanels()Changes which rows to expand the detail panel.
setExpandedDetailPanels()
Changes which rows to expand the detail panel.

### toggleDetailPanel()Expands or collapses the detail panel of a row.
toggleDetailPanel()
Expands or collapses the detail panel of a row.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- What is the master-detail pattern?
- Implementing master-detail row panelsDetail panel height
- Detail panel height
- Controlling expanded detail panels
- Lazy-loading detail panel content
- Using a detail panel as a form
- Customizing the detail panel toggle
- Customizing the detail panel column header
- Disabling detail panel content scroll
- Master-detail row panel recipes
- apiRef
- API
