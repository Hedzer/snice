
# Data Grid - Row pinning
Implement pinning to keep rows in the Data Grid visible at all times.
Pinned rows (also known as sticky, frozen, and locked) are visible at all times while scrolling the Data Grid vertically.
With the Data Grid Pro, you can pin rows to the top or bottom of the grid.

## Implementing row pinning
Use the pinnedRows prop to define the rows to be pinned to the top or bottom of the Data Grid, as shown below:

### Pinned row data formatting
The data format for pinned rows is the same as for the rows prop (see Feeding data).
Pinned rows data should also meet Row identifier requirements.
As with the rows prop, pinnedRows should keep the same reference between two renders.
Otherwise the Data Grid will reapply heavy work like sorting and filtering.

## Controlling pinned rows
You can control which rows are pinned by making dynamic changes to pinnedRows.
The demo below uses the actions column type to provide buttons that let the user pin a row to the top or bottom of the Grid.

## Pinned rows appearance
By default, the pinned rows sections are separated from non-pinned rows with a border and a shadow that appears when there is scroll.
You can change the appearance by setting the pinnedRowsSectionSeparator prop to 'border' or 'border-and-shadow'.

## Usage with other features
Pinned rows are not affected by sorting, filtering, or pagination—they remain pinned regardless of how these features are applied.
Rows per page:
1–25 of 97
Pinned rows do not support the following features:
- selection
- row grouping
- tree data
- row reordering
- master-detail row panels
When there are pinned rows present in a Grid, you can still use these features with rows that aren't pinned.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Implementing row pinningPinned row data formatting
- Pinned row data formatting
- Controlling pinned rows
- Pinned rows appearance
- Usage with other features
- API
