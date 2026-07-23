// GENERATED FILE — DO NOT EDIT.
// Source: components/list/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const List: SniceReactComponent<ListProps, SniceComponentRef> = createReactAdapter<ListProps, false>({
  tagName: 'snice-list',
  properties: ["dividers","searchable","search","infinite","loading","noResults","threshold","skeletonCount"],
  events: {},
  formAssociated: false
});
