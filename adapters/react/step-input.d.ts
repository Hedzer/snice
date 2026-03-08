import type { SniceBaseProps } from './types';
/**
 * Props for the StepInput component
 */
export interface StepInputProps extends SniceBaseProps {
    value?: any;
    min?: any;
    max?: any;
    step?: any;
    disabled?: any;
    readonly?: any;
    size?: any;
    wrap?: any;
}
/**
 * StepInput - React adapter for snice-step-input
 *
 * This is an auto-generated React wrapper for the Snice step-input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/step-input';
 * import { StepInput } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StepInput />;
 * }
 * ```
 */
export declare const StepInput: import("react").ForwardRefExoticComponent<Omit<StepInputProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=step-input.d.ts.map