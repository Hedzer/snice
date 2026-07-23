import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
 * import 'snice/components/color-display/snice-color-display';
 * import { ColorDisplay } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ColorDisplay />;
 * }
 * ```
 */
export declare const ColorDisplay: SniceReactComponent<ColorDisplayProps, SniceComponentRef>;
//# sourceMappingURL=color-display.d.ts.map