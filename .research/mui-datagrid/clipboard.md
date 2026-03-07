
# Data Grid - Copy and paste
Copy and paste data using clipboard.


	
		
	
	
		Review requests, book clients, and get paid with Squarespace.
	

ads via Carbon

## Clipboard copy
You can copy selected grid data to the clipboard using the Ctrl+C (⌘ Command+C on macOS) keyboard shortcut.
The copied cell values are separated by a tab (\t) character and the rows are separated by a new line (\n) character.
The priority of the data copied to the clipboard is the following, from highest to lowest:
- If more than one cell is selected (see Cell selection), the selected cells are copied
- If one or more rows are selected (see Row selection), the selected rows are copied
- If there is a single cell selected, the single cell is copied
Copied data:

## Clipboard paste
To make sure the copied cells are formatted correctly and can be parsed,
it is recommended to set the ignoreValueFormatterDuringExport prop to true.
During clipboard copy operation, the raw cell values will be copied instead of the formatted values,
so that the values can be parsed correctly during the paste operation.
You can paste data from clipboard using the Ctrl+V (⌘ Command+V on macOS) keyboard shortcut.
The paste operation only affects cells in the columns that are editable.
Same as with editing, you can use valueParser to modify the pasted value and valueSetter to update the row with new values.
See Value parser and value setter section of the editing documentation for more details.
The behavior of the clipboard paste operation depends on the selection state of the Data Grid and the data pasted from clipboard.
The priority is the following, from highest to lowest:
- If multiple cells are selected (see Cell selection), the selected cells are updated with the pasted values.
- If one or more rows are selected (see Row selection), the selected rows are updated with the pasted values.
- If a single cell is selected, the values are pasted starting from the selected cell.

### Disable clipboard paste
To disable clipboard paste, set the disableClipboardPaste prop to true:

### Disable pasting to the specific cells within a row
The clipboard paste operation respects the cell editing rules.
Use this to prevent pasting into certain cells based on row data or other conditions.
The demo below shows a product inventory grid with the following paste restrictions:
- Price column: Cannot be pasted in archived products
- Status column: Cannot be pasted in any row
- Last Modified column: Cannot be pasted in any row
Try selecting multiple cells and pasting data.
Cells marked as non-editable by isCellEditable will not be updated.

### Persisting pasted data
Clipboard paste uses the same API for persistence as Editing—use the processRowUpdate prop to persist the updated row in your data source:
The row will be updated with a value returned by the processRowUpdate callback.
If the callback throws or returns a rejected promise, the row will not be updated.
The demo below shows how to persist the pasted data in the browser's sessionStorage.

### Events
The following events are fired during the clipboard paste operation:
- clipboardPasteStart - fired when the clipboard paste operation starts
- clipboardPasteEnd - fired when all row updates from clipboard paste have been processed
For convenience, you can also listen to these events using their respective props:
- onClipboardPasteStart
- onClipboardPasteEnd
Additionally, there is the onBeforeClipboardPasteStart prop, which is called before the clipboard paste operation starts
and can be used to cancel or confirm the paste operation:
The demo below uses the Dialog component for paste confirmation.
If confirmed, the Data Grid displays a loading indicator during the paste operation.

## Format of the clipboard data
By default, the clipboard copy and paste operations use the following format:
- The cell values are separated by a tab (\t) character.
- The rows are separated by a new line (\n) character.
You can use clipboardCopyCellDelimiter and splitClipboardPastedText props to change the format:
The demo below uses , (comma) character as a cell delimiter for both copy and paste operations:

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Clipboard copy
- Clipboard paste Disable clipboard pasteDisable pasting to the specific cells within a rowPersisting pasted dataEvents
- Disable clipboard paste
- Disable pasting to the specific cells within a row
- Persisting pasted data
- Events
- Format of the clipboard data
- API
