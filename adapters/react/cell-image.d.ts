import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellImage component
 */
export interface CellImageProps extends SniceBaseProps {
    value?: any;
    src?: any;
    alt?: any;
    fallback?: any;
    variant?: any;
    size?: any;
    lazy?: any;
    column?: any;
    rowData?: any;
    align?: any;
    type?: any;
    imageError?: any;
}
/**
 * CellImage - React adapter for snice-cell-image
 *
 * This is an auto-generated React wrapper for the Snice cell-image component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-image';
 * import { CellImage } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellImage />;
 * }
 * ```
 */
export declare const CellImage: SniceReactComponent<CellImageProps, SniceComponentRef>;
//# sourceMappingURL=cell-image.d.ts.map