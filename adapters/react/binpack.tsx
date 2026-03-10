import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Binpack component
 */
export interface BinpackProps extends SniceBaseProps {
  gap?: any;
  columnWidth?: any;
  rowHeight?: any;
  horizontal?: any;
  originLeft?: any;
  originTop?: any;
  transitionDuration?: any;
  stagger?: any;
  resize?: any;

}

/**
 * Binpack - React adapter for snice-binpack
 *
 * This is an auto-generated React wrapper for the Snice binpack component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/binpack';
 * import { Binpack } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Binpack />;
 * }
 * ```
 */
export const Binpack = createReactAdapter<BinpackProps>({
  tagName: 'snice-binpack',
  properties: ["gap","columnWidth","rowHeight","horizontal","originLeft","originTop","transitionDuration","stagger","resize"],
  events: {},
  formAssociated: false
});
