import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Layout component
 */
export interface LayoutProps extends SniceBaseProps {


}

/**
 * Layout - React adapter for snice-layout
 *
 * This is an auto-generated React wrapper for the Snice layout component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout';
 * import { Layout } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Layout />;
 * }
 * ```
 */
export const Layout = createReactAdapter<LayoutProps>({
  tagName: 'snice-layout',
  properties: [],
  events: {},
  formAssociated: false
});
