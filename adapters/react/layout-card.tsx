// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutCard component
 */
export interface LayoutCardProps extends SniceBaseProps {
  columns?: any;
  gap?: any;
  hasFooter?: any;
  hasHeader?: any;

}

/**
 * LayoutCard - React adapter for snice-layout-card
 *
 * This is an auto-generated React wrapper for the Snice layout-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-card';
 * import { LayoutCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutCard />;
 * }
 * ```
 */
export const LayoutCard: SniceReactComponent<LayoutCardProps, SniceComponentRef> = createReactAdapter<LayoutCardProps, false>({
  tagName: 'snice-layout-card',
  properties: ["columns","gap","hasFooter","hasHeader"],
  events: {},
  formAssociated: false
});
