import type { SniceBaseProps } from './types';
/**
 * Props for the Input component
 */
export interface InputProps extends SniceBaseProps {
    type?: any;
    size?: any;
    variant?: any;
    value?: any;
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
}
/**
 * Input - React adapter for snice-input
 *
 * This is an auto-generated React wrapper for the Snice input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/input';
 * import { Input } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Input />;
 * }
 * ```
 */
export declare const Input: import("react").ForwardRefExoticComponent<Omit<InputProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=input.d.ts.map