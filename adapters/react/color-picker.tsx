import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the ColorPicker component
 */
export interface ColorPickerProps extends SniceBaseProps {
  size?: any;
  value?: any;
  format?: any;
  label?: any;
  helperText?: any;
  errorText?: any;
  disabled?: any;
  loading?: any;
  required?: any;
  invalid?: any;
  name?: any;
  showInput?: any;
  showPresets?: any;
  presets?: any;

}

/**
 * ColorPicker - React adapter for snice-color-picker
 *
 * This is an auto-generated React wrapper for the Snice color-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/color-picker';
 * import { ColorPicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ColorPicker />;
 * }
 * ```
 */
export const ColorPicker = createReactAdapter<ColorPickerProps>({
  tagName: 'snice-color-picker',
  properties: ["size","value","format","label","helperText","errorText","disabled","loading","required","invalid","name","showInput","showPresets","presets"],
  events: {},
  formAssociated: false
});
