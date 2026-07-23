import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Paint component
 */
export interface PaintProps extends SniceBaseProps {
    color?: any;
    strokeWidth?: any;
    minStrokeWidth?: any;
    maxStrokeWidth?: any;
    controls?: any;
    backgroundColor?: any;
    colorSelects?: any;
    disabled?: any;
    onColorSelect?: (event: any) => void;
    onPaintStart?: (event: any) => void;
    onPaintEnd?: (event: any) => void;
    onPaintClear?: (event: any) => void;
    onPaintUndo?: (event: any) => void;
    onPaintRedo?: (event: any) => void;
}
/**
 * Paint - React adapter for snice-paint
 *
 * This is an auto-generated React wrapper for the Snice paint component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/paint/snice-paint';
 * import { Paint } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Paint />;
 * }
 * ```
 */
export declare const Paint: SniceReactComponent<PaintProps, SniceComponentRef>;
//# sourceMappingURL=paint.d.ts.map