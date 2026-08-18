import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the LayoutCentered component
 */
export interface LayoutCenteredProps extends SniceBaseProps {
    width?: any;
    contained?: any;
    hasBrand?: any;
    hasFooter?: any;
}
/**
 * LayoutCentered - React adapter for snice-layout-centered
 *
 * This is an auto-generated React wrapper for the Snice layout-centered component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-centered';
 * import { LayoutCentered } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutCentered />;
 * }
 * ```
 */
export declare const LayoutCentered: SniceReactComponent<LayoutCenteredProps, SniceComponentRef>;
//# sourceMappingURL=layout-centered.d.ts.map