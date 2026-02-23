import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Rating component
 */
export interface RatingProps extends SniceBaseProps {
  value?: any;
  max?: any;
  icon?: any;
  size?: any;
  readonly?: any;
  precision?: any;

}

/**
 * Rating - React adapter for snice-rating
 *
 * This is an auto-generated React wrapper for the Snice rating component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/rating';
 * import { Rating } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Rating />;
 * }
 * ```
 */
export const Rating = createReactAdapter<RatingProps>({
  tagName: 'snice-rating',
  properties: ["value","max","icon","size","readonly","precision"],
  events: {},
  formAssociated: false
});
