import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the ProgressRing component
 */
export interface ProgressRingProps extends SniceBaseProps {
  value?: any;
  max?: any;
  size?: any;
  thickness?: any;
  color?: any;
  showValue?: any;
  label?: any;

}

/**
 * ProgressRing - React adapter for snice-progress-ring
 *
 * This is an auto-generated React wrapper for the Snice progress-ring component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/progress-ring';
 * import { ProgressRing } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ProgressRing />;
 * }
 * ```
 */
export const ProgressRing = createReactAdapter<ProgressRingProps>({
  tagName: 'snice-progress-ring',
  properties: ["value","max","size","thickness","color","showValue","label"],
  events: {},
  formAssociated: false
});
