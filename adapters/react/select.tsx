// GENERATED FILE — DO NOT EDIT.
// Source: components/select/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceFormProps } from './types';

/**
 * Props for the Select component
 */
export interface SelectProps extends SniceFormProps {
  defaultValue?: any;
  disabled?: any;
  required?: any;
  invalid?: any;
  readonly?: any;
  loading?: any;
  multiple?: any;
  searchable?: any;
  clearable?: any;
  allowFreeText?: any;
  editable?: any;
  remote?: any;
  searchDebounce?: any;
  open?: any;
  size?: any;
  name?: any;
  label?: any;
  helperText?: any;
  errorText?: any;
  placeholder?: any;
  maxHeight?: any;
  options?: any;
  value?: any;
  onSelectChange?: (event: any) => void;
  onSelectOpen?: (event: any) => void;
  onSelectClose?: (event: any) => void;
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
  properties: ["defaultValue","disabled","required","invalid","readonly","loading","multiple","searchable","clearable","allowFreeText","editable","remote","searchDebounce","open","size","name","label","helperText","errorText","placeholder","maxHeight","options","value"],
  events: {"select-change":"onSelectChange","select-open":"onSelectOpen","select-close":"onSelectClose"},
  formAssociated: true
});
