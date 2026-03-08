import type { SniceBaseProps } from './types';
/**
 * Props for the Masonry component
 */
export interface MasonryProps extends SniceBaseProps {
    columns?: any;
    gap?: any;
    minColumnWidth?: any;
}
/**
 * Masonry - React adapter for snice-masonry
 *
 * This is an auto-generated React wrapper for the Snice masonry component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/masonry';
 * import { Masonry } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Masonry />;
 * }
 * ```
 */
export declare const Masonry: import("react").ForwardRefExoticComponent<Omit<MasonryProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=masonry.d.ts.map