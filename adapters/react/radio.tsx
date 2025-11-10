import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Radio component
 */
export interface RadioProps extends SniceBaseProps {
  checked?: any;
  disabled?: any;
  loading?: any;
  required?: any;
  invalid?: any;
  size?: any;
  name?: any;
  value?: any;
  label?: any;

}

/**
 * Radio - React adapter for snice-radio
 *
 * This is an auto-generated React wrapper for the Snice radio component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/radio';
 * import { Radio } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Radio />;
 * }
 * ```
 */
export const Radio = createReactAdapter<RadioProps>({
  tagName: 'snice-radio',
  properties: ["checked","disabled","loading","required","invalid","size","name","value","label"],
  events: {},
  formAssociated: false
});
