import type { SniceBaseProps } from './types';
/**
 * Props for the Treemap component
 */
export interface TreemapProps extends SniceBaseProps {
    data?: any;
    showLabels?: any;
    showValues?: any;
    colorScheme?: any;
    padding?: any;
    animation?: any;
}
/**
 * Treemap - React adapter for snice-treemap
 *
 * This is an auto-generated React wrapper for the Snice treemap component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/treemap';
 * import { Treemap } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Treemap />;
 * }
 * ```
 */
export declare const Treemap: import("react").ForwardRefExoticComponent<Omit<TreemapProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=treemap.d.ts.map