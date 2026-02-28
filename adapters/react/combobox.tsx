import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Combobox component
 */
export interface ComboboxProps extends SniceBaseProps {
  value?: any;
  options?: any;
  placeholder?: any;
  allowCustom?: any;
  filterable?: any;
  disabled?: any;
  readonly?: any;
  required?: any;
  variant?: any;
  size?: any;
  name?: any;
  label?: any;

}

/**
 * Combobox - React adapter for snice-combobox
 *
 * This is an auto-generated React wrapper for the Snice combobox component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/combobox';
 * import { Combobox } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Combobox />;
 * }
 * ```
 */
export const Combobox = createReactAdapter<ComboboxProps>({
  tagName: 'snice-combobox',
  properties: ["value","options","placeholder","allowCustom","filterable","disabled","readonly","required","variant","size","name","label"],
  events: {},
  formAssociated: false
});
