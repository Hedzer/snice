// GENERATED FILE — DO NOT EDIT.
// Source: components/spinner/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Spinner component
 */
export interface SpinnerProps extends SniceBaseProps {
  size?: any;
  color?: any;
  label?: any;
  thickness?: any;
  variant?: any;

}

/**
 * Spinner - React adapter for snice-spinner
 *
 * This is an auto-generated React wrapper for the Snice spinner component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spinner/snice-spinner';
 * import { Spinner } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spinner />;
 * }
 * ```
 */
export const Spinner: SniceReactComponent<SpinnerProps, SniceComponentRef> = createReactAdapter<SpinnerProps, false>({
  tagName: 'snice-spinner',
  properties: ["size","color","label","thickness","variant"],
  events: {},
  formAssociated: false
});
