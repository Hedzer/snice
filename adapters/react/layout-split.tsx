// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutSplit component
 */
export interface LayoutSplitProps extends SniceBaseProps {
  direction?: any;
  ratio?: any;

}

/**
 * LayoutSplit - React adapter for snice-layout-split
 *
 * This is an auto-generated React wrapper for the Snice layout-split component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-split';
 * import { LayoutSplit } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutSplit />;
 * }
 * ```
 */
export const LayoutSplit: SniceReactComponent<LayoutSplitProps, SniceComponentRef> = createReactAdapter<LayoutSplitProps, false>({
  tagName: 'snice-layout-split',
  properties: ["direction","ratio"],
  events: {},
  formAssociated: false
});
