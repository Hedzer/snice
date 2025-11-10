import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Input component
 */
export interface InputProps extends SniceBaseProps {
  type?: any;
  size?: any;
  variant?: any;
  value?: any;
  placeholder?: any;
  label?: any;
  helperText?: any;
  errorText?: any;
  disabled?: any;
  readonly?: any;
  loading?: any;
  required?: any;
  invalid?: any;
  clearable?: any;
  password?: any;
  min?: any;
  max?: any;
  step?: any;
  pattern?: any;
  maxlength?: any;
  minlength?: any;
  autocomplete?: any;
  name?: any;
  prefixIcon?: any;
  suffixIcon?: any;

}

/**
 * Input - React adapter for snice-input
 *
 * This is an auto-generated React wrapper for the Snice input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/input';
 * import { Input } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Input />;
 * }
 * ```
 */
export const Input = createReactAdapter<InputProps>({
  tagName: 'snice-input',
  properties: ["type","size","variant","value","placeholder","label","helperText","errorText","disabled","readonly","loading","required","invalid","clearable","password","min","max","step","pattern","maxlength","minlength","autocomplete","name","prefixIcon","suffixIcon"],
  events: {},
  formAssociated: false
});
