import type { SniceBaseProps } from './types';
/**
 * Props for the FormBuilder component
 */
export interface FormBuilderProps extends SniceBaseProps {
    schema?: any;
    mode?: any;
    fieldTypes?: any;
}
/**
 * FormBuilder - React adapter for snice-form-builder
 *
 * This is an auto-generated React wrapper for the Snice form-builder component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/form-builder';
 * import { FormBuilder } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FormBuilder />;
 * }
 * ```
 */
export declare const FormBuilder: import("react").ForwardRefExoticComponent<Omit<FormBuilderProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=form-builder.d.ts.map