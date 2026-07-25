// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutDocs component
 */
export interface LayoutDocsProps extends SniceBaseProps {
  sidebarOpen?: any;
  contained?: any;

}

/**
 * LayoutDocs - React adapter for snice-layout-docs
 *
 * This is an auto-generated React wrapper for the Snice layout-docs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-docs';
 * import { LayoutDocs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutDocs />;
 * }
 * ```
 */
export const LayoutDocs: SniceReactComponent<LayoutDocsProps, SniceComponentRef> = createReactAdapter<LayoutDocsProps, false>({
  tagName: 'snice-layout-docs',
  properties: ["sidebarOpen","contained"],
  events: {},
  formAssociated: false
});
