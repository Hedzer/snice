import type { SniceBaseProps } from './types';
/**
 * Props for the Link component
 */
export interface LinkProps extends SniceBaseProps {
    href?: any;
    target?: any;
    variant?: any;
    disabled?: any;
    external?: any;
    underline?: any;
    hash?: any;
    onClick?: (event: any) => void;
}
/**
 * Link - React adapter for snice-link
 *
 * This is an auto-generated React wrapper for the Snice link component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/link';
 * import { Link } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Link />;
 * }
 * ```
 */
export declare const Link: import("react").ForwardRefExoticComponent<Omit<LinkProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=link.d.ts.map