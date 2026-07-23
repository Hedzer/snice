// GENERATED FILE — DO NOT EDIT.
// Source: components/countdown/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Countdown component
 */
export interface CountdownProps extends SniceBaseProps {
  target?: any;
  format?: any;
  variant?: any;
  onCountdownComplete?: (event: any) => void;
  onCountdownTick?: (event: any) => void;
}

/**
 * Countdown - React adapter for snice-countdown
 *
 * This is an auto-generated React wrapper for the Snice countdown component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/countdown/snice-countdown';
 * import { Countdown } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Countdown />;
 * }
 * ```
 */
export const Countdown: SniceReactComponent<CountdownProps, SniceComponentRef> = createReactAdapter<CountdownProps, false>({
  tagName: 'snice-countdown',
  properties: ["target","format","variant"],
  events: {"countdown-complete":"onCountdownComplete","countdown-tick":"onCountdownTick"},
  formAssociated: false
});
