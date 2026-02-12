import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Card component
 */
export interface CardProps extends SniceBaseProps {
  variant?: any;
  size?: any;
  clickable?: any;
  selected?: any;
  disabled?: any;
  hasHeader?: any;
  hasFooter?: any;

}

/**
 * Card - React adapter for snice-card
 *
 * This is an auto-generated React wrapper for the Snice card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/card';
 * import { Card } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Card />;
 * }
 * ```
 */
export const Card = createReactAdapter<CardProps>({
  tagName: 'snice-card',
  properties: ["variant","size","clickable","selected","disabled","hasHeader","hasFooter"],
  events: {},
  formAssociated: false
});
