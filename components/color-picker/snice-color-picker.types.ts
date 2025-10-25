export type ColorPickerSize = 'small' | 'medium' | 'large';
export type ColorPickerFormat = 'hex' | 'rgb' | 'hsl';

export interface SniceColorPickerElement extends HTMLElement {
  size: ColorPickerSize;
  value: string;
  format: ColorPickerFormat;
  label: string;
  helperText: string;
  errorText: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  name: string;
  showInput: boolean;
  showPresets: boolean;
  presets: string[];

  focus(): void;
  blur(): void;
}
