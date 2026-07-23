// GENERATED FILE — DO NOT EDIT.
// Source: components/breadcrumbs/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Breadcrumbs component
 */
export interface BreadcrumbsProps extends SniceBaseProps {
  items?: any;
  separator?: any;
  size?: any;
  maxItems?: any;
  collapsed?: any;
  onBreadcrumbClick?: (event: any) => void;
}

/**
 * Breadcrumbs - React adapter for snice-breadcrumbs
 *
 * This is an auto-generated React wrapper for the Snice breadcrumbs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/breadcrumbs/snice-breadcrumbs';
 * import { Breadcrumbs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Breadcrumbs />;
 * }
 * ```
 */
export const Breadcrumbs: SniceReactComponent<BreadcrumbsProps, SniceComponentRef> = createReactAdapter<BreadcrumbsProps, false>({
  tagName: 'snice-breadcrumbs',
  properties: ["items","separator","size","maxItems","collapsed"],
  events: {"breadcrumb-click":"onBreadcrumbClick"},
  formAssociated: false
});
