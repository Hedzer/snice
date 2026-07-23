// GENERATED FILE — DO NOT EDIT.
// Source: components/flip-card/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the FlipCard component
 */
export interface FlipCardProps extends SniceBaseProps {
  flipped?: any;
  clickToFlip?: any;
  direction?: any;
  duration?: any;
  onFlipChange?: (event: any) => void;
}

/**
 * FlipCard - React adapter for snice-flip-card
 *
 * This is an auto-generated React wrapper for the Snice flip-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/flip-card/snice-flip-card';
 * import { FlipCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FlipCard />;
 * }
 * ```
 */
export const FlipCard: SniceReactComponent<FlipCardProps, SniceComponentRef> = createReactAdapter<FlipCardProps, false>({
  tagName: 'snice-flip-card',
  properties: ["flipped","clickToFlip","direction","duration"],
  events: {"flip-change":"onFlipChange"},
  formAssociated: false
});
