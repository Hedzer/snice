import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
}
/**
 * Link - React adapter for snice-link
 *
 * This is an auto-generated React wrapper for the Snice link component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/link/snice-link';
 * import { Link } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Link />;
 * }
 * ```
 */
export declare const Link: SniceReactComponent<LinkProps, SniceComponentRef>;
//# sourceMappingURL=link.d.ts.map