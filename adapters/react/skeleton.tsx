// GENERATED FILE — DO NOT EDIT.
// Source: components/skeleton/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Skeleton component
 */
export interface SkeletonProps extends SniceBaseProps {
  variant?: any;
  width?: any;
  height?: any;
  animation?: any;
  count?: any;
  spacing?: any;

}

/**
 * Skeleton - React adapter for snice-skeleton
 *
 * This is an auto-generated React wrapper for the Snice skeleton component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/skeleton/snice-skeleton';
 * import { Skeleton } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Skeleton />;
 * }
 * ```
 */
export const Skeleton: SniceReactComponent<SkeletonProps, SniceComponentRef> = createReactAdapter<SkeletonProps, false>({
  tagName: 'snice-skeleton',
  properties: ["variant","width","height","animation","count","spacing"],
  events: {},
  formAssociated: false
});
