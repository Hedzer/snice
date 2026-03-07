
# Data Grid - Quick filter
One filter field to quickly filter grid.


	
		
	
	
		Create a website that reflects your personal brand with Squarespace. Start your free trial.
	

ads via Carbon
Quick filter lets users filter rows by multiple columns with a single text input.
By default, the quick filter considers the input as a list of values separated by space and keeps only rows that contain all the values.
The quick filter is displayed by default when showToolbar is passed to the <DataGrid/> component. See the Quick Filter component for examples on how to add the quick filter to a custom toolbar.
Rows per page:
1–35 of 35

## Initialize the quick filter values
The quick filter values can be initialized by setting the filter.filterModel.quickFilterValues property of the initialState prop.
Rows per page:
1–3 of 3

## Including hidden columns
By default, the quick filter excludes hidden columns.
To include hidden columns in the quick filter, set filterModel.quickFilterExcludeHiddenColumns to false:
In the demo below, the company column is hidden. You'll only see 5 results because rows where the company value is 'Warner Bros.' are excluded.
However, when you disable the Exclude hidden columns switch, the rows containing 'Warner' in the company field will be displayed again, even though the column remains hidden.
Rows per page:
1–5 of 5

## Custom filtering logic
The logic used for quick filter can be switched to filter rows that contain at least one of the values specified instead of testing if it contains all of them.
To do so, set quickFilterLogicOperator to GridLogicOperator.Or as follows:
With the default settings, quick filter will only consider columns with types 'string','number', and 'singleSelect'.
- For 'string' and 'singleSelect' columns, the cell's formatted value must contain the value
- For 'number' columns, the cell's formatted value must equal the value
To modify or add the quick filter operators, add the property getApplyQuickFilterFn to the column definition.
This function is quite similar to getApplyFilterFn.
This function takes as an input a value of the quick filter and returns another function that takes the cell value as an input and returns true if it satisfies the operator condition.
In the example below, a custom filter is created for the date column to check if it contains the correct year.
To remove the quick filtering on a given column set getApplyQuickFilterFn: () => null.
In the demo below, the column "Name" is not searchable with the quick filter, and 4 digits figures will be compared to the year of column "Created on."
Rows per page:
1–100 of 100

## Parsing values
The values used by the quick filter are obtained by splitting the input string with space.
If you want to implement a more advanced logic, the quick filter accepts a custom parser.
This function takes the quick filter input string and returns an array of values.
If you control the quickFilterValues either by controlling filterModel or with the initial state, the content of the input must be updated to reflect the new values.
By default, values are joint with spaces. You can customize this behavior by providing a custom formatter.
This formatter can be seen as the inverse of the parser.
For example, the following parser lets you search words containing a space by using the ',' to split values.
In the following demo, the quick filter value "Saint Martin, Saint Lucia" will return rows with country is Saint Martin or Saint Lucia.
Rows per page:
1–100 of 100

## Ignore diacritics (accents)
When filtering, diacritics—accented letters such as é or à—are considered distinct from their standard counterparts (e and a).
This can lead to a poor experience when users expect them to be treated as equivalent.
If your dataset includes diacritics that need to be ignored, you can pass the ignoreDiacritics prop to the Data Grid:
In the demo below, you can use the Ignore diacritics toggle to see how the filtering behavior changes:
The ignoreDiacritics prop affects all columns and filter types, including standard filters, quick filters, and header filters.

## Disable quick filter
The quick filter can be removed from the toolbar by setting slotProps.toolbar.showQuickFilter to false:

## API
- GridToolbarQuickFilter
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Initialize the quick filter values
- Including hidden columns
- Custom filtering logic
- Parsing values
- Ignore diacritics (accents)
- Disable quick filter
- API
