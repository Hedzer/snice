
# Data Grid - Multi-filters
Let end users apply multiple filters to the Data Grid simultaneously.
By default, it's only possible to apply one filter at a time to the Data Grid.
With the Data Grid Pro, users can apply multiple filters based on different criteria for more fine-grained data analysis.
They can apply multiple filters to a single column and multiple columns simultaneously.
The demo below shows how this feature works.
Click the filter icon to open the menu and add the first filter—the Data Grid dynamically responds as you enter a value.
Then click Add Filter to apply additional criteria.

## Implementing multi-filters
The multi-filter feature is available by default with the Data Grid Pro and doesn't require any additional configuration.

### One filter per column
To limit the user to only applying one filter to any given column, you can use the filterColumns and getColumnForNewFilter props available to slotProps.filterPanel as shown in the demo below:

## Disabling multi-filters
To disable multi-filtering, pass the disableMultipleColumnsFiltering to the Data Grid Pro.

### Remove multi-filter action buttons
To disable the Add Filter or Remove All buttons, pass disableAddFilterButton or disableRemoveAllButton, respectively, to componentsProps.filterPanel as shown below:

## API
- GridFilterPanel
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Implementing multi-filtersOne filter per column
- One filter per column
- Disabling multi-filtersRemove multi-filter action buttons
- Remove multi-filter action buttons
- API
