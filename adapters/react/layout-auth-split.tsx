// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutAuthSplit component
 */
export interface LayoutAuthSplitProps extends SniceBaseProps {
  panelPosition?: any;
  contained?: any;

}

/**
 * LayoutAuthSplit - React adapter for snice-layout-auth-split
 *
 * This is an auto-generated React wrapper for the Snice layout-auth-split component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-auth-split';
 * import { LayoutAuthSplit } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutAuthSplit />;
 * }
 * ```
 */
export const LayoutAuthSplit: SniceReactComponent<LayoutAuthSplitProps, SniceComponentRef> = createReactAdapter<LayoutAuthSplitProps, false>({
  tagName: 'snice-layout-auth-split',
  properties: ["panelPosition","contained"],
  events: {},
  formAssociated: false
});
