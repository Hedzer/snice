// GENERATED FILE — DO NOT EDIT.
// Source: components/sortable/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const Sortable: SniceReactComponent<SortableProps, SniceComponentRef> = createReactAdapter<SortableProps, false>({
  tagName: 'snice-sortable',
  properties: ["direction","handle","disabled","group"],
  events: {"sort-start":"onSortStart","sort-end":"onSortEnd","sort-change":"onSortChange"},
  formAssociated: false
});
