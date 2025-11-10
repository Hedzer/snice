import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Badge component
 */
export interface BadgeProps extends SniceBaseProps {
  content?: any;
  count?: any;
  max?: any;
  dot?: any;
  variant?: any;
  position?: any;
  inline?: any;
  size?: any;
  pulse?: any;
  offset?: any;

}

/**
 * Badge - React adapter for snice-badge
 *
 * This is an auto-generated React wrapper for the Snice badge component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/badge';
 * import { Badge } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Badge />;
 * }
 * ```
 */
export const Badge = createReactAdapter<BadgeProps>({
  tagName: 'snice-badge',
  properties: ["content","count","max","dot","variant","position","inline","size","pulse","offset"],
  events: {},
  formAssociated: false
});
