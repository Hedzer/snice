// GENERATED FILE — DO NOT EDIT.
// Source: components/permission-matrix/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * PermissionMatrix - React adapter for snice-permission-matrix
 *
 * This is an auto-generated React wrapper for the Snice permission-matrix component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/permission-matrix';
 * import { PermissionMatrix } from 'snice/react';
 *
 * function MyComponent() {
 *   return <PermissionMatrix />;
 * }
 * ```
 */
export const PermissionMatrix = createReactAdapter({
    tagName: 'snice-permission-matrix',
    properties: ["roles", "permissions", "matrix", "readonly"],
    events: { "permission-toggle": "onPermissionToggle", "matrix-change": "onMatrixChange" },
    formAssociated: false
});
//# sourceMappingURL=permission-matrix.js.map