import type { SniceBaseProps } from './types';
/**
 * Props for the PermissionMatrix component
 */
export interface PermissionMatrixProps extends SniceBaseProps {
    roles?: any;
    permissions?: any;
    matrix?: any;
    readonly?: any;
}
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
export declare const PermissionMatrix: import("react").ForwardRefExoticComponent<Omit<PermissionMatrixProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=permission-matrix.d.ts.map