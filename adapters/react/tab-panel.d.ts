import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the TabPanel component
 */
export interface TabPanelProps extends SniceBaseProps {
    name?: any;
    transitionIn?: any;
    transitionOut?: any;
    transitioning?: any;
    transitionDuration?: any;
}
/**
 * TabPanel - React adapter for snice-tab-panel
 *
 * This is an auto-generated React wrapper for the Snice tab-panel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tabs/snice-tab-panel';
 * import { TabPanel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TabPanel />;
 * }
 * ```
 */
export declare const TabPanel: SniceReactComponent<TabPanelProps, SniceComponentRef>;
//# sourceMappingURL=tab-panel.d.ts.map