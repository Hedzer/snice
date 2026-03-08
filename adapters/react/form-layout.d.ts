import type { SniceBaseProps } from './types';
/**
 * Props for the FormLayout component
 */
export interface FormLayoutProps extends SniceBaseProps {
    columns?: any;
    labelPosition?: any;
    labelWidth?: any;
    gap?: any;
    variant?: any;
}
/**
 * FormLayout - React adapter for snice-form-layout
 *
 * This is an auto-generated React wrapper for the Snice form-layout component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/form-layout';
 * import { FormLayout } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FormLayout />;
 * }
 * ```
 */
export declare const FormLayout: import("react").ForwardRefExoticComponent<Omit<FormLayoutProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=form-layout.d.ts.map