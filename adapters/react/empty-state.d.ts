import type { SniceBaseProps } from './types';
/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps extends SniceBaseProps {
    size?: any;
    icon?: any;
    title?: any;
    description?: any;
    actionText?: any;
    actionHref?: any;
}
/**
 * EmptyState - React adapter for snice-empty-state
 *
 * This is an auto-generated React wrapper for the Snice empty-state component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/empty-state';
 * import { EmptyState } from 'snice/react';
 *
 * function MyComponent() {
 *   return <EmptyState />;
 * }
 * ```
 */
export declare const EmptyState: import("react").ForwardRefExoticComponent<Omit<EmptyStateProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=empty-state.d.ts.map