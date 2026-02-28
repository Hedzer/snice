import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the SplitButton component
 */
export interface SplitButtonProps extends SniceBaseProps {
  label?: any;
  actions?: any;
  variant?: any;
  size?: any;
  disabled?: any;

}

/**
 * SplitButton - React adapter for snice-split-button
 *
 * This is an auto-generated React wrapper for the Snice split-button component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/split-button';
 * import { SplitButton } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SplitButton />;
 * }
 * ```
 */
export const SplitButton = createReactAdapter<SplitButtonProps>({
  tagName: 'snice-split-button',
  properties: ["label","actions","variant","size","disabled"],
  events: {},
  formAssociated: false
});
