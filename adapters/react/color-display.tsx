import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the ColorDisplay component
 */
export interface ColorDisplayProps extends SniceBaseProps {
  value?: any;
  format?: any;
  showSwatch?: any;
  showLabel?: any;
  swatchSize?: any;
  label?: any;

}

/**
 * ColorDisplay - React adapter for snice-color-display
 *
 * This is an auto-generated React wrapper for the Snice color-display component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/color-display';
 * import { ColorDisplay } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ColorDisplay />;
 * }
 * ```
 */
export const ColorDisplay = createReactAdapter<ColorDisplayProps>({
  tagName: 'snice-color-display',
  properties: ["value","format","showSwatch","showLabel","swatchSize","label"],
  events: {},
  formAssociated: false
});
