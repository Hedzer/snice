// GENERATED FILE — DO NOT EDIT.
// Source: components/segmented-control/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the SegmentedControl component
 */
export interface SegmentedControlProps extends SniceBaseProps {
  value?: any;
  options?: any;
  size?: any;
  disabled?: any;
  onValueChange?: (event: any) => void;
}

/**
 * SegmentedControl - React adapter for snice-segmented-control
 *
 * This is an auto-generated React wrapper for the Snice segmented-control component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/segmented-control/snice-segmented-control';
 * import { SegmentedControl } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SegmentedControl />;
 * }
 * ```
 */
export const SegmentedControl: SniceReactComponent<SegmentedControlProps, SniceComponentRef> = createReactAdapter<SegmentedControlProps, false>({
  tagName: 'snice-segmented-control',
  properties: ["value","options","size","disabled"],
  events: {"value-change":"onValueChange"},
  formAssociated: false
});
