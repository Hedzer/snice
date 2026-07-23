// GENERATED FILE — DO NOT EDIT.
// Source: components/range-slider/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';


/**
 * Props for the RangeSlider component
 */
export interface RangeSliderProps extends SniceFormProps {
  defaultValueLow?: any;
  defaultValueHigh?: any;
  min?: any;
  max?: any;
  step?: any;
  disabled?: any;
  showTooltip?: any;
  showLabels?: any;
  orientation?: any;
  name?: any;
  valueLow?: any;
  valueHigh?: any;
  onRangeChange?: (event: any) => void;
}

/**
 * RangeSlider - React adapter for snice-range-slider
 *
 * This is an auto-generated React wrapper for the Snice range-slider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/range-slider/snice-range-slider';
 * import { RangeSlider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <RangeSlider />;
 * }
 * ```
 */
export const RangeSlider: SniceReactComponent<RangeSliderProps, SniceFormRef> = createReactAdapter<RangeSliderProps, true>({
  tagName: 'snice-range-slider',
  properties: ["defaultValueLow","defaultValueHigh","min","max","step","disabled","showTooltip","showLabels","orientation","name","valueLow","valueHigh"],
  events: {"range-change":"onRangeChange"},
  formAssociated: true
});
