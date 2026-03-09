import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the ActionBar component
 */
export interface ActionBarProps extends SniceBaseProps {
  open?: any;
  position?: any;
  size?: any;
  variant?: any;
  noAnimation?: any;
  noEscapeDismiss?: any;

}

/**
 * ActionBar - React adapter for snice-action-bar
 *
 * This is an auto-generated React wrapper for the Snice action-bar component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/action-bar';
 * import { ActionBar } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ActionBar />;
 * }
 * ```
 */
export const ActionBar = createReactAdapter<ActionBarProps>({
  tagName: 'snice-action-bar',
  properties: ["open","position","size","variant","noAnimation","noEscapeDismiss"],
  events: {},
  formAssociated: false
});
