// GENERATED FILE — DO NOT EDIT.
// Source: components/pagination/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Pagination component
 */
export interface PaginationProps extends SniceBaseProps {
  current?: any;
  total?: any;
  siblings?: any;
  showFirst?: any;
  showLast?: any;
  showPrev?: any;
  showNext?: any;
  size?: any;
  variant?: any;
  onPaginationChange?: (event: any) => void;
}

/**
 * Pagination - React adapter for snice-pagination
 *
 * This is an auto-generated React wrapper for the Snice pagination component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pagination/snice-pagination';
 * import { Pagination } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Pagination />;
 * }
 * ```
 */
export const Pagination: SniceReactComponent<PaginationProps, SniceComponentRef> = createReactAdapter<PaginationProps, false>({
  tagName: 'snice-pagination',
  properties: ["current","total","siblings","showFirst","showLast","showPrev","showNext","size","variant"],
  events: {"pagination-change":"onPaginationChange"},
  formAssociated: false
});
