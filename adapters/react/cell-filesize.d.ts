import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellFilesize component
 */
export interface CellFilesizeProps extends SniceBaseProps {
    align?: any;
    type?: any;
    value?: any;
    column?: any;
    rowData?: any;
}
/**
 * CellFilesize - React adapter for snice-cell-filesize
 *
 * This is an auto-generated React wrapper for the Snice cell-filesize component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-filesize';
 * import { CellFilesize } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellFilesize />;
 * }
 * ```
 */
export declare const CellFilesize: SniceReactComponent<CellFilesizeProps, SniceComponentRef>;
//# sourceMappingURL=cell-filesize.d.ts.map