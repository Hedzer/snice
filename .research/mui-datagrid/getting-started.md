
# Data Grid - Quickstart
Install the MUI X Data Grid package and start building your React data table.

## Installation
Install the Data Grid package that best suits your needs—Community, Pro, or Premium:
Plan
Not sure which package to choose?
You can start with the Community version and upgrade to Pro or Premium at any time.
Check out the Feature showcase for a list of features available in each package.

### Peer dependencies

#### Material UI
The Data Grid packages have a peer dependency on @mui/material.
If you're not already using it, install it now:

#### React
react and react-dom are also peer dependencies:

## Rendering a Data Grid

### Import the component
Import the Data Grid component that corresponds to the version you're using, along with the GridRowsProp and GridColDef utilities:

### Define rows
Each row in the Data Grid is an object with key-value pairs that correspond to the column and its value, respectively.
You should provide an id property for delta updates and improved performance.
The code snippet below defines three rows with values assigned to the name and description columns for each:

### Define columns
Each column in the Data Grid is an object with attributes defined in the GridColDef interface—you can import this interface to see all available properties.
The headerName property sets the name of the column, and the field property maps the column to its corresponding row values.
The snippet below builds on the code from the previous section to define the name and description columns referenced in the row definitions:

### Render the component
With the component and utilities imported, and rows and columns defined, you're now ready to render the Data Grid as shown below:
Rows per page:
1–3 of 3
You must set intrinsic dimensions on the Data Grid's parent container.

## TypeScript

### Theme augmentation
To benefit from CSS overrides and default prop customization with the theme, TypeScript users must import the following types.
These types use module augmentation to extend the default theme structure.

## Bundling
The Data Grid requires a bundler that can handle CSS imports.
If you're using a setup that doesn't support CSS imports out of the box, follow the instructions below for your specific environment.

### webpack
Update your config to add the style-loader and css-loader.

### Vite
CSS imports should work with no additional configuration when using Vite.

### Vitest
Add the Data Grid packages to test.deps.inline.

### Next.js
If you're using the App Router, CSS imports should work out of the box.
If you're using the Pages Router, you need to add the Data Grid packages to transpilePackages.

### Node.js
If you're importing the packages inside Node.js, you can make CSS imports a no-op like this:
Using require():
Using import:

### Jest
If you're using Jest, add the identity-obj-proxy package to mock CSS imports.

## API
- DataGrid
- DataGridPro
- DataGridPremium

## Using this documentation

### Feature availability
MUI X is open core—Community components are MIT-licensed, while more advanced features require a Pro or Premium commercial license.
See Licensing for details.
Throughout the documentation, Pro- and Premium-only features are denoted with the  and  icons, respectively.
All documentation for Community components and features also applies to their Pro and Premium counterparts.

### @mui/x-data-grid-generator
The @mui/x-data-grid-generator is a development-only package and should not be used in production.
You can use it to create a reproduction of a bug or generate demo data in your development environment.
You should not rely on its API—it doesn't follow semver.

### useDemoData hook
The useDemoData hook is a utility hook from the @mui/x-data-grid-generator package, used in demos throughout this documentation to provide realistic data without polluting the code with data generation logic.
It contains column definitions and generates random data for the Data Grid.
For more details on these definitions and the custom cell renderers available, see the custom columns demo where you can copy them from the demo source code.
Here's how it's used:
It comes with two datasets: Commodity and Employee.
You can customize the data generation by passing the custom options of type UseDemoDataOptions.
Was this page helpful?
•
•
Contents
- InstallationPeer dependencies
- Peer dependencies
- Rendering a Data GridImport the componentDefine rowsDefine columnsRender the component
- Import the component
- Define rows
- Define columns
- Render the component
- TypeScriptTheme augmentation
- Theme augmentation
- BundlingwebpackViteVitestNext.jsNode.jsJest
- webpack
- Vite
- Vitest
- Next.js
- Node.js
- Jest
- API
- Using this documentationFeature availability@mui/x-data-grid-generatoruseDemoData hook
- Feature availability
- @mui/x-data-grid-generator
- useDemoData hook
