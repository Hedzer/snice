
# Data Grid - Filtering
Easily filter your rows based on one or several criteria.


	
		
	
	
		Review requests, book clients, and get paid with Squarespace.
	

ads via Carbon
The filters can be modified through the Data Grid interface in several ways:
- By opening the column menu and clicking the Filter menu item.
- By clicking the Filters button in the Data Grid toolbar (if enabled).
Each column type has its own filter operators.
The demo below lets you explore all the operators for each built-in column type.
See the dedicated section to learn how to create your own custom filter operator.
Rows per page:
1–100 of 100

## Single and multi-filters
The Data Grid can only filter rows according to one criterion at a time.
To use multi-filters, you need to upgrade to the Pro plan or above.

## Pass filters to the Data Grid

### Structure of the model
The full typing details can be found on the GridFilterModel API page.
The filter model is composed of a list of items and a logicOperator:

#### The items
A filter item represents a filtering rule and is composed of several elements:
- filterItem.field: the field on which the rule applies.
- filterItem.value: the value to look for.
- filterItem.operator: name of the operator method to use (for example contains), matches the value key of the operator object.
- filterItem.id (): required when multiple filter items are used.
Some operators do not need any value (for instance the isEmpty operator of the string column).

#### The logicOperator
The logicOperator tells the Data Grid if a row should satisfy all (AND) filter items or at least one (OR) in order to be considered valid.
If no logicOperator is provided, the Data Grid will use GridLogicOperator.Or by default.

### Initialize the filters
To initialize the filters without controlling them, provide the model to the initialState prop.
Rows per page:
1–67 of 67

### Controlled filters
Use the filterModel prop to control the filter applied on the rows.
You can use the onFilterModelChange prop to listen to changes to the filters and update the prop accordingly.
Rows per page:
1–70 of 70

## Disable the filters

### For all columns
Filters are enabled by default, but you can easily disable this feature by setting the disableColumnFilter prop.
Rows per page:
1–100 of 100

### For some columns
To disable the filter of a single column, set the filterable property in GridColDef to false.
In the example below, the rating column cannot be filtered.
Rows per page:
1–100 of 100

### Filter non-filterable columns programmatically
You can initialize the filterModel, set the filterModel prop, or use the API method apiRef.current.setFilterModel to set the filters for non-filterable columns. These filters will be applied but will be read-only on the UI and the user won't be able to change them.
Rows per page:
1–83 of 83

## Ignore diacritics (accents)
When filtering, diacritics—accented letters such as é or à—are considered distinct from their standard counterparts (e and a).
This can lead to a poor experience when users expect them to be treated as equivalent.
If your dataset includes diacritics that need to be ignored, you can pass the ignoreDiacritics prop to the Data Grid:
The ignoreDiacritics prop affects all columns and filter types, including standard filters, quick filters, and header filters.

## apiRef
The Data Grid exposes a set of methods via the apiRef object that are used internally in the implementation of the filtering feature.
The reference below describes the relevant functions.
See API object for more details.
This API should only be used as a last resort when the Data Grid's built-in props aren't sufficient for your specific use case.

### deleteFilterItem()Deletes a GridFilterItem.
deleteFilterItem()
Deletes a GridFilterItem.

### getFilterState()Returns the filter state for the given filter model without applying it to the Data Grid.
getFilterState()
Returns the filter state for the given filter model without applying it to the Data Grid.

### hideFilterPanel()Hides the filter panel.
hideFilterPanel()
Hides the filter panel.

### ignoreDiacritics()Returns the value of the ignoreDiacritics prop.
ignoreDiacritics()
Returns the value of the ignoreDiacritics prop.

### setFilterLogicOperator()Changes the GridLogicOperator used to connect the filters.
setFilterLogicOperator()
Changes the GridLogicOperator used to connect the filters.

### setFilterModel()Sets the filter model to the one given by model.
setFilterModel()
Sets the filter model to the one given by model.

### setQuickFilterValues()Set the quick filter values to the one given by values
setQuickFilterValues()
Set the quick filter values to the one given by values

### showFilterPanel()Shows the filter panel. If targetColumnField is given, a filter for this field is also added.
showFilterPanel()
Shows the filter panel. If targetColumnField is given, a filter for this field is also added.

### upsertFilterItem()Updates or inserts a GridFilterItem.
upsertFilterItem()
Updates or inserts a GridFilterItem.

### upsertFilterItems()Updates or inserts many GridFilterItem.
upsertFilterItems()
Updates or inserts many GridFilterItem.

## Selectors

### gridExpandedRowCountSelectorGet the amount of rows accessible after the filtering process.

### gridExpandedSortedRowEntriesSelectorGet the id and the model of the rows accessible after the filtering process.
Does not contain the collapsed children.

### gridExpandedSortedRowIdsSelectorGet the id of the rows accessible after the filtering process.
Does not contain the collapsed children.

### gridFilterModelSelectorGet the current filter model.

### gridFilteredDescendantRowCountSelectorGet the amount of descendant rows accessible after the filtering process.

### gridFilteredRowCountSelectorGet the amount of rows accessible after the filtering process.
Includes top level and descendant rows.

### gridFilteredSortedRowEntriesSelectorGet the id and the model of the rows accessible after the filtering process.
Contains the collapsed children.

### gridFilteredSortedRowIdsSelectorGet the id of the rows accessible after the filtering process.
Contains the collapsed children.

### gridFilteredSortedTopLevelRowEntriesSelectorGet the id and the model of the top level rows accessible after the filtering process.

### gridFilteredTopLevelRowCountSelectorGet the amount of top level rows accessible after the filtering process.

### gridQuickFilterValuesSelectorGet the current quick filter values.
More information about the selectors and how to use them on the dedicated page

## API
- GridFilterForm
- GridFilterItem
- GridFilterModel
- GridFilterOperator
- GridFilterPanel
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Single and multi-filters
- Pass filters to the Data GridStructure of the modelInitialize the filtersControlled filters
- Structure of the model
- Initialize the filters
- Controlled filters
- Disable the filtersFor all columnsFor some columnsFilter non-filterable columns programmatically
- For all columns
- For some columns
- Filter non-filterable columns programmatically
- Ignore diacritics (accents)
- apiRef
- Selectors
- API
