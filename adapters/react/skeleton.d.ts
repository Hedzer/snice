import type { SniceBaseProps } from './types';
/**
 * Props for the Skeleton component
 */
export interface SkeletonProps extends SniceBaseProps {
    variant?: any;
    width?: any;
    height?: any;
    animation?: any;
    count?: any;
    spacing?: any;
}
/**
 * Skeleton - React adapter for snice-skeleton
 *
 * This is an auto-generated React wrapper for the Snice skeleton component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/skeleton';
 * import { Skeleton } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Skeleton />;
 * }
 * ```
 */
export declare const Skeleton: import("react").ForwardRefExoticComponent<Omit<SkeletonProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=skeleton.d.ts.map