import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
 * import 'snice/components/sparkline';
 * import { Sparkline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Sparkline />;
 * }
 * ```
 */
export const Sparkline = createReactAdapter<SparklineProps>({
  tagName: 'snice-sparkline',
  properties: ["data","type","color","customColor","width","height","strokeWidth","showDots","showArea","smooth","min","max"],
  events: {},
  formAssociated: false
});
