import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the Checkbox component
 */
export interface CheckboxProps extends SniceFormProps {
    defaultChecked?: any;
    indeterminate?: any;
    disabled?: any;
    loading?: any;
    required?: any;
    invalid?: any;
    size?: any;
    name?: any;
    value?: any;
    label?: any;
    checked?: any;
    onCheckboxChange?: (event: any) => void;
}
/**
 * Checkbox - React adapter for snice-checkbox
 *
 * This is an auto-generated React wrapper for the Snice checkbox component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/checkbox/snice-checkbox';
 * import { Checkbox } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Checkbox />;
 * }
 * ```
 */
export declare const Checkbox: SniceReactComponent<CheckboxProps, SniceFormRef>;
//# sourceMappingURL=checkbox.d.ts.map