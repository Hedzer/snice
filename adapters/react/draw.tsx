import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Draw component
 */
export interface DrawProps extends SniceBaseProps {
  width?: any;
  height?: any;
  tool?: any;
  color?: any;
  strokeWidth?: any;
  backgroundColor?: any;
  lazy?: any;
  lazyRadius?: any;
  friction?: any;
  smoothing?: any;
  autoPolygon?: any;
  polygonCurvePoints?: any;
  autoCircle?: any;
  circlePoints?: any;
  disabled?: any;

}

/**
 * Draw - React adapter for snice-draw
 *
 * This is an auto-generated React wrapper for the Snice draw component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/draw';
 * import { Draw } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Draw />;
 * }
 * ```
 */
export const Draw = createReactAdapter<DrawProps>({
  tagName: 'snice-draw',
  properties: ["width","height","tool","color","strokeWidth","backgroundColor","lazy","lazyRadius","friction","smoothing","autoPolygon","polygonCurvePoints","autoCircle","circlePoints","disabled"],
  events: {},
  formAssociated: false
});
