// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * CellActions - React adapter for snice-cell-actions
 *
 * This is an auto-generated React wrapper for the Snice cell-actions component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-actions';
 * import { CellActions } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellActions />;
 * }
 * ```
 */
export const CellActions = createReactAdapter({
    tagName: 'snice-cell-actions',
    properties: ["actions", "column", "rowData", "value", "align", "type"],
    events: { "cell-action": "onCellAction" },
    formAssociated: false
});
//# sourceMappingURL=cell-actions.js.map