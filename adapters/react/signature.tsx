import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Signature component
 */
export interface SignatureProps extends SniceBaseProps {
  strokeColor?: any;
  strokeWidth?: any;
  backgroundColor?: any;
  readonly?: any;

}

/**
 * Signature - React adapter for snice-signature
 *
 * This is an auto-generated React wrapper for the Snice signature component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/signature';
 * import { Signature } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Signature />;
 * }
 * ```
 */
export const Signature = createReactAdapter<SignatureProps>({
  tagName: 'snice-signature',
  properties: ["strokeColor","strokeWidth","backgroundColor","readonly"],
  events: {},
  formAssociated: false
});
