// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutCentered component
 */
export interface LayoutCenteredProps extends SniceBaseProps {
  width?: any;
  hasBrand?: any;
  hasFooter?: any;

}

/**
 * LayoutCentered - React adapter for snice-layout-centered
 *
 * This is an auto-generated React wrapper for the Snice layout-centered component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-centered';
 * import { LayoutCentered } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutCentered />;
 * }
 * ```
 */
export const LayoutCentered: SniceReactComponent<LayoutCenteredProps, SniceComponentRef> = createReactAdapter<LayoutCenteredProps, false>({
  tagName: 'snice-layout-centered',
  properties: ["width","hasBrand","hasFooter"],
  events: {},
  formAssociated: false
});
