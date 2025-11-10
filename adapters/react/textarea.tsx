import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Textarea component
 */
export interface TextareaProps extends SniceBaseProps {
  size?: any;
  variant?: any;
  resize?: any;
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
  rows?: any;
  cols?: any;
  maxlength?: any;
  minlength?: any;
  autocomplete?: any;
  name?: any;
  autoGrow?: any;

}

/**
 * Textarea - React adapter for snice-textarea
 *
 * This is an auto-generated React wrapper for the Snice textarea component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/textarea';
 * import { Textarea } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Textarea />;
 * }
 * ```
 */
export const Textarea = createReactAdapter<TextareaProps>({
  tagName: 'snice-textarea',
  properties: ["size","variant","resize","value","placeholder","label","helperText","errorText","disabled","readonly","loading","required","invalid","rows","cols","maxlength","minlength","autocomplete","name","autoGrow"],
  events: {},
  formAssociated: false
});
