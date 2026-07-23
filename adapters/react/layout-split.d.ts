import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the LayoutSplit component
 */
export interface LayoutSplitProps extends SniceBaseProps {
    direction?: any;
    ratio?: any;
}
/**
 * LayoutSplit - React adapter for snice-layout-split
 *
 * This is an auto-generated React wrapper for the Snice layout-split component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-split';
 * import { LayoutSplit } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutSplit />;
 * }
 * ```
 */
export declare const LayoutSplit: SniceReactComponent<LayoutSplitProps, SniceComponentRef>;
//# sourceMappingURL=layout-split.d.ts.map