import type { SniceBaseProps } from './types';
/**
 * Props for the Sortable component
 */
export interface SortableProps extends SniceBaseProps {
    direction?: any;
    handle?: any;
    disabled?: any;
    group?: any;
}
/**
 * Sortable - React adapter for snice-sortable
 *
 * This is an auto-generated React wrapper for the Snice sortable component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sortable';
 * import { Sortable } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sortable />;
 * }
 * ```
 */
export declare const Sortable: import("react").ForwardRefExoticComponent<Omit<SortableProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=sortable.d.ts.map