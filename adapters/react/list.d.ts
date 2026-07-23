import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the List component
 */
export interface ListProps extends SniceBaseProps {
    dividers?: any;
    searchable?: any;
    search?: any;
    infinite?: any;
    loading?: any;
    noResults?: any;
    threshold?: any;
    skeletonCount?: any;
}
/**
 * List - React adapter for snice-list
 *
 * This is an auto-generated React wrapper for the Snice list component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/list/snice-list';
 * import { List } from 'snice/react';
 *
 * function MyComponent() {
 *   return <List />;
 * }
 * ```
 */
export declare const List: SniceReactComponent<ListProps, SniceComponentRef>;
//# sourceMappingURL=list.d.ts.map