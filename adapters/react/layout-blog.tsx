// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutBlog component
 */
export interface LayoutBlogProps extends SniceBaseProps {
  useNav?: any;

}

/**
 * LayoutBlog - React adapter for snice-layout-blog
 *
 * This is an auto-generated React wrapper for the Snice layout-blog component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-blog';
 * import { LayoutBlog } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutBlog />;
 * }
 * ```
 */
export const LayoutBlog: SniceReactComponent<LayoutBlogProps, SniceComponentRef> = createReactAdapter<LayoutBlogProps, false>({
  tagName: 'snice-layout-blog',
  properties: ["useNav"],
  events: {},
  formAssociated: false
});
