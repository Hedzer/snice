// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Header - React adapter for snice-header
 *
 * This is an auto-generated React wrapper for the Snice header component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-header';
 * import { Header } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Header />;
 * }
 * ```
 */
export const Header = createReactAdapter({
    tagName: 'snice-header',
    properties: ["sticky", "columns", "selectable", "sortable", "currentSort", "allSelected", "someSelected"],
    events: { "header-sort": "onHeaderSort", "header-select-all": "onHeaderSelectAll", "header-filter": "onHeaderFilter" },
    formAssociated: false
});
//# sourceMappingURL=header.js.map