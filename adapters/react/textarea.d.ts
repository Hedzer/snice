import type { SniceBaseProps } from './types';
/**
 * Props for the Textarea component
 */
export interface TextareaProps extends SniceBaseProps {
    size?: any;
    variant?: any;
    resize?: any;
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
    rows?: any;
    cols?: any;
    maxlength?: any;
    minlength?: any;
    autocomplete?: any;
    name?: any;
    autoGrow?: any;
}
/**
 * Textarea - React adapter for snice-textarea
 *
 * This is an auto-generated React wrapper for the Snice textarea component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/textarea';
 * import { Textarea } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Textarea />;
 * }
 * ```
 */
export declare const Textarea: import("react").ForwardRefExoticComponent<Omit<TextareaProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=textarea.d.ts.map