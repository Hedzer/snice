import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Candlestick component
 */
export interface CandlestickProps extends SniceBaseProps {
  data?: any;
  showVolume?: any;
  showGrid?: any;
  showCrosshair?: any;
  bullishColor?: any;
  bearishColor?: any;
  timeFormat?: any;
  yAxisFormat?: any;
  zoomEnabled?: any;
  animation?: any;
  renderTick?: any;

}

/**
 * Candlestick - React adapter for snice-candlestick
 *
 * This is an auto-generated React wrapper for the Snice candlestick component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/candlestick';
 * import { Candlestick } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Candlestick />;
 * }
 * ```
 */
export const Candlestick = createReactAdapter<CandlestickProps>({
  tagName: 'snice-candlestick',
  properties: ["data","showVolume","showGrid","showCrosshair","bullishColor","bearishColor","timeFormat","yAxisFormat","zoomEnabled","animation","renderTick"],
  events: {},
  formAssociated: false
});
