import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Switch component
 */
export interface SwitchProps extends SniceBaseProps {
  checked?: any;
  disabled?: any;
  loading?: any;
  required?: any;
  invalid?: any;
  size?: any;
  name?: any;
  value?: any;
  label?: any;
  labelOn?: any;
  labelOff?: any;

}

/**
 * Switch - React adapter for snice-switch
 *
 * This is an auto-generated React wrapper for the Snice switch component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/switch';
 * import { Switch } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Switch />;
 * }
 * ```
 */
export const Switch = createReactAdapter<SwitchProps>({
  tagName: 'snice-switch',
  properties: ["checked","disabled","loading","required","invalid","size","name","value","label","labelOn","labelOff"],
  events: {},
  formAssociated: false
});
