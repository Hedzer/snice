import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Timer component
 */
export interface TimerProps extends SniceBaseProps {
  mode?: any;
  initialTime?: any;
  running?: any;
  private?: any;

}

/**
 * Timer - React adapter for snice-timer
 *
 * This is an auto-generated React wrapper for the Snice timer component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/timer';
 * import { Timer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Timer />;
 * }
 * ```
 */
export const Timer = createReactAdapter<TimerProps>({
  tagName: 'snice-timer',
  properties: ["mode","initialTime","running","private"],
  events: {},
  formAssociated: false
});
