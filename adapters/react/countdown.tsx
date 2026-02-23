import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Countdown component
 */
export interface CountdownProps extends SniceBaseProps {
  target?: any;
  format?: any;
  variant?: any;
  days?: any;
  hours?: any;
  minutes?: any;
  seconds?: any;

}

/**
 * Countdown - React adapter for snice-countdown
 *
 * This is an auto-generated React wrapper for the Snice countdown component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/countdown';
 * import { Countdown } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Countdown />;
 * }
 * ```
 */
export const Countdown = createReactAdapter<CountdownProps>({
  tagName: 'snice-countdown',
  properties: ["target","format","variant","days","hours","minutes","seconds"],
  events: {},
  formAssociated: false
});
