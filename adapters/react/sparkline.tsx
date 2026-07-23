// GENERATED FILE — DO NOT EDIT.
// Source: components/sparkline/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Sparkline component
 */
export interface SparklineProps extends SniceBaseProps {
  data?: any;
  type?: any;
  color?: any;
  customColor?: any;
  width?: any;
  height?: any;
  strokeWidth?: any;
  showDots?: any;
  showArea?: any;
  smooth?: any;
  min?: any;
  max?: any;

}

/**
 * Sparkline - React adapter for snice-sparkline
 *
 * This is an auto-generated React wrapper for the Snice sparkline component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/sparkline/snice-sparkline';
 * import { Sparkline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sparkline />;
 * }
 * ```
 */
export const Sparkline: SniceReactComponent<SparklineProps, SniceComponentRef> = createReactAdapter<SparklineProps, false>({
  tagName: 'snice-sparkline',
  properties: ["data","type","color","customColor","width","height","strokeWidth","showDots","showArea","smooth","min","max"],
  events: {},
  formAssociated: false
});
