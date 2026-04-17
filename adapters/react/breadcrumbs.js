// GENERATED FILE — DO NOT EDIT.
// Source: components/breadcrumbs/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Breadcrumbs - React adapter for snice-breadcrumbs
 *
 * This is an auto-generated React wrapper for the Snice breadcrumbs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/breadcrumbs';
 * import { Breadcrumbs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Breadcrumbs />;
 * }
 * ```
 */
export const Breadcrumbs = createReactAdapter({
    tagName: 'snice-breadcrumbs',
    properties: ["items", "separator", "size", "maxItems", "collapsed", "renderTrigger"],
    events: { "breadcrumb-click": "onBreadcrumbClick" },
    formAssociated: false
});
//# sourceMappingURL=breadcrumbs.js.map