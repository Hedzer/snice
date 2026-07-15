// GENERATED FILE — DO NOT EDIT.
// Source: components/color-picker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceFormProps } from './types';

/**
 * Props for the ColorPicker component
 */
export interface ColorPickerProps extends SniceFormProps {
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
  onColorPickerInput?: (event: any) => void;
  onColorPickerChange?: (event: any) => void;
  onColorPickerFocus?: (event: any) => void;
  onColorPickerBlur?: (event: any) => void;
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
  events: {"color-picker-input":"onColorPickerInput","color-picker-change":"onColorPickerChange","color-picker-focus":"onColorPickerFocus","color-picker-blur":"onColorPickerBlur"},
  formAssociated: true
});
