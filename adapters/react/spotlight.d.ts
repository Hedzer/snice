import type { SniceBaseProps } from './types';
/**
 * Props for the Spotlight component
 */
export interface SpotlightProps extends SniceBaseProps {
    steps?: any;
    currentIndex?: any;
    active?: any;
}
/**
 * Spotlight - React adapter for snice-spotlight
 *
 * This is an auto-generated React wrapper for the Snice spotlight component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spotlight';
 * import { Spotlight } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spotlight />;
 * }
 * ```
 */
export declare const Spotlight: import("react").ForwardRefExoticComponent<Omit<SpotlightProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=spotlight.d.ts.map