import type { SniceFormProps } from './types';
/**
 * Props for the Select component
 */
export interface SelectProps extends SniceFormProps {
    disabled?: any;
    required?: any;
    invalid?: any;
    readonly?: any;
    loading?: any;
    multiple?: any;
    searchable?: any;
    clearable?: any;
    allowFreeText?: any;
    editable?: any;
    remote?: any;
    searchDebounce?: any;
    open?: any;
    size?: any;
    name?: any;
    value?: any;
    label?: any;
    helperText?: any;
    errorText?: any;
    placeholder?: any;
    maxHeight?: any;
    options?: any;
    onSelectChange?: (event: any) => void;
    onSelectOpen?: (event: any) => void;
    onSelectClose?: (event: any) => void;
}
/**
 * Select - React adapter for snice-select
 *
 * This is an auto-generated React wrapper for the Snice select component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/select';
 * import { Select } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Select />;
 * }
 * ```
 */
export declare const Select: import("react").ForwardRefExoticComponent<Omit<SelectProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=select.d.ts.map