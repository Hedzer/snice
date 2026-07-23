// GENERATED FILE — DO NOT EDIT.
// Source: components/select/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Option component
 */
export interface OptionProps extends SniceBaseProps {
  value?: any;
  label?: any;
  disabled?: any;
  selected?: any;
  icon?: any;

}

/**
 * Option - React adapter for snice-option
 *
 * This is an auto-generated React wrapper for the Snice option component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/select/snice-option';
 * import { Option } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Option />;
 * }
 * ```
 */
export const Option: SniceReactComponent<OptionProps, SniceComponentRef> = createReactAdapter<OptionProps, false>({
  tagName: 'snice-option',
  properties: ["value","label","disabled","selected","icon"],
  events: {},
  formAssociated: false
});
