import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the ListItem component
 */
export interface ListItemProps extends SniceBaseProps {
    heading?: any;
    description?: any;
    selected?: any;
    disabled?: any;
}
/**
 * ListItem - React adapter for snice-list-item
 *
 * This is an auto-generated React wrapper for the Snice list-item component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/list/snice-list-item';
 * import { ListItem } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ListItem />;
 * }
 * ```
 */
export declare const ListItem: SniceReactComponent<ListItemProps, SniceComponentRef>;
//# sourceMappingURL=list-item.d.ts.map