import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Layout component
 */
export interface LayoutProps extends SniceBaseProps {
    contained?: any;
}
/**
 * Layout - React adapter for snice-layout
 *
 * This is an auto-generated React wrapper for the Snice layout component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout';
 * import { Layout } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Layout />;
 * }
 * ```
 */
export declare const Layout: SniceReactComponent<LayoutProps, SniceComponentRef>;
//# sourceMappingURL=layout.d.ts.map