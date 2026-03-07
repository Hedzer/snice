
# Data Grid - Export
Export the rows in CSV or Excel formats, or use the browser's print dialog to print or save as PDF.


	
		
	
	
		Create a website that reflects your personal brand with Squarespace. Start your free trial.
	

ads via Carbon

## Enabling export

### Default toolbar
To display the default export options, pass the showToolbar prop, as shown in the demo below.
Rows per page:
1–100 of 100

### Custom toolbar
See the Export component for examples of how to add export triggers to a custom toolbar.

## Export options
Following are the available export options:
- Print
- CSV
- Clipboard
- Excel
Where relevant, the options are automatically shown in the toolbar. You can customize their respective behavior by passing an options object either to slotsProps.toolbar or to the Export trigger itself if you have a custom toolbar:
Each export option has its own API page:
- printOptions
- csvOptions
- excelOptions

## Remove export options
You can remove an export option from the toolbar by setting the disableToolbarButton property to true in its options object.
In the following example, the print export is disabled.
Rows per page:
1–4 of 4

## Exported columns
By default, the export will only contain the visible columns of the Data Grid.
There are a few ways to include or hide other columns.
- Set the disableExport attribute to true in GridColDef for columns you don't want to be exported.
- Set allColumns in export option to true to also include hidden columns. Those with disableExport=true will not be exported.
- Set the exact columns to be exported in the export option. Setting fields overrides the other properties. Such that the exported columns are exactly those in fields in the same order.

## Exported rows
By default, the Data Grid exports the selected rows if there are any.
If not, it exports all rows except the footers (filtered and sorted rows, according to active rules), including the collapsed ones.

### Customizing the rows to export
Alternatively, you can set the getRowsToExport function and export any rows you want, as in the following example.
The grid exports a few selectors that can help you get the rows for the most common use-cases:
| Selector | Behavior | gridRowIdsSelector | The rows in their original order. | gridSortedRowIdsSelector | The rows after applying the sorting rules. | gridFilteredSortedRowIdsSelector | The rows after applying the sorting rules, and the filtering rules. | gridExpandedSortedRowIdsSelector | The rows after applying the sorting rules, the filtering rules, and without the collapsed rows. | gridPaginatedVisibleSortedGridRowIdsSelector | The rows after applying the sorting rules, the filtering rules, without the collapsed rows and only for the current page (Note: If the pagination is disabled, it will still take the value of page and pageSize). 1–10 of 86
When using Row grouping, it can be useful to remove the groups from the CSV export.

## CSV export

### Exported cells
When the value of a field is an object or a renderCell is provided, the CSV export might not display the value correctly.
You can provide a valueFormatter with a string representation to be used.

### File encoding
You can use csvOptions to specify the format of the export, such as the delimiter character used to separate fields, the fileName, or utf8WithBom to prefix the exported file with UTF-8 Byte Order Mark (BOM).
For more details on these options, please visit the csvOptions API page.

### Escape formulas
By default, the formulas in the cells are escaped.
This is to prevent the formulas from being executed when the CSV file is opened in Excel.
If you want to keep the formulas working, you can set the escapeFormulas option to false.

## Print export

### Modify the Data Grid style
By default, the printed grid is equivalent to printing a page containing only the Data Grid.
To modify the styles used for printing, such as colors, you can either use the @media print media query or the pageStyle property of printOptions.
For example, if the Data Grid is in dark mode, the text color will be inappropriate for printing (too light).
With media query, you have to start your sx object with @media print key, such that all the style inside are only applied when printing.
With pageStyle option, you can override the main content color with a more specific selector.

### Customize grid display
By default, the print export displays all the DataGrid. It is possible to remove the footer and the toolbar by setting respectively hideFooter and hideToolbar to true.
If rows are selected when exporting, the checkboxes will not be included in the printed page. To export the checkboxes you can set includeCheckboxes to true.
For more options to customize the print export, please visit the printOptions API page.

## Custom export format
You can add custom export formats the Data Grid by creating a custom toolbar and export menu.
The demo below shows how to add a custom JSON export option.
Rows per page:
1–4 of 4

## Excel export
This feature relies on exceljs.
With Excel export, users can translate the column types and tree structures of a Data Grid to an Excel file.
Columns with types 'boolean', 'number', 'singleSelect', 'date', and 'dateTime' are exported in their corresponding type in Excel. Please ensure the rows values have the correct type, you can always convert them as needed.
The excel export option will appear in the default toolbar export menu by passing the showToolbar prop to <DataGridPremium />, as shown in the demo below.
The export option can be added to custom toolbars using the Export Excel component.

### Customization

#### Customizing the columns
You can use the columnsStyles property to customize the column style.
This property accepts an object in which keys are the column field and values an exceljs style object.
This can be used to specify value formatting or to add some colors.

#### Customizing the document
You can customize the document using two callback functions:
- exceljsPreProcess called before adding the rows' dataset.
- exceljsPostProcess called after the dataset has been exported to the document.
Both functions receive { workbook, worksheet } as input.
These are exceljs objects that let you directly manipulate the Excel file.
Thanks to these two methods, you can modify the metadata of the exported spreadsheet.
You can also use it to add custom content on top or bottom of the worksheet, as follows:
Since exceljsPreProcess is applied before adding the content of the Data Grid, you can use it to add some informative rows on top of the document.
The content of the Data Grid will start on the next row after those added by exceljsPreProcess.
To customize the rows after the Data Grid content, you should use exceljsPostProcess. As it is applied after adding the content, you can also use it to access the generated cells.
In the following demo, both methods are used to set a custom header and a custom footer.

### Using a web worker
This feature only works with @mui/styled-engine v5.11.8 or newer.
Make sure that the Material UI version you are using is also installing the correct version for this dependency.
Instead of generating the Excel file in the main thread, you can delegate the task to a web worker.
This method reduces the amount of time that the main thread remains frozen so users can interact with the grid while the data is exported in background.
To start using web workers for the Excel export, first you need to create a file with the content below.
This file will be later used as the worker script, so it must be accessible by a direct URL.
The final step is to pass the path to the file created to excel options or the API method:
If you are using Next.js or webpack 5, use the following syntax instead.
Make sure to pass the relative path, considering the current file, to the worker script.
It is not necessary to make the script public because webpack will handle that automatically for you.
Since the main thread is not locked while the data is exported, it is important to give feedback for users that something is in progress.
You can pass a callback to the onExcelExportStateChange prop and display a message or loader.
The following demo contains an example using a Snackbar:
When opening the demo above in CodeSandbox or StackBlitz you need to manually create the worker.ts script.
If you want to use the exceljsPreProcess and exceljsPostProcess options to customize the final spreadsheet, as shown in the Customization section above, you have to pass them to setupExcelExportWebWorker instead.
This is necessary because functions cannot be passed to the web worker.

### Escape formulas
By default, the formulas in the cells are escaped.
This is to prevent the formulas from being executed when the file is opened in Excel.
If you want to keep the formulas working, you can set the escapeFormulas option to false.

## Clipboard
The clipboard export lets you copy the content of the Data Grid to the clipboard.
For more information, check the Clipboard copy docs.

## Recipes

### Server-side export
To export server-side data from the Data Grid, use updateRows() to temporarily load all data before calling an export function.
After the export completes, restore the rows to their original state.
The following example demonstrates how to export data as CSV from a server-side data source.
1–5 of 10000
The exported data includes any filters and sorting that users have applied.
Try changing the sort order or hiding columns, then click export to see how it affects the output.

## apiRef
The Data Grid exposes a set of methods via the apiRef object that are used internally in the implementation of the export feature.
The reference below describes the relevant functions.
See API object for more details.
This API should only be used as a last resort when the Data Grid's built-in props aren't sufficient for your specific use case.

### CSV

### exportDataAsCsv()Downloads and exports a CSV of the grid's data.
exportDataAsCsv()
Downloads and exports a CSV of the grid's data.

### getDataAsCsv()Returns the grid data as a CSV string. This method is used internally by exportDataAsCsv.
getDataAsCsv()
Returns the grid data as a CSV string. This method is used internally by exportDataAsCsv.

### Print

### exportDataAsPrint()Print the grid's data.
exportDataAsPrint()
Print the grid's data.

### Excel

### exportDataAsExcel()Downloads and exports an Excel file of the grid's data.
exportDataAsExcel()
Downloads and exports an Excel file of the grid's data.

### getDataAsExcel()Returns the grid data as an exceljs workbook. This method is used internally by exportDataAsExcel.
getDataAsExcel()
Returns the grid data as an exceljs workbook. This method is used internally by exportDataAsExcel.

## API
- GridCsvExportOptions
- GridPrintExportOptions
- GridExcelExportOptions
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Enabling exportDefault toolbarCustom toolbar
- Default toolbar
- Custom toolbar
- Export options
- Remove export options
- Exported columns
- Exported rowsCustomizing the rows to export
- Customizing the rows to export
- CSV exportExported cellsFile encodingEscape formulas
- Exported cells
- File encoding
- Escape formulas
- Print exportModify the Data Grid styleCustomize grid display
- Modify the Data Grid style
- Customize grid display
- Custom export format
- Excel export CustomizationUsing a web workerEscape formulas
- Customization
- Using a web worker
- Escape formulas
- Clipboard
- RecipesServer-side export
- Server-side export
- apiRefCSVPrintExcel
- CSV
- Print
- Excel
- API
