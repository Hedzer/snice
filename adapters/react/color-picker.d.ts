import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the ColorPicker component
 */
export interface ColorPickerProps extends SniceFormProps {
    defaultValue?: any;
    size?: any;
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
    value?: any;
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
 * import 'snice/components/color-picker/snice-color-picker';
 * import { ColorPicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ColorPicker />;
 * }
 * ```
 */
export declare const ColorPicker: SniceReactComponent<ColorPickerProps, SniceFormRef>;
//# sourceMappingURL=color-picker.d.ts.map