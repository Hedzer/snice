import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
 * import 'snice/components/virtual-scroller';
 * import { VirtualScroller } from 'snice/react';
 *
 * function MyComponent() {
 *   return <VirtualScroller />;
 * }
 * ```
 */
export const VirtualScroller = createReactAdapter<VirtualScrollerProps>({
  tagName: 'snice-virtual-scroller',
  properties: ["items","itemHeight","bufferSize","estimatedItemHeight","renderItem"],
  events: {},
  formAssociated: false
});
