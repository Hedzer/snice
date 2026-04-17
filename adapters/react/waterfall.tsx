// GENERATED FILE — DO NOT EDIT.
// Source: components/waterfall/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Waterfall component
 */
export interface WaterfallProps extends SniceBaseProps {
  data?: any;
  orientation?: any;
  showValues?: any;
  showConnectors?: any;
  animated?: any;
  onBarClick?: (event: any) => void;
  onBarHover?: (event: any) => void;
}

/**
 * Waterfall - React adapter for snice-waterfall
 *
 * This is an auto-generated React wrapper for the Snice waterfall component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/waterfall';
 * import { Waterfall } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Waterfall />;
 * }
 * ```
 */
export const Waterfall = createReactAdapter<WaterfallProps>({
  tagName: 'snice-waterfall',
  properties: ["data","orientation","showValues","showConnectors","animated"],
  events: {"bar-click":"onBarClick","bar-hover":"onBarHover"},
  formAssociated: false
});
