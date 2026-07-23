// GENERATED FILE — DO NOT EDIT.
// Source: components/stepper/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
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
export const StepperPanel: SniceReactComponent<StepperPanelProps, SniceComponentRef> = createReactAdapter<StepperPanelProps, false>({
  tagName: 'snice-stepper-panel',
  properties: ["index","active"],
  events: {},
  formAssociated: false
});
