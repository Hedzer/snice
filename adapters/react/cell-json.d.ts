import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellJson component
 */
export interface CellJsonProps extends SniceBaseProps {
    value?: any;
    collapsed?: any;
    maxDepth?: any;
    showToggle?: any;
    column?: any;
    rowData?: any;
    align?: any;
    type?: any;
}
/**
 * CellJson - React adapter for snice-cell-json
 *
 * This is an auto-generated React wrapper for the Snice cell-json component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-json';
 * import { CellJson } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellJson />;
 * }
 * ```
 */
export declare const CellJson: SniceReactComponent<CellJsonProps, SniceComponentRef>;
//# sourceMappingURL=cell-json.d.ts.map