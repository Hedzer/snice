import type { SniceBaseProps } from './types';
/**
 * Props for the Breadcrumbs component
 */
export interface BreadcrumbsProps extends SniceBaseProps {
    items?: any;
    separator?: any;
    size?: any;
    maxItems?: any;
    collapsed?: any;
    renderTrigger?: any;
}
/**
 * Breadcrumbs - React adapter for snice-breadcrumbs
 *
 * This is an auto-generated React wrapper for the Snice breadcrumbs component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/breadcrumbs';
 * import { Breadcrumbs } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Breadcrumbs />;
 * }
 * ```
 */
export declare const Breadcrumbs: import("react").ForwardRefExoticComponent<Omit<BreadcrumbsProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=breadcrumbs.d.ts.map