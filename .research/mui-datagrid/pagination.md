
# Data Grid - Pagination
Easily paginate your rows and only fetch what you need.


	
		
	
	
		Check out the latest remote job listings from the leading job board for designers, developers, and creative pros.
	

ads via Carbon

## Enabling pagination
The default pagination behavior depends on your plan:
Exported CSV and Excel files include all data and disregard pagination by default.
To apply pagination to exported files, review the available row selectors.

### Community plan
For the Community Data Grid, pagination is enabled by default and cannot be disabled.
Rows per page:
1–100 of 500

### Pro  and Premium
For the Pro and Premium Data Grid, pagination is disabled by default; use the pagination prop to enable it.
1–4 of 15

## Size of the page
The Data Grid (MIT license) is limited to pages of up to 100 rows.
If you want larger pages, you will need to upgrade to Pro plan or above.
By default, each page contains 100 rows. The user can change the size of the page through the selector in the footer.

### Page size options
You can customize the options shown in the "Rows per page" select using the pageSizeOptions prop.
You should provide an array of items, each item should be one of these types:
- number, each number will be used for the option's label and value.
<DataGrid pageSizeOptions={[5, 10, 25]}>
CopyCopied(or Ctrl + C)
number, each number will be used for the option's label and value.
- object, the value and label keys will be used respectively for the value and label of the option. Define value as -1 to display all results.
<DataGrid pageSizeOptions={[10, 100, { value: 1000, label: '1,000' }, { value: -1, label: 'All' }]}>
CopyCopied(or Ctrl + C)
object, the value and label keys will be used respectively for the value and label of the option. Define value as -1 to display all results.
Rows per page:
1–5 of 100

### Automatic page size
Use the autoPageSize prop to auto-scale the pageSize to match the container height and the max number of rows that can be displayed without a vertical scroll bar.
You cannot use both the autoPageSize and autoHeight props at the same time because autoHeight scales the height of the Data Grid according to the pageSize.
1–5 of 100

## Pagination model
The pagination model is an object containing the current page and the size of the page. The default value is { page: 0, pageSize: 100 }. To change the default value, make it controlled by paginationModel prop or initialize a custom value using initialState.pagination.paginationModel.

### Initializing the pagination model
To initialize the pagination model without controlling it, provide the paginationModel to the initialState prop. If you don't provide a value for one of the properties, the default value will be used.
Rows per page:
1–25 of 500

### Controlled pagination model
Pass the paginationModel prop to control the size and current page of the grid. You can use the onPaginationModelChange prop to listen to changes to the paginationModel and update the prop accordingly.
Rows per page:
1–25 of 500

## Server-side pagination
By default, the pagination is handled on the client.
This means you have to give the rows of all pages to the Data Grid.
If your dataset is too big, and you want to fetch the pages on demand, you can use server-side pagination.
If you enable server-side pagination with no other server-side features, then the Data Grid will only be provided with partial data for filtering and sorting.
To be able to work with the entire dataset, you must also implement server-side filtering and server-side sorting.
The demo below does exactly that.
1–5 of 100
In general, the server-side pagination could be categorized into two types:
- Index-based pagination
- Cursor-based pagination
Check out Selection—Usage with server-side pagination for more details.

### Index-based pagination
The index-based pagination uses the page and pageSize to fetch the data from the server page by page.
To enable server-side pagination, you need to:
- Set the paginationMode prop to server
- Use the onPaginationModelChange prop to react to the page changes and load the data from the server
The server-side pagination can be further categorized into sub-types based on the availability of the total number of rows or rowCount.
The Data Grid uses the rowCount to calculate the number of pages and to show the information about the current state of the pagination in the footer.
You can provide the rowCount in one of the following ways:
- Initialize.
Use the initialState.pagination.rowCount prop to initialize the rowCount.
- Control.
Use the rowCount prop along with onRowCountChange to control the rowCount and reflect the changes when the row count is updated.
- Set using the API.
Use the apiRef.current.setRowCount method to set the rowCount after the Grid is initialized.
There can be three different possibilities regarding the availability of the rowCount on the server-side:
- Row count is available (known)
- Row count is not available (unknown)
- Row count is available but is not accurate and may update later on (estimated)
The rowCount prop is used in server-side pagination mode to inform the DataGrid about the total number of rows in your dataset.
This prop is ignored when the paginationMode is set to client, that is when the pagination is handled on the client-side.
You can configure rowCount, paginationMeta.hasNextPage, and estimatedRowCount props to handle the above scenarios.
| rowCount | paginationMeta.hasNextPage | estimatedRowCount | Known row count | number | — | — | Unknown row count | -1 | boolean | — | Estimated row count | -1 | boolean | number 
#### Known row count
Pass the props to the Data Grid as explained in the table above to handle the case when the actual row count is known, as the following example demonstrates.
1–5 of 100
If the value rowCount becomes undefined during loading, it will reset the page to zero.
To avoid this issue, you can memoize the rowCount value to ensure it doesn't change during loading:

#### Unknown row count
Pass the props to the Data Grid as explained in the table above to handle the case when the actual row count is unknown, as the following example demonstrates.
Rows per page:
1–5 of more than 5
The value of the hasNextPage variable might become undefined during loading if it's handled by some external fetching hook resulting in unwanted computations, one possible solution could be to memoize the paginationMeta:

#### Estimated row count
Estimated row count could be considered a hybrid approach that switches between the "Known row count" and "Unknown row count" use cases.
Initially, when an estimatedRowCount is set and rowCount={-1}, the Data Grid behaves as in the "Unknown row count" use case, but with the estimatedRowCount value shown in the pagination footer.
If the number of rows loaded exceeds the estimatedRowCount, the Data Grid ignores the estimatedRowCount and the behavior is identical to the "Unknown row count" use case.
When the hasNextPage returns false or rowCount is set to a positive number, the Data Grid switches to the "Known row count" behavior.
In the following example, the actual row count is 1000 but the Data Grid is initially provided with estimatedRowCount={100}.
You can set the rowCount to the actual row count by pressing the "Set Row Count" button.
Rows per page:
1–50 of around 100
The hasNextPage must not be set to false until there are actually no records left to fetch, because when hasNextPage becomes false, the Grid considers this as the last page and tries to set the rowCount value to a finite value.
If an external data fetching library sets the values to undefined during loading, you can memoize the paginationMeta value to ensure it doesn't change during loading as shown in the "Unknown row count" section.
🌍 Localization of the estimated row count
The Data Grid uses the Table Pagination component from the Material UI library which doesn't support estimated row count. Until this is supported natively by the Table Pagination component, a workaround to make the localization work is to provide the paginationDisplayedRows function to the localeText object as per the locale you are interested in.
The Grid injects an additional variable estimated to the paginationDisplayedRows function which you can use to accommodate the estimated row count.
The following example demonstrates how to show the estimated row count in the pagination footer in the Croatian (hr-HR) language.
For more information, see the Translation keys section of the localization documentation.

### Cursor-based pagination
You can also handle servers with cursor-based pagination.
To do so, you just have to keep track of the next cursor associated with each page you fetched.
1–5 of 100

## Custom pagination UI
You can customize the rendering of the pagination in the footer following the component section of the documentation.

## apiRef
The Data Grid exposes a set of methods via the apiRef object that are used internally in the implementation of the pagination feature.
The reference below describes the relevant functions.
See API object for more details.
This API should only be used as a last resort when the Data Grid's built-in props aren't sufficient for your specific use case.

### setPage()Sets the displayed page to the value given by page.
setPage()
Sets the displayed page to the value given by page.

### setPageSize()Sets the number of displayed rows to the value given by pageSize.
setPageSize()
Sets the number of displayed rows to the value given by pageSize.

### setPaginationMeta()Sets the paginationMeta to a new value.
setPaginationMeta()
Sets the paginationMeta to a new value.

### setPaginationModel()Sets the paginationModel to a new value.
setPaginationModel()
Sets the paginationModel to a new value.

### setRowCount()Sets the rowCount to a new value.
setRowCount()
Sets the rowCount to a new value.

## Selectors

### gridPageCountSelectorGet the amount of pages needed to display all the rows if the pagination is enabled

### gridPageSelectorGet the index of the page to render if the pagination is enabled

### gridPageSizeSelectorGet the maximum amount of rows to display on a single page if the pagination is enabled

### gridPaginatedVisibleSortedGridRowEntriesSelectorGet the id and the model of each row to include in the current page if the pagination is enabled.

### gridPaginatedVisibleSortedGridRowIdsSelectorGet the id of each row to include in the current page if the pagination is enabled.

### gridPaginationMetaSelectorGet the pagination meta

### gridPaginationModelSelectorGet the pagination model

### gridPaginationRowCountSelectorGet the row count

### gridPaginationRowRangeSelectorGet the index of the first and the last row to include in the current page if the pagination is enabled.

### gridVisibleRowsSelectorGet the rows, range and rowIndex lookup map after filtering and sorting.
Does not contain the collapsed children.
More information about the selectors and how to use them on the dedicated page

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Enabling paginationCommunity planPro  and Premium
- Community plan
- Pro  and Premium
- Size of the pagePage size optionsAutomatic page size
- Page size options
- Automatic page size
- Pagination modelInitializing the pagination modelControlled pagination model
- Initializing the pagination model
- Controlled pagination model
- Server-side paginationIndex-based paginationCursor-based pagination
- Index-based pagination
- Cursor-based pagination
- Custom pagination UI
- apiRef
- Selectors
- API
