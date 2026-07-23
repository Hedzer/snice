import { type SniceReactComponent } from './wrapper';
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
export declare const Popover: SniceReactComponent<PopoverProps, SniceComponentRef>;
//# sourceMappingURL=popover.d.ts.map