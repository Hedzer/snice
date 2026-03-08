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
    events: {},
    formAssociated: false
});
//# sourceMappingURL=permission-matrix.js.map