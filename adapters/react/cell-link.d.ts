import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the CellLink component
 */
export interface CellLinkProps extends SniceBaseProps {
    value?: any;
    href?: any;
    target?: any;
    external?: any;
    icon?: any;
    text?: any;
    column?: any;
    rowData?: any;
    align?: any;
    type?: any;
}
/**
 * CellLink - React adapter for snice-cell-link
 *
 * This is an auto-generated React wrapper for the Snice cell-link component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-link';
 * import { CellLink } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellLink />;
 * }
 * ```
 */
export declare const CellLink: SniceReactComponent<CellLinkProps, SniceComponentRef>;
//# sourceMappingURL=cell-link.d.ts.map