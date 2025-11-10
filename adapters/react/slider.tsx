import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Slider component
 */
export interface SliderProps extends SniceBaseProps {
  size?: any;
  variant?: any;
  value?: any;
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

}

/**
 * Slider - React adapter for snice-slider
 *
 * This is an auto-generated React wrapper for the Snice slider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/slider';
 * import { Slider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Slider />;
 * }
 * ```
 */
export const Slider = createReactAdapter<SliderProps>({
  tagName: 'snice-slider',
  properties: ["size","variant","value","min","max","step","label","helperText","errorText","disabled","readonly","loading","required","invalid","name","showValue","showTicks","vertical"],
  events: {},
  formAssociated: false
});
