import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Header component
 */
export interface HeaderProps extends SniceBaseProps {
    sticky?: any;
    columns?: any;
    selectable?: any;
    sortable?: any;
    currentSort?: any;
    allSelected?: any;
    someSelected?: any;
    onHeaderSort?: (event: any) => void;
    onHeaderSelectAll?: (event: any) => void;
    onHeaderFilter?: (event: any) => void;
}
/**
 * Header - React adapter for snice-header
 *
 * This is an auto-generated React wrapper for the Snice header component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-header';
 * import { Header } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Header />;
 * }
 * ```
 */
export declare const Header: SniceReactComponent<HeaderProps, SniceComponentRef>;
//# sourceMappingURL=header.d.ts.map