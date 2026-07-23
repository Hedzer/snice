import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Stepper component
 */
export interface StepperProps extends SniceBaseProps {
    steps?: any;
    currentStep?: any;
    orientation?: any;
    clickable?: any;
}
/**
 * Stepper - React adapter for snice-stepper
 *
 * This is an auto-generated React wrapper for the Snice stepper component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/stepper/snice-stepper';
 * import { Stepper } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Stepper />;
 * }
 * ```
 */
export declare const Stepper: SniceReactComponent<StepperProps, SniceComponentRef>;
//# sourceMappingURL=stepper.d.ts.map