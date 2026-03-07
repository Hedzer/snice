
# Data Grid - Column visibility
Define which columns are visible.


	
		
	
	
		Design and Development tips in your inbox. Every weekday.
	

ads via Carbon
By default, all the columns are visible.
The column's visibility can be switched through the user interface in two ways:
- By opening the column menu and clicking the Hide menu item.
- By clicking the Columns menu and toggling the columns to show or hide.
You can prevent the user from hiding a column through the user interface by setting the hideable in GridColDef to false.
In the following demo, the "username" column cannot be hidden.
Rows per page:
1–2 of 2

## Initialize the visible columns
To initialize the visible columns without controlling them, provide the model to the initialState prop.
Passing the visible columns to the initialState prop will only have an impact when the Data Grid is rendered for the first time. In order to update the visible columns after the first render, you need to use the columnVisibilityModel prop.
Rows per page:
1–20 of 20

## Controlled visible columns
Use the columnVisibilityModel prop to control the visible columns.
You can use the onColumnVisibilityModelChange prop to listen to the changes to the visible columns and update the prop accordingly.
Rows per page:
1–20 of 20

## Column visibility panel
The column visibility panel lets users control which columns are visible in the Data Grid.
The panel can be opened by:
- Clicking the Columns button in the toolbar.
- Clicking the Manage columns button in the column menu.
Rows per page:
1–10 of 10

### Disable the column visibility panel
Sometimes, the intention is to disable the columns panel or control the visible columns programmatically based on the application state.
To disable the column visibility panel, set the prop disableColumnSelector={true} and use the columnVisibilityModel prop to control the visible columns.
In the following demo, the columns panel is disabled, and access to columns id, quantity, and filledQuantity is only permitted for the Admin type user.
Rows per page:
1–10 of 10

### Customize the list of columns in columns management
To show or hide specific columns in the column visibility panel, use the slotProps.columnsManagement.getTogglableColumns prop. It should return an array of column field names.

### Disable actions in footer
To disable Show/Hide All checkbox or Reset button in the footer of the columns management component, pass disableShowHideToggle or disableResetButton to slotProps.columnsManagement.

### Customize action buttons behavior when search is active
By default, the Show/Hide All checkbox toggles the visibility of all columns, including the ones that are not visible in the current search results.
To only toggle the visibility of the columns that are present in the current search results, pass toggleAllMode: 'filteredOnly' to slotProps.columnsManagement.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Initialize the visible columns
- Controlled visible columns
- Column visibility panelDisable the column visibility panelCustomize the list of columns in columns managementDisable actions in footerCustomize action buttons behavior when search is active
- Disable the column visibility panel
- Customize the list of columns in columns management
- Disable actions in footer
- Customize action buttons behavior when search is active
- API
