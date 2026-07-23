import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the StepperPanel component
 */
export interface StepperPanelProps extends SniceBaseProps {
    index?: any;
    active?: any;
}
/**
 * StepperPanel - React adapter for snice-stepper-panel
 *
 * This is an auto-generated React wrapper for the Snice stepper-panel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/stepper/snice-stepper-panel';
 * import { StepperPanel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StepperPanel />;
 * }
 * ```
 */
export declare const StepperPanel: SniceReactComponent<StepperPanelProps, SniceComponentRef>;
//# sourceMappingURL=stepper-panel.d.ts.map