// GENERATED FILE — DO NOT EDIT.
// Source: components/checkbox/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceFormProps } from './types';

/**
 * Props for the Checkbox component
 */
export interface CheckboxProps extends SniceFormProps {
  defaultChecked?: any;
  indeterminate?: any;
  disabled?: any;
  loading?: any;
  required?: any;
  invalid?: any;
  size?: any;
  name?: any;
  value?: any;
  label?: any;
  checked?: any;
  onCheckboxChange?: (event: any) => void;
}

/**
 * Checkbox - React adapter for snice-checkbox
 *
 * This is an auto-generated React wrapper for the Snice checkbox component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/checkbox';
 * import { Checkbox } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Checkbox />;
 * }
 * ```
 */
export const Checkbox = createReactAdapter<CheckboxProps>({
  tagName: 'snice-checkbox',
  properties: ["defaultChecked","indeterminate","disabled","loading","required","invalid","size","name","value","label","checked"],
  events: {"checkbox-change":"onCheckboxChange"},
  formAssociated: true
});
