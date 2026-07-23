import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the StepInput component
 */
export interface StepInputProps extends SniceFormProps {
    defaultValue?: any;
    min?: any;
    max?: any;
    step?: any;
    disabled?: any;
    readonly?: any;
    size?: any;
    wrap?: any;
    name?: any;
    value?: any;
    onValueChange?: (event: any) => void;
}
/**
 * StepInput - React adapter for snice-step-input
 *
 * This is an auto-generated React wrapper for the Snice step-input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/step-input/snice-step-input';
 * import { StepInput } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StepInput />;
 * }
 * ```
 */
export declare const StepInput: SniceReactComponent<StepInputProps, SniceFormRef>;
//# sourceMappingURL=step-input.d.ts.map