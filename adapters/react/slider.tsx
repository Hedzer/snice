// GENERATED FILE — DO NOT EDIT.
// Source: components/slider/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';


/**
 * Props for the Slider component
 */
export interface SliderProps extends SniceFormProps {
  defaultValue?: any;
  size?: any;
  variant?: any;
  min?: any;
  max?: any;
  step?: any;
  label?: any;
  helperText?: any;
  errorText?: any;
  disabled?: any;
  readonly?: any;
  loading?: any;
  required?: any;
  invalid?: any;
  name?: any;
  showValue?: any;
  showTicks?: any;
  vertical?: any;
  value?: any;
  onSliderInput?: (event: any) => void;
  onSliderChange?: (event: any) => void;
}

/**
 * Slider - React adapter for snice-slider
 *
 * This is an auto-generated React wrapper for the Snice slider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/slider/snice-slider';
 * import { Slider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Slider />;
 * }
 * ```
 */
export const Slider: SniceReactComponent<SliderProps, SniceFormRef> = createReactAdapter<SliderProps, true>({
  tagName: 'snice-slider',
  properties: ["defaultValue","size","variant","min","max","step","label","helperText","errorText","disabled","readonly","loading","required","invalid","name","showValue","showTicks","vertical","value"],
  events: {"slider-input":"onSliderInput","slider-change":"onSliderChange"},
  formAssociated: true
});
