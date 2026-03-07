
# Data Grid - Column groups
Group your columns.


	
		
	
	
		Check out the latest remote job listings from the leading job board for designers, developers, and creative pros.
	

ads via Carbon
Grouping columns lets you have a multi-level hierarchy of columns in your header.

## Define column groups
You can define column groups with the columnGroupingModel prop.
This prop receives an array of column groups.
A column group is defined by at least two properties:
- groupId: a string used to identify the group
- children: an array containing the children of the group
The children attribute can contain two types of objects:
- leaves with type { field: string }, which add the column with the corresponding field to this group
- other column groups, making it possible to create nested groups
A column can only be associated with one group.
Rows per page:
1–9 of 9

## Customize column group
In addition to the required groupId and children, you can use the following optional properties to customize a column group:
- headerName: the string displayed as the column's name (instead of groupId).
- description: a text for the tooltip.
- headerClassName: a CSS class for styling customization.
- renderHeaderGroup: a function returning custom React component.
Rows per page:
1–9 of 9

## Group header height
By default, column group headers are the same height as column headers. This will be the default 56 pixels or a custom value set with the columnHeaderHeight prop.
The columnGroupHeaderHeight prop can be used to size column group headers independently of column headers.
Rows per page:
1–9 of 9

## Column reordering
By default, the columns that are part of a group cannot be dragged to outside their group.
You can customize this behavior on specific groups by setting freeReordering: true in a column group object.
In the example below, the Full name column group can be divided, but not other column groups.

## Collapsible column groups
The demo below uses renderHeaderGroup to add a button to collapse/expand the column group.
Rows per page:
1–9 of 9

## Manage group visibility 🚧
This feature isn't available yet, but it is planned—you can 👍 upvote this GitHub issue to help us prioritize it.
Please don't hesitate to leave a comment there to describe your needs, especially if you have a use case we should address or you're facing specific pain points with your current solution.
With this feature, users would be able to expand and collapse grouped columns to toggle their visibility.

## Column group ordering 🚧
This feature isn't available yet, but it is planned—you can 👍 upvote this GitHub issue to help us prioritize it.
Please don't hesitate to leave a comment there to describe your needs, especially if you have a use case we should address or you're facing specific pain points with your current solution.
With this feature, users would be able to drag and drop grouped headers to move all grouped children at once (which is already possible for normal columns).

## API
- DataGrid
- DataGridPro
- DataGridPremium
Was this page helpful?
•
•
Contents
- Define column groups
- Customize column group
- Group header height
- Column reordering
- Collapsible column groups
- Manage group visibility 🚧
- Column group ordering 🚧
- API
