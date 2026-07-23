// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Row component
 */
export interface RowProps extends SniceBaseProps {
  selected?: any;
  hoverable?: any;
  clickable?: any;
  selectable?: any;
  selectionDisabled?: any;
  data?: any;
  index?: any;
  columns?: any;
  onRowClick?: (event: any) => void;
  onRowSelect?: (event: any) => void;
  onRowHover?: (event: any) => void;
}

/**
 * Row - React adapter for snice-row
 *
 * This is an auto-generated React wrapper for the Snice row component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-row';
 * import { Row } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Row />;
 * }
 * ```
 */
export const Row: SniceReactComponent<RowProps, SniceComponentRef> = createReactAdapter<RowProps, false>({
  tagName: 'snice-row',
  properties: ["selected","hoverable","clickable","selectable","selectionDisabled","data","index","columns"],
  events: {"row-click":"onRowClick","row-select":"onRowSelect","row-hover":"onRowHover"},
  formAssociated: false
});
