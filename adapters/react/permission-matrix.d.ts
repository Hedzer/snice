import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the PermissionMatrix component
 */
export interface PermissionMatrixProps extends SniceBaseProps {
    roles?: any;
    permissions?: any;
    matrix?: any;
    readonly?: any;
    onPermissionToggle?: (event: any) => void;
    onMatrixChange?: (event: any) => void;
}
/**
 * PermissionMatrix - React adapter for snice-permission-matrix
 *
 * This is an auto-generated React wrapper for the Snice permission-matrix component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/permission-matrix/snice-permission-matrix';
 * import { PermissionMatrix } from 'snice/react';
 *
 * function MyComponent() {
 *   return <PermissionMatrix />;
 * }
 * ```
 */
export declare const PermissionMatrix: SniceReactComponent<PermissionMatrixProps, SniceComponentRef>;
//# sourceMappingURL=permission-matrix.d.ts.map