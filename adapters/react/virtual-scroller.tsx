// GENERATED FILE — DO NOT EDIT.
// Source: components/virtual-scroller/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the VirtualScroller component
 */
export interface VirtualScrollerProps extends SniceBaseProps {
  items?: any;
  itemHeight?: any;
  bufferSize?: any;
  estimatedItemHeight?: any;
  renderItem?: any;

}

/**
 * VirtualScroller - React adapter for snice-virtual-scroller
 *
 * This is an auto-generated React wrapper for the Snice virtual-scroller component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/virtual-scroller/snice-virtual-scroller';
 * import { VirtualScroller } from 'snice/react';
 *
 * function MyComponent() {
 *   return <VirtualScroller />;
 * }
 * ```
 */
export const VirtualScroller: SniceReactComponent<VirtualScrollerProps, SniceComponentRef> = createReactAdapter<VirtualScrollerProps, false>({
  tagName: 'snice-virtual-scroller',
  properties: ["items","itemHeight","bufferSize","estimatedItemHeight","renderItem"],
  events: {},
  formAssociated: false
});
