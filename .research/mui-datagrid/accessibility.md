
# Data Grid - Accessibility
Learn how the Data Grid implements accessibility features and guidelines, including keyboard navigation that follows international standards.


	
		
	
	
		Review requests, book clients, and get paid with Squarespace.
	

ads via Carbon

## Guidelines
Common conformance guidelines for accessibility include:
- Globally accepted standard: WCAG
- US:
ADA - US Department of Justice
Section 508 - US federal agencies
- ADA - US Department of Justice
- Section 508 - US federal agencies
- Europe: EAA (European Accessibility Act)
WCAG 2.1 has three levels of conformance: A, AA, and AAA.
Level AA exceeds the basic criteria for accessibility and is a common target for most organizations, so this is what we aim to support.
The WAI-ARIA Authoring Practices provide valuable information on how to optimize the accessibility of a data grid.

## Density
DataGrid exposes the density prop which supports the following values:
- standard (default)
- compact
- comfortable

### Set the density programmatically
You can set the density programmatically in one of the following ways:
- Uncontrolled – initialize the density with the initialState.density prop.
<DataGrid
  initialState={{
    density: 'compact',
  }}
/>
CopyCopied(or Ctrl + C)
Uncontrolled – initialize the density with the initialState.density prop.
- Controlled – pass the density and onDensityChange props. For more advanced use cases, you can also subscribe to the densityChange grid event.
const [density, setDensity] = React.useState<GridDensity>('compact');

return (
  <DataGrid
    density={density}
    onDensityChange={(newDensity) => setDensity(newDensity)}
  />
);
CopyCopied(or Ctrl + C)
Controlled – pass the density and onDensityChange props. For more advanced use cases, you can also subscribe to the densityChange grid event.
The density prop applies the values determined by the rowHeight and columnHeaderHeight props, if supplied.
The user can override this setting with the optional toolbar density selector.
You can create a custom toolbar with a density selector that lets users change the density of the DataGrid, as shown in the demo below.
Rows per page:
1–4 of 4
See the Toolbar component—Settings menu for an example of how to create a settings menu that stores user preferences in local storage.

## Keyboard navigation
DataGrid listens for keyboard interactions from the user and emits events in response to key presses within cells.

### Tab sequence
According to WAI-ARIA Authoring Practices, only one of the focusable elements contained by a composite widget should be included in the page tab sequence.
For an element to be included in the tab sequence, it needs to have a tabIndex value of zero or greater.
When a user focuses on a DataGrid cell, the first inner element with tabIndex={0} receives the focus.
If there is no element with tabIndex={0}, the focus is set on the cell itself.
The two Data Grids below illustrate how the user experience is impacted by improper management of the page tab sequence, making it difficult to navigate through the data set:
Without focus management
Rows per page:
1–5 of 5
Correct focus management
Rows per page:
1–5 of 5
If you customize cell rendering with the renderCell method, you become responsible for removing focusable elements from the page tab sequence.
Use the tabIndex prop passed to the renderCell params to determine if the rendered cell has focus and, as a result, whether the inner elements should be removed from the tab sequence:

### Tab navigation
While the default tab sequence behavior works well for most use cases, you may want to customize how the Tab key navigates within the grid.
DataGrid provides the tabNavigation prop to control this behavior.
The tabNavigation prop supports the following values:
- "none" (default): This is the standard tab sequence behavior described above. It aligns with the grid composite widget pattern which states that only one of the focusable elements contained by the grid should be included in the page tab sequence.
In this case, DataGrid does not handle Tab key presses, allowing the browser's default tab sequence to control focus movement.
Pressing Tab or Shift+Tab moves the focus to the next or previous element in the page's tab sequence, respectively, which may be outside of the grid.
"none" (default): This is the standard tab sequence behavior described above. It aligns with the grid composite widget pattern which states that only one of the focusable elements contained by the grid should be included in the page tab sequence.
In this case, DataGrid does not handle Tab key presses, allowing the browser's default tab sequence to control focus movement.
Pressing Tab or Shift+Tab moves the focus to the next or previous element in the page's tab sequence, respectively, which may be outside of the grid.
- "content": Tab navigation is enabled only for grid cells (content area).
Pressing Tab moves focus to the next cell in the same row, or to the first cell of the next row if the key is pressed at the end of a row.
Pressing Shift+Tab moves the focus to the previous cell in the same row, or to the last cell of the previous row if the key is pressed at the start of a row.
When the focus is on a column header and Tab is pressed, the focus moves to the first cell.
Tab navigation is not enabled for headers, header filters, or column groups.
"content": Tab navigation is enabled only for grid cells (content area).
Pressing Tab moves focus to the next cell in the same row, or to the first cell of the next row if the key is pressed at the end of a row.
Pressing Shift+Tab moves the focus to the previous cell in the same row, or to the last cell of the previous row if the key is pressed at the start of a row.
When the focus is on a column header and Tab is pressed, the focus moves to the first cell.
Tab navigation is not enabled for headers, header filters, or column groups.
- "header": Tab navigation is enabled only for the header area (column groups, column headers, and header filters).
Pressing Tab moves focus to the next header element, and Shift+Tab moves focus to the previous header element.
When focus is on a cell and Shift+Tab is pressed, focus moves to the last header filter or column header.
Tab navigation is not enabled for grid cells.
"header": Tab navigation is enabled only for the header area (column groups, column headers, and header filters).
Pressing Tab moves focus to the next header element, and Shift+Tab moves focus to the previous header element.
When focus is on a cell and Shift+Tab is pressed, focus moves to the last header filter or column header.
Tab navigation is not enabled for grid cells.
- "all": Combines both "content" and "header" behaviors.
"all": Combines both "content" and "header" behaviors.
The demo below demonstrates how each tabNavigation mode affects keyboard navigation:
The tab barriers above and below the grid in the demo are included to make it easier to track navigation outside of the grid without leaving the demo area.
Press the Tab key multiple times to pass the barrier.

### Navigation
The key assignments in the table below apply to Windows and Linux users.
On macOS replace:
- Ctrl with ⌘ Command
- Alt with ⌥ Option
Some devices may lack certain keys, requiring the use of key combinations. In this case, replace:
- Page Up with Fn+Arrow Up
- Page Down with Fn+Arrow Down
- Home with Fn+Arrow Left
- End with Fn+Arrow Right
| Keys | Description | Arrow Left | Navigate between cell elements | Arrow Down | Navigate between cell elements | Arrow Right | Navigate between cell elements | Arrow Up | Navigate between cell elements | Home | Navigate to the first cell of the current row | End | Navigate to the last cell of the current row | Ctrl+Home | Navigate to the first cell of the first row | Ctrl+End | Navigate to the last cell of the last row | Space | Navigate to the next scrollable page | Page Up | Navigate to the previous scrollable page | Page Down | Navigate to the next scrollable page | Space | Toggle row children expansion when grouping cell is focused 
### Selection
| Keys | Description | Shift+Space | Select/Deselect the current row | Shift+Arrow Up/Down | Select the current row and the row above or below | Shift+ Click on cell | Select the range of rows between the first and the last clicked rows | Ctrl+A | Select all rows | Ctrl+C | Copy the currently selected rows | Ctrl+ Click on cell | Enable multi-selection | Ctrl+ Click on a selected row | Deselect the row 
### Sorting
| Keys | Description | Ctrl+ Click on header | Enable multi-sorting | Shift+ Click on header | Enable multi-sorting | Shift+Enter | Enable multi-sorting when column header is focused | Enter | Sort column when column header is focused | Ctrl+Enter | Open column menu when column header is focused 
### Group and pivot
| Keys | Description | Ctrl+Enter | Toggle the detail panel of a row 
## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Guidelines
- DensitySet the density programmatically
- Set the density programmatically
- Keyboard navigationTab sequenceTab navigationNavigationSelectionSortingGroup and pivot
- Tab sequence
- Tab navigation
- Navigation
- Selection
- Sorting
- Group and pivot
- API
