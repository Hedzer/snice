import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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

}

/**
 * Pagination - React adapter for snice-pagination
 *
 * This is an auto-generated React wrapper for the Snice pagination component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/pagination';
 * import { Pagination } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Pagination />;
 * }
 * ```
 */
export const Pagination = createReactAdapter<PaginationProps>({
  tagName: 'snice-pagination',
  properties: ["current","total","siblings","showFirst","showLast","showPrev","showNext","size","variant"],
  events: {},
  formAssociated: false
});
