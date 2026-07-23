import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Tooltip component
 */
export interface TooltipProps extends SniceBaseProps {
    content?: any;
    position?: any;
    trigger?: any;
    delay?: any;
    hideDelay?: any;
    offset?: any;
    arrow?: any;
    open?: any;
    maxWidth?: any;
    zIndex?: any;
    strictPositioning?: any;
}
/**
 * Tooltip - React adapter for snice-tooltip
 *
 * This is an auto-generated React wrapper for the Snice tooltip component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tooltip/snice-tooltip';
 * import { Tooltip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tooltip />;
 * }
 * ```
 */
export declare const Tooltip: SniceReactComponent<TooltipProps, SniceComponentRef>;
//# sourceMappingURL=tooltip.d.ts.map