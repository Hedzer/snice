import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the LayoutCard component
 */
export interface LayoutCardProps extends SniceBaseProps {
    columns?: any;
    gap?: any;
}
/**
 * LayoutCard - React adapter for snice-layout-card
 *
 * This is an auto-generated React wrapper for the Snice layout-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-card';
 * import { LayoutCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutCard />;
 * }
 * ```
 */
export declare const LayoutCard: SniceReactComponent<LayoutCardProps, SniceComponentRef>;
//# sourceMappingURL=layout-card.d.ts.map