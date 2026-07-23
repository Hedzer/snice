// GENERATED FILE — DO NOT EDIT.
// Source: components/list/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const ListItem: SniceReactComponent<ListItemProps, SniceComponentRef> = createReactAdapter<ListItemProps, false>({
  tagName: 'snice-list-item',
  properties: ["heading","description","selected","disabled"],
  events: {},
  formAssociated: false
});
