import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellRating component
 */
export interface CellRatingProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
}
/**
 * CellRating - React adapter for snice-cell-rating
 *
 * This is an auto-generated React wrapper for the Snice cell-rating component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-rating';
 * import { CellRating } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellRating />;
 * }
 * ```
 */
export declare const CellRating: SniceReactComponent<CellRatingProps, SniceComponentRef>;
//# sourceMappingURL=cell-rating.d.ts.map