import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Select component
 */
export interface SelectProps extends SniceBaseProps {
  disabled?: any;
  required?: any;
  invalid?: any;
  readonly?: any;
  loading?: any;
  multiple?: any;
  searchable?: any;
  clearable?: any;
  allowFreeText?: any;
  open?: any;
  size?: any;
  name?: any;
  value?: any;
  label?: any;
  placeholder?: any;
  maxHeight?: any;

}

/**
 * Select - React adapter for snice-select
 *
 * This is an auto-generated React wrapper for the Snice select component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/select';
 * import { Select } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Select />;
 * }
 * ```
 */
export const Select = createReactAdapter<SelectProps>({
  tagName: 'snice-select',
  properties: ["disabled","required","invalid","readonly","loading","multiple","searchable","clearable","allowFreeText","open","size","name","value","label","placeholder","maxHeight"],
  events: {},
  formAssociated: false
});
