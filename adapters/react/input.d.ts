import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the Input component
 */
export interface InputProps extends SniceFormProps {
    defaultValue?: any;
    type?: any;
    size?: any;
    variant?: any;
    placeholder?: any;
    label?: any;
    helperText?: any;
    errorText?: any;
    disabled?: any;
    readonly?: any;
    loading?: any;
    required?: any;
    invalid?: any;
    clearable?: any;
    password?: any;
    min?: any;
    max?: any;
    step?: any;
    pattern?: any;
    maxlength?: any;
    minlength?: any;
    autocomplete?: any;
    name?: any;
    align?: any;
    labelAlign?: any;
    stretch?: any;
    prefixIcon?: any;
    suffixIcon?: any;
    value?: any;
    onInputInput?: (event: any) => void;
    onInputChange?: (event: any) => void;
    onInputFocus?: (event: any) => void;
    onInputBlur?: (event: any) => void;
    onInputClear?: (event: any) => void;
}
/**
 * Input - React adapter for snice-input
 *
 * This is an auto-generated React wrapper for the Snice input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/input/snice-input';
 * import { Input } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Input />;
 * }
 * ```
 */
export declare const Input: SniceReactComponent<InputProps, SniceFormRef>;
//# sourceMappingURL=input.d.ts.map