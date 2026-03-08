import type { SniceBaseProps } from './types';
/**
 * Props for the Nav component
 */
export interface NavProps extends SniceBaseProps {
    variant?: any;
    orientation?: any;
    isTopLevel?: any;
}
/**
 * Nav - React adapter for snice-nav
 *
 * This is an auto-generated React wrapper for the Snice nav component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/nav';
 * import { Nav } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Nav />;
 * }
 * ```
 */
export declare const Nav: import("react").ForwardRefExoticComponent<Omit<NavProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=nav.d.ts.map