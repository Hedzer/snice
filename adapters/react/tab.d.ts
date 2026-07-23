import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Tab component
 */
export interface TabProps extends SniceBaseProps {
    disabled?: any;
    closable?: any;
    onTabClose?: (event: any) => void;
    onTabSelect?: (event: any) => void;
}
/**
 * Tab - React adapter for snice-tab
 *
 * This is an auto-generated React wrapper for the Snice tab component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tabs/snice-tab';
 * import { Tab } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tab />;
 * }
 * ```
 */
export declare const Tab: SniceReactComponent<TabProps, SniceComponentRef>;
//# sourceMappingURL=tab.d.ts.map