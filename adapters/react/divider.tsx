import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Divider component
 */
export interface DividerProps extends SniceBaseProps {
  orientation?: any;
  variant?: any;
  spacing?: any;
  align?: any;
  text?: any;
  textBackground?: any;
  color?: any;
  capped?: any;

}

/**
 * Divider - React adapter for snice-divider
 *
 * This is an auto-generated React wrapper for the Snice divider component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/divider';
 * import { Divider } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Divider />;
 * }
 * ```
 */
export const Divider = createReactAdapter<DividerProps>({
  tagName: 'snice-divider',
  properties: ["orientation","variant","spacing","align","text","textBackground","color","capped"],
  events: {},
  formAssociated: false
});
