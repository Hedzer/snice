import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Sortable component
 */
export interface SortableProps extends SniceBaseProps {
    direction?: any;
    handle?: any;
    disabled?: any;
    group?: any;
    onSortStart?: (event: any) => void;
    onSortEnd?: (event: any) => void;
    onSortChange?: (event: any) => void;
}
/**
 * Sortable - React adapter for snice-sortable
 *
 * This is an auto-generated React wrapper for the Snice sortable component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sortable/snice-sortable';
 * import { Sortable } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sortable />;
 * }
 * ```
 */
export declare const Sortable: SniceReactComponent<SortableProps, SniceComponentRef>;
//# sourceMappingURL=sortable.d.ts.map