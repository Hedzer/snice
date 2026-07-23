import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellDuration component
 */
export interface CellDurationProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
}
/**
 * CellDuration - React adapter for snice-cell-duration
 *
 * This is an auto-generated React wrapper for the Snice cell-duration component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-duration';
 * import { CellDuration } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellDuration />;
 * }
 * ```
 */
export declare const CellDuration: SniceReactComponent<CellDurationProps, SniceComponentRef>;
//# sourceMappingURL=cell-duration.d.ts.map