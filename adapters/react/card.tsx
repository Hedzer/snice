// GENERATED FILE — DO NOT EDIT.
// Source: components/card/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
 * import 'snice/components/card/snice-card';
 * import { Card } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Card />;
 * }
 * ```
 */
export const Card: SniceReactComponent<CardProps, SniceComponentRef> = createReactAdapter<CardProps, false>({
  tagName: 'snice-card',
  properties: ["variant","size","clickable","selected","disabled"],
  events: {"card-click":"onCardClick"},
  formAssociated: false
});
