// GENERATED FILE — DO NOT EDIT.
// Source: components/chip/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Chip component
 */
export interface ChipProps extends SniceBaseProps {
  label?: any;
  variant?: any;
  size?: any;
  shape?: any;
  removable?: any;
  selectable?: any;
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
 * import 'snice/components/chip/snice-chip';
 * import { Chip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chip />;
 * }
 * ```
 */
export const Chip: SniceReactComponent<ChipProps, SniceComponentRef> = createReactAdapter<ChipProps, false>({
  tagName: 'snice-chip',
  properties: ["label","variant","size","shape","removable","selectable","selected","disabled","icon","avatar"],
  events: {"chip-click":"onChipClick","chip-remove":"onChipRemove"},
  formAssociated: false
});
