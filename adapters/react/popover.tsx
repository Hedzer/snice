// GENERATED FILE — DO NOT EDIT.
// Source: components/popover/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Popover component
 */
export interface PopoverProps extends SniceBaseProps {
  open?: any;
  placement?: any;
  distance?: any;
  noOutsideDismiss?: any;
  noEscapeDismiss?: any;
  onPopoverOpen?: (event: any) => void;
  onPopoverClose?: (event: any) => void;
}

/**
 * Popover - React adapter for snice-popover
 *
 * This is an auto-generated React wrapper for the Snice popover component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/popover/snice-popover';
 * import { Popover } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Popover />;
 * }
 * ```
 */
export const Popover: SniceReactComponent<PopoverProps, SniceComponentRef> = createReactAdapter<PopoverProps, false>({
  tagName: 'snice-popover',
  properties: ["open","placement","distance","noOutsideDismiss","noEscapeDismiss"],
  events: {"popover-open":"onPopoverOpen","popover-close":"onPopoverClose"},
  formAssociated: false
});
