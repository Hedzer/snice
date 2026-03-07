
# Data Grid - Row height
Customize the height of your rows.


	
		
	
	
		Start an annual website plan, and get a free domain name with Squarespace.
	

ads via Carbon

## Static row height
By default, the rows have a height of 52 pixels.
This matches the normal height in the Material Design guidelines.
Use the rowHeight prop to change this default value, as shown below:
Rows per page:
1–100 of 100

## Variable row height
If you need some rows to have different row heights, this can be achieved using the getRowHeight prop.
This function is called for each visible row and if the return value is a number then that number will be set as that row's rowHeight.
If the return value is null or undefined, then the rowHeight prop will take effect for the given row.
Rows per page:
1–5 of 5
Changing the Data Grid density does not affect the rows with variable row height.
You can access the density factor from the params provided to the getRowHeight prop
Always memoize the function provided to getRowHeight.
The Data Grid bases on the referential value of these props to cache their values and optimize the rendering.

## Dynamic row height
Instead of a fixed row height, you can let the Data Grid calculate the height of each row based on its content.
To do so, return "auto" on the function passed to the getRowHeight prop.
The following demo shows this feature in action:
Rows per page:
1–100 of 200
The dynamic row height implementation is based on a lazy approach, which means that the rows are measured as they are rendered.
Because of this, you may see the size of the scrollbar thumb changing during scroll.
This side effect happens because a row height estimation is used while a row is not rendered, then this value is replaced once the true measurement is obtained.
You can configure the estimated value used by passing a function to the getEstimatedRowHeight prop.
If not provided, the default row height of 52px is used as estimation.
It's recommended to pass this prop if the content deviates too much from the default value.
Rows per page:
1–10 of 10
When the height of a row is set to "auto", the final height will follow exactly the content size and ignore the density.
Add padding to the cells to increase the space between the content and the cell borders.

### Column virtualization
By default, the virtualization of the columns is disabled to force all columns to be rendered at the same time and calculate the row height correctly.
However, this can lead to poor performance when rendering a lot of columns.
If you need column virtualization, you can set the virtualizeColumnsWithAutoRowHeight prop to true.
With this approach, the Data Grid measures the row height based on the visible columns.
However, the row height might change during horizontal scrolling.
Rows per page:
1–100 of 100

## Row density
Give your users the option to change the default row density to match their preferences—compact, standard, or comfortable.
Density is calculated based on the rowHeight and/or columnHeaderHeight props, when present.
See Density for details.

## Row spacing
You can use the getRowSpacing prop to increase the spacing between rows.
This prop is called with a GridRowSpacingParams object.
Rows per page:
1–100 of 200
By default, setting getRowSpacing will change the marginXXX CSS properties of each row.
To add a border instead, set rowSpacingType to "border" and customize the color and style.
Adding a bottom margin or border to rows that also have a detail panel is not recommended because the detail panel relies on the bottom margin to work.
As an alternative, you can use the top spacing to define the space between rows.
It's easier to always increase the next row spacing no matter if the detail panel is expanded or not, but you can use gridDetailPanelExpandedRowIdsSelector to apply a spacing depending on the open state.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Static row height
- Variable row height
- Dynamic row heightColumn virtualization
- Column virtualization
- Row density
- Row spacing
- API
