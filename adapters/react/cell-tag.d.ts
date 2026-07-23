import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellTag component
 */
export interface CellTagProps extends SniceBaseProps {
    tags?: any;
    value?: any;
    variant?: any;
    column?: any;
    rowData?: any;
    align?: any;
    type?: any;
}
/**
 * CellTag - React adapter for snice-cell-tag
 *
 * This is an auto-generated React wrapper for the Snice cell-tag component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-tag';
 * import { CellTag } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellTag />;
 * }
 * ```
 */
export declare const CellTag: SniceReactComponent<CellTagProps, SniceComponentRef>;
//# sourceMappingURL=cell-tag.d.ts.map