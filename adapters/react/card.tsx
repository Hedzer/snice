// GENERATED FILE — DO NOT EDIT.
// Source: components/card/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
  onCardClick?: (event: any) => void;
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
  properties: ["variant","size","clickable","selected","disabled"],
  events: {"card-click":"onCardClick"},
  formAssociated: false
});
