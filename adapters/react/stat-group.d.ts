import type { SniceBaseProps } from './types';
/**
 * Props for the StatGroup component
 */
export interface StatGroupProps extends SniceBaseProps {
    stats?: any;
    columns?: any;
    variant?: any;
}
/**
 * StatGroup - React adapter for snice-stat-group
 *
 * This is an auto-generated React wrapper for the Snice stat-group component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/stat-group';
 * import { StatGroup } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StatGroup />;
 * }
 * ```
 */
export declare const StatGroup: import("react").ForwardRefExoticComponent<Omit<StatGroupProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=stat-group.d.ts.map