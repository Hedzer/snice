// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Layout component
 */
export interface LayoutProps extends SniceBaseProps {
  contained?: any;

}

/**
 * Layout - React adapter for snice-layout
 *
 * This is an auto-generated React wrapper for the Snice layout component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout';
 * import { Layout } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Layout />;
 * }
 * ```
 */
export const Layout: SniceReactComponent<LayoutProps, SniceComponentRef> = createReactAdapter<LayoutProps, false>({
  tagName: 'snice-layout',
  properties: ["contained"],
  events: {},
  formAssociated: false
});
