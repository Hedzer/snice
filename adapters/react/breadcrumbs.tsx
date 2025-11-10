import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Breadcrumbs component
 */
export interface BreadcrumbsProps extends SniceBaseProps {
  items?: any;
  separator?: any;
  size?: any;
  maxItems?: any;
  collapsed?: any;
  private?: any;

}

/**
 * Breadcrumbs - React adapter for snice-breadcrumbs
 *
 * This is an auto-generated React wrapper for the Snice breadcrumbs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/breadcrumbs';
 * import { Breadcrumbs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Breadcrumbs />;
 * }
 * ```
 */
export const Breadcrumbs = createReactAdapter<BreadcrumbsProps>({
  tagName: 'snice-breadcrumbs',
  properties: ["items","separator","size","maxItems","collapsed","private"],
  events: {},
  formAssociated: false
});
