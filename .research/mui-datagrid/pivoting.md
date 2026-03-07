
# Data Grid - Pivoting
Rearrange rows and columns to view data from multiple perspectives.
The Data Grid Premium's pivoting feature lets users transform the data in their grid by reorganizing rows and columns, creating dynamic cross-tabulations of data.
This makes it possible to analyze data from different angles and gain insights that would be difficult to see in the default grid view.
If you're new to the concept of pivoting, check out the Understanding pivoting page to learn how it works through interactive examples.
Pivoting performs certain computations and uses them to override corresponding props.
When pivot mode is active, the following props are ignored: rows, columns, rowGroupingModel, aggregationModel, getAggregationPosition, columnVisibilityModel, columnGroupingModel, groupingColDef, headerFilters, disableRowGrouping, and disableAggregation.
This document covers client-side pivoting.
For pivoting on the server side, see Server-side pivoting.

## Quick start
Pivoting is enabled by default and can be accessed through the icon in the toolbar.
In the demo below, the pivot panel is already open and some pivoting parameters have been set.
Use the Pivot switch at the top of the panel to toggle pivoting off and on.
You can drag and drop existing columns in the Rows, Columns, and Values dropdown menus to change how the data is pivoted.

## Pivot model
The pivot model is a configuration object that defines rows, columns, and values of the pivot Grid:

## Initialize pivoting
Use the initialState prop to initialize uncontrolled pivoting.
This is the recommended method unless you specifically need to control the state.
You can initialize the pivot model, toggle pivot panel visibility, and toggle the pivot mode as shown below:

## Controlled pivoting
For fully controlled pivoting state, you can use the following props:
- Pivot model:
pivotModel: Controls the current pivot configuration.
onPivotModelChange: Callback fired when the pivot model changes.
- pivotModel: Controls the current pivot configuration.
- onPivotModelChange: Callback fired when the pivot model changes.
- Pivot mode toggle:
pivotActive: Controls whether pivot mode is active.
onPivotActiveChange: Callback fired when the pivot mode changes between active and inactive.
- pivotActive: Controls whether pivot mode is active.
- onPivotActiveChange: Callback fired when the pivot mode changes between active and inactive.
- Pivot panel:
pivotPanelOpen: Controls whether the pivot panel is open.
onPivotPanelOpenChange: Callback fired when the pivot panel is opened or closed.
- pivotPanelOpen: Controls whether the pivot panel is open.
- onPivotPanelOpenChange: Callback fired when the pivot panel is opened or closed.

## Using fields in the pivot model multiple times
While this is not supported yet, we are working to bring this feature to the Data Grid.
Subscribe to this issue to get notified when it's available.

## Disable pivoting
To disable pivoting feature completely, set the disablePivoting prop to true:

### Disable pivoting for specific columns
To exclude specific column from pivoting, set the pivotable: false on its column definition:

## Derived columns in pivot mode
In pivot mode, it's often useful to group data by a year or quarter.
The Data Grid automatically generates year and quarter columns for each Date column for this purpose.
Use pivotingColDef() to customize derived columns definition.
For example, the sales dataset used throughout the examples has a Quarter column.
But in a real-world dataset, each sales record would typically have a precise Transaction Date field, as in the following demo.
The Transaction Date column is represented by additional columns in pivot mode: Transaction Date (Year) and Transaction Date (Quarter):

### Custom derived columns
Use the getPivotDerivedColumns() prop to customize derived columns.
This prop is called for each original column and returns an array of derived columns, or undefined if no derived columns are needed.
To sort the derived columns by a value different than the column header name—for instance, to display months of the year—define both valueGetter() and valueFormatter() for the derived column.

## Sticky column groups
Depending on the pivot mode, some column groups might exceed the width of the Data Grid viewport.
To improve the user experience, you can make these column groups "sticky" so that the column group labels remain visible while scrolling horizontally.
You can use the sx prop to apply the necessary styles:

## Advanced demo
The following demo showcases pivoting on a larger Commodities dataset with over 30 different columns to choose for pivoting parameters.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Quick start
- Pivot model
- Initialize pivoting
- Controlled pivoting
- Using fields in the pivot model multiple times
- Disable pivotingDisable pivoting for specific columns
- Disable pivoting for specific columns
- Derived columns in pivot modeCustom derived columns
- Custom derived columns
- Sticky column groups
- Advanced demo
- API
