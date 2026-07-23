import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the Textarea component
 */
export interface TextareaProps extends SniceFormProps {
    defaultValue?: any;
    size?: any;
    variant?: any;
    resize?: any;
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
    value?: any;
    onTextareaInput?: (event: any) => void;
    onTextareaChange?: (event: any) => void;
    onTextareaFocus?: (event: any) => void;
    onTextareaBlur?: (event: any) => void;
}
/**
 * Textarea - React adapter for snice-textarea
 *
 * This is an auto-generated React wrapper for the Snice textarea component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/textarea/snice-textarea';
 * import { Textarea } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Textarea />;
 * }
 * ```
 */
export declare const Textarea: SniceReactComponent<TextareaProps, SniceFormRef>;
//# sourceMappingURL=textarea.d.ts.map