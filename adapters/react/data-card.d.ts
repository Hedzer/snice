import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the DataCard component
 */
export interface DataCardProps extends SniceBaseProps {
    fields?: any;
    editable?: any;
    variant?: any;
    onFieldChange?: (event: any) => void;
    onFieldSave?: (event: any) => void;
}
/**
 * DataCard - React adapter for snice-data-card
 *
 * This is an auto-generated React wrapper for the Snice data-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/data-card/snice-data-card';
 * import { DataCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DataCard />;
 * }
 * ```
 */
export declare const DataCard: SniceReactComponent<DataCardProps, SniceComponentRef>;
//# sourceMappingURL=data-card.d.ts.map