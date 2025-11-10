import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Chip component
 */
export interface ChipProps extends SniceBaseProps {
  label?: any;
  variant?: any;
  size?: any;
  removable?: any;
  selected?: any;
  disabled?: any;
  icon?: any;
  avatar?: any;
  onChipClick?: (event: any) => void;
  onChipRemove?: (event: any) => void;
}

/**
 * Chip - React adapter for snice-chip
 *
 * This is an auto-generated React wrapper for the Snice chip component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chip';
 * import { Chip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chip />;
 * }
 * ```
 */
export const Chip = createReactAdapter<ChipProps>({
  tagName: 'snice-chip',
  properties: ["label","variant","size","removable","selected","disabled","icon","avatar"],
  events: {"chip-click":"onChipClick","chip-remove":"onChipRemove"},
  formAssociated: false
});
