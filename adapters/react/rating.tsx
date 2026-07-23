// GENERATED FILE — DO NOT EDIT.
// Source: components/rating/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Rating component
 */
export interface RatingProps extends SniceBaseProps {
  value?: any;
  max?: any;
  icon?: any;
  emptyIcon?: any;
  size?: any;
  readonly?: any;
  precision?: any;
  onRatingChange?: (event: any) => void;
}

/**
 * Rating - React adapter for snice-rating
 *
 * This is an auto-generated React wrapper for the Snice rating component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/rating/snice-rating';
 * import { Rating } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Rating />;
 * }
 * ```
 */
export const Rating: SniceReactComponent<RatingProps, SniceComponentRef> = createReactAdapter<RatingProps, false>({
  tagName: 'snice-rating',
  properties: ["value","max","icon","emptyIcon","size","readonly","precision"],
  events: {"rating-change":"onRatingChange"},
  formAssociated: false
});
