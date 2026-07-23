import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the SplitPane component
 */
export interface SplitPaneProps extends SniceBaseProps {
    direction?: any;
    primarySize?: any;
    minPrimarySize?: any;
    minSecondarySize?: any;
    snapSize?: any;
    disabled?: any;
    onPaneResize?: (event: any) => void;
}
/**
 * SplitPane - React adapter for snice-split-pane
 *
 * This is an auto-generated React wrapper for the Snice split-pane component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/split-pane/snice-split-pane';
 * import { SplitPane } from 'snice/react';
 *
 * function MyComponent() {
 *   return <SplitPane />;
 * }
 * ```
 */
export declare const SplitPane: SniceReactComponent<SplitPaneProps, SniceComponentRef>;
//# sourceMappingURL=split-pane.d.ts.map