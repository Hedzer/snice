// GENERATED FILE — DO NOT EDIT.
// Source: components/badge/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
  label?: any;
  showZero?: any;
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
 * import 'snice/components/badge/snice-badge';
 * import { Badge } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Badge />;
 * }
 * ```
 */
export const Badge: SniceReactComponent<BadgeProps, SniceComponentRef> = createReactAdapter<BadgeProps, false>({
  tagName: 'snice-badge',
  properties: ["content","count","max","dot","variant","position","inline","size","pulse","label","showZero","offset"],
  events: {},
  formAssociated: false
});
