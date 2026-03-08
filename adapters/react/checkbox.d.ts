import type { SniceBaseProps } from './types';
/**
 * Props for the Checkbox component
 */
export interface CheckboxProps extends SniceBaseProps {
    checked?: any;
    indeterminate?: any;
    disabled?: any;
    loading?: any;
    required?: any;
    invalid?: any;
    size?: any;
    name?: any;
    value?: any;
    label?: any;
}
/**
 * Checkbox - React adapter for snice-checkbox
 *
 * This is an auto-generated React wrapper for the Snice checkbox component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/checkbox';
 * import { Checkbox } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Checkbox />;
 * }
 * ```
 */
export declare const Checkbox: import("react").ForwardRefExoticComponent<Omit<CheckboxProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=checkbox.d.ts.map