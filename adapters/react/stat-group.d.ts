import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the StatGroup component
 */
export interface StatGroupProps extends SniceBaseProps {
    stats?: any;
    columns?: any;
    variant?: any;
    onStatClick?: (event: any) => void;
}
/**
 * StatGroup - React adapter for snice-stat-group
 *
 * This is an auto-generated React wrapper for the Snice stat-group component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/stat-group/snice-stat-group';
 * import { StatGroup } from 'snice/react';
 *
 * function MyComponent() {
 *   return <StatGroup />;
 * }
 * ```
 */
export declare const StatGroup: SniceReactComponent<StatGroupProps, SniceComponentRef>;
//# sourceMappingURL=stat-group.d.ts.map