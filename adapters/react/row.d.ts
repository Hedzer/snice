import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Row component
 */
export interface RowProps extends SniceBaseProps {
    selected?: any;
    hoverable?: any;
    clickable?: any;
    selectable?: any;
    selectionDisabled?: any;
    data?: any;
    index?: any;
    columns?: any;
    onRowClick?: (event: any) => void;
    onRowSelect?: (event: any) => void;
    onRowHover?: (event: any) => void;
}
/**
 * Row - React adapter for snice-row
 *
 * This is an auto-generated React wrapper for the Snice row component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-row';
 * import { Row } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Row />;
 * }
 * ```
 */
export declare const Row: SniceReactComponent<RowProps, SniceComponentRef>;
//# sourceMappingURL=row.d.ts.map