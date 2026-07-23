// GENERATED FILE — DO NOT EDIT.
// Source: components/masonry/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Masonry component
 */
export interface MasonryProps extends SniceBaseProps {
  columns?: any;
  gap?: any;
  minColumnWidth?: any;

}

/**
 * Masonry - React adapter for snice-masonry
 *
 * This is an auto-generated React wrapper for the Snice masonry component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/masonry/snice-masonry';
 * import { Masonry } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Masonry />;
 * }
 * ```
 */
export const Masonry: SniceReactComponent<MasonryProps, SniceComponentRef> = createReactAdapter<MasonryProps, false>({
  tagName: 'snice-masonry',
  properties: ["columns","gap","minColumnWidth"],
  events: {},
  formAssociated: false
});
