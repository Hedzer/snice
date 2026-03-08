import type { SniceBaseProps } from './types';
/**
 * Props for the Spreadsheet component
 */
export interface SpreadsheetProps extends SniceBaseProps {
    data?: any;
    columns?: any;
    readonly?: any;
}
/**
 * Spreadsheet - React adapter for snice-spreadsheet
 *
 * This is an auto-generated React wrapper for the Snice spreadsheet component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spreadsheet';
 * import { Spreadsheet } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spreadsheet />;
 * }
 * ```
 */
export declare const Spreadsheet: import("react").ForwardRefExoticComponent<Omit<SpreadsheetProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=spreadsheet.d.ts.map