import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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
 * import 'snice/components/stepper';
 * import { Stepper } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Stepper />;
 * }
 * ```
 */
export const Stepper = createReactAdapter<StepperProps>({
  tagName: 'snice-stepper',
  properties: ["steps","currentStep","orientation","clickable"],
  events: {},
  formAssociated: false
});
