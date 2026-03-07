
# Data Grid - Virtualization
The grid is high performing thanks to its rows and columns virtualization engine.


	
		
	
	
		Design and Development tips in your inbox. Every weekday.
	

ads via Carbon
DOM virtualization is what makes it possible for the Data Grid to handle an unlimited* number of rows and columns.
This is a built-in feature of the rendering engine and greatly improves rendering performance.
*unlimited: Browsers set a limit on the number of pixels a scroll container can host: 17.5 million pixels on Firefox, 33.5 million pixels on Chrome, Edge, and Safari. A reproduction.

## Row virtualization
Row virtualization is the insertion and removal of rows as the Data Grid scrolls vertically.
The grid renders some additional rows above and below the visible rows. You can use rowBufferPx prop to hint to the Data Grid the area to render, but this value may not be respected in certain situations, for example during high-speed scrolling.
Row virtualization is limited to 100 rows in the Data Grid component.
Row virtualization does not work with the autoHeight prop enabled.

## Column virtualization
Column virtualization is the insertion and removal of columns as the Data Grid scrolls horizontally.
- Overscanning by at least one column lets the arrow key focus on the next (not yet visible) item.
- Overscanning slightly can reduce or prevent a flash of empty space when a user first starts scrolling.
- Overscanning more lets the built-in search feature of the browser find more matching cells.
- Overscanning too much can negatively impact performance.
By default, columns coming under 150 pixels region are rendered outside of the viewport. You can change this option with the columnBufferPx prop. As for rowBufferPx, the value may be ignored in some situations. The following demo renders 1,000 columns in total:
Rows per page:
1–100 of 100
You can disable column virtualization by calling apiRef.current.unstable_setColumnVirtualization(false), or by setting the columnBufferPx to a high value.
Column virtualization is disabled when dynamic row height is enabled.
See dynamic row height and column virtualization to learn more.

## Disable virtualization
The virtualization can be disabled completely using the disableVirtualization prop.
You may want to turn it off to be able to test the Data Grid with a headless browser, like jsdom.
Disabling the virtualization will increase the size of the DOM and drastically reduce the performance.
Use it only for testing purposes or on small datasets.

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Row virtualization
- Column virtualization
- Disable virtualization
- API
