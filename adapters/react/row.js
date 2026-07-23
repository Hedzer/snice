// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Row - React adapter for snice-row
 *
 * This is an auto-generated React wrapper for the Snice row component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-row';
 * import { Row } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Row />;
 * }
 * ```
 */
export const Row = createReactAdapter({
    tagName: 'snice-row',
    properties: ["selected", "hoverable", "clickable", "selectable", "selectionDisabled", "data", "index", "columns"],
    events: { "row-click": "onRowClick", "row-select": "onRowSelect", "row-hover": "onRowHover" },
    formAssociated: false
});
//# sourceMappingURL=row.js.map