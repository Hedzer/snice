import type { SniceBaseProps } from './types';
/**
 * Props for the DataCard component
 */
export interface DataCardProps extends SniceBaseProps {
    fields?: any;
    editable?: any;
    variant?: any;
}
/**
 * DataCard - React adapter for snice-data-card
 *
 * This is an auto-generated React wrapper for the Snice data-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/data-card';
 * import { DataCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DataCard />;
 * }
 * ```
 */
export declare const DataCard: import("react").ForwardRefExoticComponent<Omit<DataCardProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=data-card.d.ts.map