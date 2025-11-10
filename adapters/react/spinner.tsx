import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Spinner component
 */
export interface SpinnerProps extends SniceBaseProps {
  size?: any;
  color?: any;
  label?: any;
  thickness?: any;

}

/**
 * Spinner - React adapter for snice-spinner
 *
 * This is an auto-generated React wrapper for the Snice spinner component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spinner';
 * import { Spinner } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spinner />;
 * }
 * ```
 */
export const Spinner = createReactAdapter<SpinnerProps>({
  tagName: 'snice-spinner',
  properties: ["size","color","label","thickness"],
  events: {},
  formAssociated: false
});
